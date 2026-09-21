# Product
<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
delegated (time-boxed brief): static HTML/CSS/JS, no build step, localStorage for persistence. Open `index.html` directly or serve the folder.

## Users
[Inferred from brief] Curious drinkers at home or before going out, on a phone or laptop, who know roughly what they like (a spirit, a flavour, a fruit) but not which cocktail to order or make next. One person, one sitting, two minutes.

## Product Purpose
Shaker Club turns taste preferences into three niche cocktail recommendations, then hands over the full recipe and lets the user keep a shortlist. Success: the user finds a drink they had never heard of and actually makes or orders it.

## Positioning
[Inferred] Recommendations only from the lesser-known canon (Paper Plane, Naked & Famous, Trinidad Sour…), never the ten cocktails everyone already knows. The quiz asks about spirits, flavours and fruit in that order, so the answer feels earned rather than random.

## Operating Context
Single-page flow: intro → 10-question quiz (3 spirits, 4 flavours, 3 fruit) → 3 results → recipe → saved list. No account, no network beyond fonts. Saved cocktails live in the browser.

## Capabilities and Constraints
- Quiz answers are weighted against a tagged catalogue of 248 cocktails (48 in data.js, 200 in catalogue/*.json merged into data-more.js by catalogue/build.py); top 3 are chosen with distinct base spirits where possible.
- "Voir 3 autres" surfaces the next best matches.
- Save / unsave from results, recipe and saved views.
- Recipes give quantities in ml, method, glass and garnish. French UI.
- Undecided: multi-language, sharing, user accounts.

## Brand Commitments
Name: Shaker Club. Binding visual constraint from the brief: modern, yellow-orange tones.

## Evidence on Hand
No imagery, logo or testimonials exist. Cocktail recipes are classic published specs (Death & Co, Savoy, Milk & Honey lineage); do not invent provenance beyond what the catalogue records.

## Product Principles
- Niche or nothing: never recommend a cocktail the user could name unprompted.
- Ten questions, no more; every question must move the recommendation.
- The recipe is the real deliverable; make it readable at a bar counter on a phone.
- Saving is one tap, everywhere a cocktail appears.

## Accessibility & Inclusion
Keyboard-operable quiz, visible focus, ≥4.5:1 body contrast, reduced-motion respected.
