/* Wasted — app logic: state, hash routing, scoring, rendering */
(() => {
  'use strict';

  // ---------- persistence ----------
  const KEY_SAVED = 'wasted.saved';
  const KEY_ANSWERS = 'wasted.answers';
  const KEY_SERVINGS = 'wasted.servings';
  const SERVINGS_MIN = 1, SERVINGS_MAX = 12;
  const load = (k, fallback) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? fallback; } catch { return fallback; } };
  const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode: ignore */ } };
  const clampServings = n => Math.min(SERVINGS_MAX, Math.max(SERVINGS_MIN, parseInt(n, 10) || 1));

  const state = {
    answers: load(KEY_ANSWERS, {}),
    saved: load(KEY_SAVED, []),
    servings: clampServings(load(KEY_SERVINGS, 1)),
    step: 0,
    offset: 0,
    ranked: null,
    lastResultsHash: '#/results',
  };

  const byId = Object.fromEntries(COCKTAILS.map(c => [c.id, c]));
  const app = document.getElementById('app');
  const navSavedCount = document.getElementById('nav-saved-count');
  const toastEl = document.getElementById('toast');

  // ---------- icons (single stroke system, 1.75) ----------
  const I = {
    bookmark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-4-6 4z"/></svg>',
    arrowRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    arrowLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.5-5.8M20 4v5h-5"/></svg>',
    shuffle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 16.9l-5.3 2.8 1.1-5.9L3.5 9.7l5.9-.8z"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/></svg>',
    minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    people: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.4c2 .8 3 2.6 3 5.6"/></svg>',
  };

  // ---------- servings: scale quantities ----------
  const UNIT_PLURAL = { trait: 'traits', rinçage: 'rinçages', morceau: 'morceaux', pincée: 'pincées', cuillère: 'cuillères' };
  const NAME_PLURAL = { "blanc d'œuf": "blancs d'œuf", 'morceau de sucre': 'morceaux de sucre', 'feuille de menthe': 'feuilles de menthe' };
  const fmtNum = v => (Number.isInteger(v) ? String(v) : String(Math.round(v * 10) / 10).replace('.', ','));
  // '22 ml' → '66 ml'; '2 traits' → '6 traits'; '1 rinçage' → '3 rinçages'; '6' → '18'; 'top' / '' unchanged
  function scaleQty(q, n) {
    const m = /^(\d+(?:[.,]\d+)?)\s*(.*)$/.exec(q.trim());
    if (!m) return q;
    const value = parseFloat(m[1].replace(',', '.')) * n;
    let unit = m[2].trim();
    if (unit) {
      const singular = unit.replace(/s$/, '');
      if (value > 1 && UNIT_PLURAL[singular]) unit = UNIT_PLURAL[singular];
      else if (value <= 1 && UNIT_PLURAL[singular]) unit = singular;
    }
    return unit ? `${fmtNum(value)} ${unit}` : fmtNum(value);
  }
  function scaleName(name, q, n) {
    // only bare counts ('1', '6') pluralise their noun; measured units keep the noun as written
    if (!/^\d+(?:[.,]\d+)?$/.test(q.trim())) return name;
    const value = parseFloat(q.replace(',', '.')) * n;
    if (value > 1 && NAME_PLURAL[name]) return NAME_PLURAL[name];
    if (value <= 1) { const sing = Object.entries(NAME_PLURAL).find(([, pl]) => pl === name); if (sing) return sing[0]; }
    return name;
  }
  const servingsLabel = n => `${n} personne${n > 1 ? 's' : ''}`;
  function ingredientsHTML(c, n) {
    return c.ingredients.map(([q, name]) => `<li><span class="qty">${esc(scaleQty(q, n))}</span><span>${esc(scaleName(name, q, n))}</span></li>`).join('');
  }
  function servingsNote(c, n) {
    if (n < 3) return '';
    const shaken = c.steps.some(s => /shaker|remuer|swizzler|mixer/i.test(s));
    return shaken ? `Pour ${n} verres, prépare par lots de 2 : un shaker ou un verre à mélange ne refroidit pas bien au-delà.` : `Pour ${n} verres, monte-les un par un directement dans chaque verre.`;
  }

  // ---------- glass illustrations (liquid tinted per cocktail) ----------
  function glassSVG(type, color, id) {
    const uid = `g-${id}-${type}`;
    const glassStroke = '#241407';
    const shine = `<linearGradient id="${uid}-sh" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".35" stop-color="#fff" stop-opacity=".05"/><stop offset="1" stop-color="#fff" stop-opacity=".2"/></linearGradient>`;
    const liq = `<linearGradient id="${uid}-lq" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".92"/><stop offset="1" stop-color="${color}"/></linearGradient>`;
    const wrap = (inner, vb = '0 0 200 260') => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true"><defs>${shine}${liq}</defs>${inner}</svg>`;
    switch (type) {
      case 'coupe':
        return wrap(`
          <path d="M28 40h144c0 44-22 82-72 90-50-8-72-46-72-90z" fill="#FFF7EA" fill-opacity=".5" stroke="${glassStroke}" stroke-width="3"/>
          <path d="M40 56h120c-3 32-24 60-60 66-36-6-57-34-60-66z" fill="url(#${uid}-lq)"/>
          <path d="M40 56h120c-3 32-24 60-60 66-36-6-57-34-60-66z" fill="url(#${uid}-sh)"/>
          <path d="M100 130v82" stroke="${glassStroke}" stroke-width="3" stroke-linecap="round"/>
          <path d="M60 226c0-8 18-14 40-14s40 6 40 14" stroke="${glassStroke}" stroke-width="3" stroke-linecap="round" fill="none"/>
          <path d="M60 226h80" stroke="${glassStroke}" stroke-width="3" stroke-linecap="round"/>`);
      case 'rocks':
        return wrap(`
          <path d="M40 60l8 150c.5 8 6 14 14 14h76c8 0 13.5-6 14-14l8-150z" fill="#FFF7EA" fill-opacity=".5" stroke="${glassStroke}" stroke-width="3" stroke-linejoin="round"/>
          <path d="M46 112l5 98c.4 6 4.6 10 10.6 10h76.8c6 0 10.2-4 10.6-10l5-98z" fill="url(#${uid}-lq)"/>
          <path d="M46 112l5 98c.4 6 4.6 10 10.6 10h76.8c6 0 10.2-4 10.6-10l5-98z" fill="url(#${uid}-sh)"/>
          <rect x="72" y="118" width="56" height="52" rx="8" fill="#fff" fill-opacity=".55" stroke="#fff" stroke-opacity=".8" stroke-width="2" transform="rotate(-8 100 144)"/>
          <path d="M40 60h120" stroke="${glassStroke}" stroke-width="3" stroke-linecap="round"/>`);
      case 'highball':
        return wrap(`
          <path d="M56 30h88l-6 196c-.3 6-5 10-11 10H73c-6 0-10.7-4-11-10z" fill="#FFF7EA" fill-opacity=".5" stroke="${glassStroke}" stroke-width="3" stroke-linejoin="round"/>
          <path d="M60 78h80l-4.5 148c-.2 4-3.5 6-7.5 6H72c-4 0-7.3-2-7.5-6z" fill="url(#${uid}-lq)"/>
          <path d="M60 78h80l-4.5 148c-.2 4-3.5 6-7.5 6H72c-4 0-7.3-2-7.5-6z" fill="url(#${uid}-sh)"/>
          <rect x="70" y="92" width="40" height="38" rx="6" fill="#fff" fill-opacity=".5" stroke="#fff" stroke-opacity=".8" stroke-width="2" transform="rotate(10 90 111)"/>
          <rect x="86" y="146" width="40" height="38" rx="6" fill="#fff" fill-opacity=".5" stroke="#fff" stroke-opacity=".8" stroke-width="2" transform="rotate(-14 106 165)"/>
          <path d="M56 30h88" stroke="${glassStroke}" stroke-width="3" stroke-linecap="round"/>`);
      case 'flute':
        return wrap(`
          <path d="M74 26h52l-4 96c-1 18-10 30-22 34-12-4-21-16-22-34z" fill="#FFF7EA" fill-opacity=".5" stroke="${glassStroke}" stroke-width="3" stroke-linejoin="round"/>
          <path d="M77 60h46l-3 62c-.8 16-8.4 26.5-20 30-11.6-3.5-19.2-14-20-30z" fill="url(#${uid}-lq)"/>
          <path d="M77 60h46l-3 62c-.8 16-8.4 26.5-20 30-11.6-3.5-19.2-14-20-30z" fill="url(#${uid}-sh)"/>
          <circle cx="90" cy="100" r="3" fill="#fff" fill-opacity=".8"/><circle cx="106" cy="84" r="2.4" fill="#fff" fill-opacity=".8"/><circle cx="98" cy="126" r="2.6" fill="#fff" fill-opacity=".8"/><circle cx="110" cy="112" r="2" fill="#fff" fill-opacity=".8"/>
          <path d="M100 156v66" stroke="${glassStroke}" stroke-width="3" stroke-linecap="round"/>
          <path d="M66 232c0-7 15-12 34-12s34 5 34 12" stroke="${glassStroke}" stroke-width="3" stroke-linecap="round" fill="none"/>
          <path d="M66 232h68" stroke="${glassStroke}" stroke-width="3" stroke-linecap="round"/>`);
      case 'tiki':
      default:
        return wrap(`
          <path d="M60 34h80l4 60-10 24 8 26-6 30 8 30c1 8-5 14-13 14H69c-8 0-14-6-13-14l8-30-6-30 8-26-10-24z" fill="#FFF7EA" fill-opacity=".5" stroke="${glassStroke}" stroke-width="3" stroke-linejoin="round"/>
          <path d="M64 88h72l-8 22 8 26-6 30 7 26c.8 6-3.5 10-9.5 10H72.5c-6 0-10.3-4-9.5-10l7-26-6-30 8-26z" fill="url(#${uid}-lq)"/>
          <path d="M64 88h72l-8 22 8 26-6 30 7 26c.8 6-3.5 10-9.5 10H72.5c-6 0-10.3-4-9.5-10l7-26-6-30 8-26z" fill="url(#${uid}-sh)"/>
          <path d="M78 120h44M80 158h40M82 196h36" stroke="${glassStroke}" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>
          <path d="M84 20l8 14M116 20l-8 14" stroke="#4E7A3A" stroke-width="4" stroke-linecap="round"/>
          <path d="M60 34h80" stroke="${glassStroke}" stroke-width="3" stroke-linecap="round"/>`);
    }
  }

  // ---------- scoring ----------
  function arr(v) { return Array.isArray(v) ? v : (v == null ? [] : [v]); }
  function score(c, a) {
    let s = 0; const hits = [];
    const bases = arr(a.base);
    if (bases.length) {
      if (bases.includes(c.base[0])) { s += 7; hits.push(LABELS.base[c.base[0]]); }
      else if (c.base.slice(1).some(b => bases.includes(b))) { s += 3; hits.push(LABELS.base[c.base.find(b => bases.includes(b))]); }
      else s -= 4;
    }
    if (a.strength != null) {
      const d = Math.abs(c.strength - a.strength);
      s += d === 0 ? 3 : d === 1 ? 0 : -3;
      if (d === 0) hits.push(LABELS.strength[c.strength]);
    }
    if (a.style && c.style.includes(a.style)) { s += 3; hits.push(LABELS.style[a.style]); }
    if (a.bitter) {
      if (a.bitter === 'love') { s += c.bitter * 2.5; if (c.bitter === 2) hits.push('Bien amer'); }
      else if (a.bitter === 'some') { s += c.bitter === 1 ? 2.5 : c.bitter === 0 ? 1 : -.5; if (c.bitter === 1) hits.push('Amertume légère'); }
      else { s += c.bitter === 0 ? 3 : c.bitter === 1 ? -1.5 : -6; }
    }
    if (a.ss) {
      if (c.ss === a.ss) { s += 3; hits.push(LABELS.ss[c.ss]); }
      else if (c.ss === 'balanced' || a.ss === 'balanced') s += 1;
      else s -= 2;
    }
    const notes = arr(a.notes).filter(n => n !== 'none');
    if (arr(a.notes).includes('none')) { s += c.notes.length === 0 ? 2.5 : -1 * c.notes.length; }
    notes.forEach(n => { if (c.notes.includes(n)) { s += 3; hits.push(LABELS.notes[n]); } });
    if (a.texture) {
      if (c.texture === a.texture) { s += a.texture === 'crisp' ? 2 : 5; if (a.texture !== 'crisp') hits.push(LABELS.texture[a.texture]); }
      else if (a.texture !== 'crisp') s -= 2;
    }
    const citrus = arr(a.citrus).filter(x => x !== 'none');
    if (arr(a.citrus).includes('none')) { s += c.citrus.length === 0 ? 3 : -1.5; }
    citrus.forEach(x => { if (c.citrus.includes(x)) { s += 2; hits.push(LABELS.citrus[x]); } });
    const sun = arr(a.sun).filter(x => x !== 'none');
    sun.forEach(x => { if (c.sun.includes(x)) { s += 3.5; hits.push(LABELS.sun[x]); } });
    if (sun.length && c.sun.length === 0) s -= .5;
    const berry = arr(a.berry).filter(x => x !== 'none');
    berry.forEach(x => { if (c.berry.includes(x)) { s += 3.5; hits.push(LABELS.berry[x]); } });
    return { s, hits: [...new Set(hits)] };
  }

  function rank(a) {
    return COCKTAILS.map(c => ({ c, ...score(c, a) })).sort((x, y) => y.s - x.s);
  }

  // pick 3 with distinct primary bases when possible, starting at an offset in the ranking
  function pickThree(ranked, offset) {
    const pool = ranked.slice(offset);
    const out = []; const seen = new Set();
    for (const r of pool) { if (out.length === 3) break; if (!seen.has(r.c.base[0])) { out.push(r); seen.add(r.c.base[0]); } }
    for (const r of pool) { if (out.length === 3) break; if (!out.includes(r)) out.push(r); }
    return out;
  }

  // ---------- helpers ----------
  const esc = s => String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const isSaved = id => state.saved.includes(id);
  const answered = () => QUESTIONS.every(q => { const v = state.answers[q.id]; return q.multi ? arr(v).length > 0 : v != null; });
  let toastTimer;
  function toast(msg) {
    toastEl.innerHTML = `${I.check}<span>${esc(msg)}</span>`;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }
  function toggleSave(id) {
    if (isSaved(id)) { state.saved = state.saved.filter(x => x !== id); toast(`${byId[id].name} retiré de ta liste`); }
    else { state.saved = [...state.saved, id]; toast(`${byId[id].name} sauvegardé`); }
    store(KEY_SAVED, state.saved);
    updateNav();
    document.querySelectorAll(`[data-save="${id}"]`).forEach(b => { b.setAttribute('aria-pressed', String(isSaved(id))); b.setAttribute('aria-label', isSaved(id) ? 'Retirer de mes cocktails' : 'Sauvegarder'); });
    document.querySelectorAll(`[data-save-label="${id}"]`).forEach(b => { b.innerHTML = `${I.bookmark}<span>${isSaved(id) ? 'Sauvegardé' : 'Sauvegarder'}</span>`; b.setAttribute('aria-pressed', String(isSaved(id))); });
    if (location.hash.startsWith('#/saved')) render();
  }
  function updateNav() {
    navSavedCount.textContent = state.saved.length;
    navSavedCount.hidden = state.saved.length === 0;
    const route = location.hash.split('/')[1] || 'home';
    document.querySelectorAll('.nav button').forEach(b => {
      const on = b.dataset.route === route || (b.dataset.route === 'quiz' && (route === 'results' || route === 'recipe'));
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
  }
  const go = hash => { if (location.hash === hash) render(); else location.hash = hash; };

  // ---------- views ----------
  function viewHome() {
    const resume = Object.keys(state.answers).length > 0;
    return `
    <section class="view hero">
      <div class="hero-copy">
        <h1>Trouve le cocktail que tu ne connais <em>pas encore.</em></h1>
        <p class="lede">Dix questions sur ce que tu aimes boire, et Wasted te sert trois cocktails de la face cachée du répertoire. Pas de Mojito, pas de Spritz : des recettes que ton bar préféré garde pour les habitués.</p>
        <div class="hero-meta">
          <span>${I.clock} 2 minutes</span>
          <span>${I.list} ${COCKTAILS.length} cocktails de niche</span>
          <span>${I.bookmark} Recettes à sauvegarder</span>
        </div>
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <button class="btn btn-primary btn-lg" data-go="#/quiz/0">Commencer le quiz ${I.arrowRight}</button>
          ${resume && answered() ? `<button class="btn btn-ghost btn-lg" data-go="#/results">Revoir mes résultats</button>` : ''}
        </div>
      </div>
      <div class="hero-art" aria-hidden="true">
        <div class="sun"></div>
        <div class="hero-glass">${glassSVG('coupe', '#E8672B', 'hero')}</div>
        <div class="hero-stamp">Paper Plane, Jungle Bird, Trinidad Sour…</div>
      </div>
    </section>
    <section class="view home-strip">
      <div><h3>Trois alcools, quatre saveurs, trois fruits</h3><p>Le quiz avance du spiritueux vers le détail. Chaque réponse pèse dans le classement, rien n'est décoratif.</p></div>
      <div><h3>Que du niche</h3><p>Des recettes de Death &amp; Co, du Savoy, de Milk &amp; Honey ou d'un hôtel de Kuala Lumpur en 1978. Aucune que tu commandes déjà.</p></div>
      <div><h3>La recette, pas juste le nom</h3><p>Doses en millilitres, méthode, verre et garniture. Sauvegarde ce que tu veux faire, tout reste sur ton appareil.</p></div>
    </section>`;
  }

  function viewQuiz(step) {
    step = Math.min(Math.max(step, 0), QUESTIONS.length - 1);
    state.step = step;
    const q = QUESTIONS[step];
    const val = state.answers[q.id];
    const selected = q.multi ? arr(val) : val;
    const fills = SECTIONS.map(sec => {
      const qs = QUESTIONS.map((x, i) => ({ x, i })).filter(o => o.x.section === sec.id);
      const done = qs.filter(o => o.i < step).length + (qs.some(o => o.i === step) ? .5 : 0);
      return Math.min(1, done / qs.length);
    });
    const canNext = q.multi ? selected.length > 0 : selected != null;
    const narrow = q.options.every(o => !o.d);
    return `
    <section class="view quiz">
      <div class="progress" aria-label="Progression">
        <div class="progress-track">${fills.map(f => `<div class="seg" style="--fill:${f}"></div>`).join('')}</div>
        <div class="progress-labels">${SECTIONS.map(s => `<span data-active="${s.id === q.section}">${s.label}</span>`).join('')}</div>
        <div class="progress-count"><span>Question ${step + 1} sur ${QUESTIONS.length}</span></div>
      </div>
      <div class="question" key="${q.id}">
        <h2 id="q-title">${esc(q.title)}</h2>
        ${q.hint ? `<p class="hint">${esc(q.hint)}</p>` : ''}
        <div class="options ${narrow ? 'narrow' : ''}" role="${q.multi ? 'group' : 'radiogroup'}" aria-labelledby="q-title">
          ${q.options.map(o => {
            const on = q.multi ? selected.includes(o.v) : selected === o.v;
            const attrs = q.multi ? `aria-pressed="${on}"` : `role="radio" aria-checked="${on}"`;
            return `<button class="opt" ${attrs} data-opt="${esc(o.v)}"><span class="l">${esc(o.l)}</span>${o.d ? `<span class="d">${esc(o.d)}</span>` : ''}<span class="check">${I.check}</span></button>`;
          }).join('')}
        </div>
        <div class="quiz-nav">
          <button class="btn btn-ghost" data-go="${step === 0 ? '#/home' : `#/quiz/${step - 1}`}">${I.arrowLeft} ${step === 0 ? 'Accueil' : 'Retour'}</button>
          <button class="btn btn-primary" id="next" ${canNext ? '' : 'disabled'}>${step === QUESTIONS.length - 1 ? 'Voir mes cocktails' : 'Suivant'} ${I.arrowRight}</button>
        </div>
      </div>
    </section>`;
  }

  function summary(a) {
    const bits = [];
    const bases = arr(a.base).map(b => LABELS.base[b]).filter(Boolean);
    if (bases.length) bits.push(bases.length > 2 ? `${bases.slice(0, 2).join(', ')} et ${bases.length - 2} autre${bases.length > 3 ? 's' : ''}` : bases.join(' et '));
    if (a.strength) bits.push(LABELS.strength[a.strength].toLowerCase());
    if (a.bitter === 'love') bits.push('bien amer'); else if (a.bitter === 'no') bits.push('sans amertume');
    const notes = arr(a.notes).filter(n => n !== 'none').map(n => LABELS.notes[n].toLowerCase());
    if (notes.length) bits.push(notes.join(', '));
    const fruits = [...arr(a.citrus), ...arr(a.sun), ...arr(a.berry)].filter(x => x !== 'none').map(x => (LABELS.citrus[x] || LABELS.sun[x] || LABELS.berry[x] || '').toLowerCase()).filter(Boolean);
    if (fruits.length) bits.push(fruits.slice(0, 3).join(', '));
    return bits.length ? `Tu aimes ${bits.join(' · ')}.` : '';
  }

  function cardHTML(r, i, lead) {
    const c = r.c;
    return `
    <article class="card ${lead ? 'lead' : ''}" style="--i:${i}">
      <div class="card-art" style="background:linear-gradient(160deg, ${c.color}33, ${c.color}99 60%, ${c.color}cc)">${glassSVG(c.glass, c.color, c.id)}</div>
      <div class="card-body">
        ${lead ? `<span class="badge">${I.star} Meilleur accord</span>` : ''}
        <div>
          <h3>${esc(c.name)}</h3>
          <p class="origin">${esc(c.origin)}</p>
        </div>
        <p class="tagline">${esc(c.tagline)}</p>
        <div class="chips">
          <span class="chip">${esc(LABELS.base[c.base[0]])}</span>
          <span class="chip">${esc(LABELS.strength[c.strength])}</span>
          ${r.hits.filter(h => h !== LABELS.base[c.base[0]] && h !== LABELS.strength[c.strength]).slice(0, lead ? 5 : 3).map(h => `<span class="chip hit">${esc(h)}</span>`).join('')}
        </div>
        <div class="card-actions">
          <button class="btn btn-primary" data-go="#/recipe/${c.id}">Voir la recette ${I.arrowRight}</button>
          <button class="icon-btn" data-save="${c.id}" aria-pressed="${isSaved(c.id)}" aria-label="${isSaved(c.id) ? 'Retirer de mes cocktails' : 'Sauvegarder'}">${I.bookmark}</button>
        </div>
      </div>
    </article>`;
  }

  function viewResults() {
    if (!answered()) { location.replace('#/quiz/0'); return ''; }
    if (!state.ranked) state.ranked = rank(state.answers);
    const picks = pickThree(state.ranked, state.offset);
    const more = state.offset + 3 < state.ranked.length - 2;
    return `
    <section class="view">
      <div class="results-head">
        <h2>${state.offset === 0 ? 'Tes trois cocktails' : 'Trois autres pistes'}</h2>
        <p class="lede">${esc(summary(state.answers))} ${state.offset === 0 ? 'Voici ce que le bar te servirait sans te demander ton avis.' : 'Un peu plus loin dans le classement, toujours dans tes goûts.'}</p>
      </div>
      <div class="results reveal">
        ${picks.map((r, i) => cardHTML(r, i, i === 0)).join('')}
      </div>
      <div class="results-foot">
        ${more ? `<button class="btn btn-ghost" id="more">${I.shuffle} Voir 3 autres</button>` : ''}
        <button class="btn btn-ghost" id="restart">${I.refresh} Refaire le quiz</button>
        ${state.saved.length ? `<button class="btn btn-ghost" data-go="#/saved">${I.bookmark} Mes cocktails (${state.saved.length})</button>` : ''}
      </div>
    </section>`;
  }

  function viewRecipe(id) {
    const c = byId[id];
    if (!c) return `<section class="view empty"><h2>Ce cocktail n'existe pas</h2><p>Le lien est peut-être incomplet.</p><button class="btn btn-primary" data-go="#/home">Retour à l'accueil</button></section>`;
    const back = state.lastResultsHash;
    const backLabel = back.startsWith('#/saved') ? 'Mes cocktails' : answered() ? 'Mes résultats' : 'Accueil';
    return `
    <section class="view recipe">
      <div class="recipe-art" style="background:linear-gradient(160deg, ${c.color}33, ${c.color}99 60%, ${c.color}cc)">${glassSVG(c.glass, c.color, c.id + '-r')}</div>
      <div class="recipe-body">
        <div class="recipe-title">
          <button class="btn btn-ghost btn-sm" data-go="${back}" style="justify-self:start">${I.arrowLeft} ${backLabel}</button>
          <h1>${esc(c.name)}</h1>
          <p class="origin">${esc(c.origin)}</p>
          <p class="lede">${esc(c.tagline)}</p>
          <div class="chips">
            <span class="chip">${esc(LABELS.base[c.base[0]])}</span>
            <span class="chip">${esc(LABELS.strength[c.strength])}</span>
            <span class="chip">${esc(LABELS.bitter[c.bitter])}</span>
            <span class="chip">${esc(LABELS.ss[c.ss])}</span>
            ${c.notes.map(n => `<span class="chip">${esc(LABELS.notes[n])}</span>`).join('')}
            ${c.texture !== 'crisp' ? `<span class="chip">${esc(LABELS.texture[c.texture])}</span>` : ''}
          </div>
          <div class="recipe-actions">
            <button class="btn btn-primary" data-save-label="${c.id}" aria-pressed="${isSaved(c.id)}">${I.bookmark}<span>${isSaved(c.id) ? 'Sauvegardé' : 'Sauvegarder'}</span></button>
          </div>
        </div>
        <section>
          <div class="section-head">
            <h2>Ingrédients</h2>
            <div class="serv" role="group" aria-label="Nombre de personnes">
              <button class="serv-btn" data-serv="-1" aria-label="Une personne de moins" ${state.servings <= SERVINGS_MIN ? 'disabled' : ''}>${I.minus}</button>
              <span class="serv-n">${I.people}<span id="serv-label" aria-live="polite">${servingsLabel(state.servings)}</span></span>
              <button class="serv-btn" data-serv="1" aria-label="Une personne de plus" ${state.servings >= SERVINGS_MAX ? 'disabled' : ''}>${I.plus}</button>
            </div>
          </div>
          <ul class="ingredients" id="ing-list" data-cocktail="${c.id}">${ingredientsHTML(c, state.servings)}</ul>
          <p class="serv-note" id="serv-note" ${servingsNote(c, state.servings) ? '' : 'hidden'}>${esc(servingsNote(c, state.servings))}</p>
        </section>
        <section>
          <h2>Préparation</h2>
          <ol class="steps">${c.steps.map(s => `<li><span>${esc(s)}</span></li>`).join('')}</ol>
        </section>
        <section>
          <dl class="kv">
            <div><dt>Verre</dt><dd>${esc(LABELS.glass[c.glass])}</dd></div>
            <div><dt>Garniture</dt><dd>${esc(c.garnish)}</dd></div>
          </dl>
        </section>
      </div>
    </section>`;
  }

  function viewSaved() {
    const list = state.saved.map(id => byId[id]).filter(Boolean);
    if (!list.length) return `
      <section class="view">
        <div class="saved-head"><h2>Mes cocktails</h2></div>
        <div class="empty">
          ${glassSVG('coupe', '#F6A823', 'empty')}
          <h2>Rien dans ta liste pour l'instant</h2>
          <p>Fais le quiz, puis appuie sur le marque-page d'un cocktail pour garder sa recette ici.</p>
          <button class="btn btn-primary" data-go="${answered() ? '#/results' : '#/quiz/0'}">${answered() ? 'Revoir mes résultats' : 'Commencer le quiz'} ${I.arrowRight}</button>
        </div>
      </section>`;
    return `
    <section class="view">
      <div class="saved-head">
        <div><h2>Mes cocktails</h2><p class="lede">${list.length} recette${list.length > 1 ? 's' : ''} à faire. Tout reste sur cet appareil.</p></div>
        <button class="btn btn-ghost btn-sm" data-go="${answered() ? '#/results' : '#/quiz/0'}">${I.refresh} ${answered() ? 'Mes résultats' : 'Faire le quiz'}</button>
      </div>
      <ul class="saved-list">
        ${list.map((c, i) => `
        <li class="saved-row" style="animation-delay:${i * 50}ms">
          <div class="saved-thumb" style="background:linear-gradient(160deg, ${c.color}44, ${c.color}bb)">${glassSVG(c.glass, c.color, c.id + '-s')}</div>
          <div><h3>${esc(c.name)}</h3><p class="origin">${esc(LABELS.base[c.base[0]])} · ${esc(c.origin)}</p></div>
          <div class="row-actions">
            <button class="btn btn-primary btn-sm" data-go="#/recipe/${c.id}">Recette ${I.arrowRight}</button>
            <button class="icon-btn" data-save="${c.id}" aria-pressed="true" aria-label="Retirer de mes cocktails">${I.trash}</button>
          </div>
        </li>`).join('')}
      </ul>
    </section>`;
  }

  // ---------- router ----------
  function render() {
    const [, route = 'home', param] = location.hash.split('/');
    let html = '';
    switch (route) {
      case 'quiz': html = viewQuiz(parseInt(param || '0', 10) || 0); break;
      case 'results': state.lastResultsHash = '#/results'; html = viewResults(); break;
      case 'recipe': html = viewRecipe(param); break;
      case 'saved': state.lastResultsHash = '#/saved'; html = viewSaved(); break;
      default: html = viewHome();
    }
    app.innerHTML = html;
    updateNav();
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    const h = app.querySelector('h1, h2'); if (h && route !== 'home') { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }

  // ---------- events ----------
  app.addEventListener('click', e => {
    const goBtn = e.target.closest('[data-go]'); if (goBtn) { go(goBtn.dataset.go); return; }
    const saveBtn = e.target.closest('[data-save], [data-save-label]'); if (saveBtn) { toggleSave(saveBtn.dataset.save || saveBtn.dataset.saveLabel); return; }
    const servBtn = e.target.closest('[data-serv]');
    if (servBtn) {
      const list = document.getElementById('ing-list'); const c = list && byId[list.dataset.cocktail]; if (!c) return;
      state.servings = clampServings(state.servings + parseInt(servBtn.dataset.serv, 10));
      store(KEY_SERVINGS, state.servings);
      list.innerHTML = ingredientsHTML(c, state.servings);
      document.getElementById('serv-label').textContent = servingsLabel(state.servings);
      const note = document.getElementById('serv-note'); const txt = servingsNote(c, state.servings); note.textContent = txt; note.hidden = !txt;
      document.querySelector('[data-serv="-1"]').disabled = state.servings <= SERVINGS_MIN;
      document.querySelector('[data-serv="1"]').disabled = state.servings >= SERVINGS_MAX;
      list.classList.remove('bump'); void list.offsetWidth; list.classList.add('bump');
      return;
    }
    const opt = e.target.closest('[data-opt]');
    if (opt) {
      const q = QUESTIONS[state.step];
      let raw = opt.dataset.opt; if (q.id === 'strength') raw = parseInt(raw, 10);
      if (q.multi) {
        let cur = arr(state.answers[q.id]);
        if (raw === 'none') cur = cur.includes('none') ? [] : ['none'];
        else { cur = cur.filter(x => x !== 'none'); cur = cur.includes(raw) ? cur.filter(x => x !== raw) : [...cur, raw]; }
        state.answers[q.id] = cur;
      } else {
        state.answers[q.id] = raw;
      }
      state.ranked = null; state.offset = 0;
      store(KEY_ANSWERS, state.answers);
      // update in place (no re-render, keeps focus); the user advances with « Suivant »
      const sel = q.multi ? arr(state.answers[q.id]) : state.answers[q.id];
      app.querySelectorAll('[data-opt]').forEach(b => {
        let v = b.dataset.opt; if (q.id === 'strength') v = parseInt(v, 10);
        const on = q.multi ? sel.includes(v) : sel === v;
        if (q.multi) b.setAttribute('aria-pressed', String(on)); else b.setAttribute('aria-checked', String(on));
      });
      const next = document.getElementById('next'); if (next) next.disabled = q.multi ? sel.length === 0 : sel == null;
      return;
    }
    if (e.target.closest('#next')) { advance(); return; }
    if (e.target.closest('#more')) { state.offset += 3; render(); return; }
    if (e.target.closest('#restart')) { state.answers = {}; state.ranked = null; state.offset = 0; store(KEY_ANSWERS, {}); go('#/quiz/0'); return; }
  });

  function advance() {
    const q = QUESTIONS[state.step]; const v = state.answers[q.id];
    if (q.multi ? arr(v).length === 0 : v == null) return;
    if (state.step === QUESTIONS.length - 1) { state.ranked = rank(state.answers); state.offset = 0; go('#/results'); }
    else go(`#/quiz/${state.step + 1}`);
  }

  document.querySelectorAll('.nav button, .brand').forEach(b => b.addEventListener('click', () => {
    const r = b.dataset.route;
    if (r === 'quiz') go(answered() ? '#/results' : `#/quiz/${state.step}`);
    else go(`#/${r}`);
  }));

  window.addEventListener('hashchange', render);
  window.addEventListener('keydown', e => {
    if (!location.hash.startsWith('#/quiz')) return;
    if (e.key === 'Enter' && !e.target.closest('button')) advance();
  });

  if (!location.hash) location.replace('#/home');
  render();
})();
