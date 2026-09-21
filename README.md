# Shaker Club

Trouve le cocktail que tu ne connais pas encore.

Dix questions sur tes goûts (spiritueux, saveurs, fruits), trois cocktails de niche en réponse, la recette complète avec doses ajustables au nombre de personnes, et une liste de favoris.

## Lancer

Aucun build, aucune dépendance. Ouvre `index.html` dans un navigateur, ou sers le dossier :

```bash
python -m http.server 8765
```

puis va sur http://localhost:8765.

## Fichiers

- `index.html` : coquille de la page et chargement des polices
- `styles.css` : design system (tons crème, ambre, orange brûlé)
- `data.js` : les 48 premiers cocktails tagués et les 10 questions du quiz
- `data-more.js` : 200 cocktails supplémentaires, généré depuis `catalogue/*.json` par `python catalogue/build.py`
- `app.js` : routage, scoring, sélecteur de personnes, favoris (localStorage)
- `PRODUCT.md` / `DESIGN.md` : contexte produit et décisions de design
