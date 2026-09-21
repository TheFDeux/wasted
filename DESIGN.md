# Design

## World
"Golden hour at the bar": a warm cream room lit by saturated amber and burnt orange. Light theme chosen from the use scene (kitchen counter, pre-dinner, phone in hand). Cocktail liquids keep their real colours; everything else stays in the yellow-orange family.

## Tokens
- Surfaces: cream `#FFF6E5`, warm surface `#FFEBC7`, ink `#241407`
- Accents: amber `#F6A823` (selection, progress), orange `#EA6A1F`, ember `#C2410C` (primary action)
- Secondary text is tinted brown `#5C3D1E`, never grey. Hairlines `rgba(60,30,5,.16)`
- Radii: 14px controls, 22px panels, pill for chips. Shadows: offset + soft blur, amber-tinted.

## Type
- Display: Fraunces (variable; SOFT 40, WONK 1 on cocktail names). Balanced headings, tracking ≥ -0.03em.
- Body: Instrument Sans 400/500/600. Quantities in tabular numerals.

## Components
- Option tile: pill/tile, hairline border; selected = amber fill, ink text, drawn check icon.
- Primary button: ember fill, cream text. Ghost button: ink text, hairline.
- Result card: colour block with glass illustration (SVG, liquid tinted per cocktail) + name + origin + reason chips. Lead result spans full width.
- Progress: three labelled segments (Alcools · Saveurs · Fruits), amber fill.

## Motion
One authored moment: result cards reveal with clip-path + blur + rise, staggered 80ms, ease `cubic-bezier(.16,1,.3,1)`. Question changes cross-fade only. Reduced motion disables both.

## Browser surfaces
Selection amber, caret ember, focus ring ember 2px offset 3px, scrollbar thumb amber on cream.
