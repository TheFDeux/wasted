"""Validate catalogue/*.json and merge them into data-more.js.

Usage: python catalogue/build.py            # validate + write data-more.js
       python catalogue/build.py --check    # validate only
"""
import glob
import json
import os
import re
import sys
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAT = os.path.join(ROOT, "catalogue")
OUT = os.path.join(ROOT, "data-more.js")

ENUMS = {
    "base": {"gin", "whisky", "rhum", "agave", "vodka", "cognac", "aperitivo"},
    "style": {"speakeasy", "tiki", "aperitivo", "cantina"},
    "notes": {"herbal", "spicy", "smoky", "floral"},
    "citrus": {"lemon", "lime", "grapefruit", "orange"},
    "sun": {"pineapple", "passion", "coconut", "apple", "stone"},
    "berry": {"raspberry", "cherry", "blackberry"},
    "ss": {"sour", "balanced", "sweet"},
    "texture": {"crisp", "creamy", "sparkling"},
    "glass": {"coupe", "rocks", "highball", "flute", "tiki"},
}
KEYS = ["id", "name", "base", "strength", "style", "bitter", "ss", "notes", "texture",
        "citrus", "sun", "berry", "color", "glass", "origin", "tagline", "ingredients", "steps", "garnish"]
QTY_RE = re.compile(r"^(\d+(?:[.,]\d+)?(?:\s+\S.*)?|top|)$")


def existing_ids():
    src = open(os.path.join(ROOT, "data.js"), encoding="utf-8").read()
    ids = re.findall(r"\{\s*id:'([^']+)'", src)
    names = re.findall(r"\bname:'((?:[^'\\]|\\.)*)'", src)
    return set(ids), {norm(n.replace("\\'", "'")) for n in names}


def norm(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "", s.lower())


def main():
    check_only = "--check" in sys.argv
    base_ids, base_names = existing_ids()
    seen_ids, seen_names = dict(), dict()
    errors, warnings, merged = [], [], []
    files = sorted(glob.glob(os.path.join(CAT, "*.json")))
    for path in files:
        fname = os.path.basename(path)
        try:
            data = json.load(open(path, encoding="utf-8"))
        except Exception as e:  # noqa: BLE001
            errors.append(f"{fname}: invalid JSON: {e}")
            continue
        if not isinstance(data, list):
            errors.append(f"{fname}: top level must be an array")
            continue
        for i, c in enumerate(data):
            where = f"{fname}[{i}] {c.get('id', '?')}"
            missing = [k for k in KEYS if k not in c]
            if missing:
                errors.append(f"{where}: missing keys {missing}")
                continue
            extra = [k for k in c if k not in KEYS]
            if extra:
                warnings.append(f"{where}: extra keys {extra} dropped")
                c = {k: c[k] for k in KEYS}
            cid = c["id"]
            if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", cid):
                errors.append(f"{where}: id must be kebab-case ascii")
            if cid in base_ids or cid in seen_ids:
                errors.append(f"{where}: duplicate id (also in {seen_ids.get(cid, 'data.js')})")
            seen_ids[cid] = fname
            nn = norm(c["name"])
            if nn in base_names or nn in seen_names:
                errors.append(f"{where}: duplicate name '{c['name']}' (also in {seen_names.get(nn, 'data.js')})")
            seen_names[nn] = fname
            for k in ("base", "style", "notes", "citrus", "sun", "berry"):
                if not isinstance(c[k], list):
                    errors.append(f"{where}: {k} must be a list")
                    continue
                bad = [v for v in c[k] if v not in ENUMS[k]]
                if bad:
                    errors.append(f"{where}: {k} has invalid values {bad}")
            if not c["base"] or len(c["base"]) > 2:
                errors.append(f"{where}: base needs 1 or 2 values")
            if not c["style"] or len(c["style"]) > 2:
                errors.append(f"{where}: style needs 1 or 2 values")
            for k in ("ss", "texture", "glass"):
                if c[k] not in ENUMS[k]:
                    errors.append(f"{where}: {k}={c[k]!r} invalid")
            if c["strength"] not in (1, 2, 3):
                errors.append(f"{where}: strength must be 1, 2 or 3")
            if c["bitter"] not in (0, 1, 2):
                errors.append(f"{where}: bitter must be 0, 1 or 2")
            if not re.fullmatch(r"#[0-9A-Fa-f]{6}", str(c["color"])):
                errors.append(f"{where}: color must be #RRGGBB")
            if not isinstance(c["ingredients"], list) or not c["ingredients"]:
                errors.append(f"{where}: ingredients empty")
            else:
                for ing in c["ingredients"]:
                    if not (isinstance(ing, list) and len(ing) == 2 and all(isinstance(x, str) for x in ing)):
                        errors.append(f"{where}: ingredient {ing!r} must be [qty, name]")
                        continue
                    q = ing[0].strip()
                    if not QTY_RE.match(q):
                        errors.append(f"{where}: quantity {q!r} not scalable (use '22 ml', '2 traits', '1', 'top', '')")
                    if re.search(r"\b(oz|cl|dash|dashes)\b", q):
                        errors.append(f"{where}: quantity {q!r} uses a non-metric unit")
            if not isinstance(c["steps"], list) or not (1 <= len(c["steps"]) <= 6):
                errors.append(f"{where}: steps must have 1 to 6 entries")
            for k in ("name", "origin", "tagline", "garnish"):
                if not isinstance(c[k], str) or not c[k].strip():
                    errors.append(f"{where}: {k} empty")
            merged.append(c)

    print(f"files: {len(files)}  entries: {len(merged)}  errors: {len(errors)}  warnings: {len(warnings)}")
    for w in warnings:
        print("  warn:", w)
    for e in errors:
        print("  ERROR:", e)
    per_base = {}
    for c in merged:
        per_base[c["base"][0]] = per_base.get(c["base"][0], 0) + 1
    print("per base:", dict(sorted(per_base.items())))
    if errors:
        sys.exit(1)
    if check_only:
        return
    body = json.dumps(merged, ensure_ascii=False, indent=None, separators=(",", ":"))
    # one entry per line for readable diffs
    body = body.replace("},{", "},\n{")
    js = ("// Shaker Club — extended catalogue, generated from catalogue/*.json by catalogue/build.py. Do not edit by hand.\n"
          "COCKTAILS.push(\n" + body[1:-1] + "\n);\n")
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write(js)
    print(f"wrote {os.path.relpath(OUT, ROOT)} ({os.path.getsize(OUT) // 1024} KB)")


if __name__ == "__main__":
    main()
