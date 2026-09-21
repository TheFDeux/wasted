# Brief: 200 recettes de cocktails niche pour Shaker Club

Tu écris des entrées de catalogue pour une app de recommandation de cocktails en français. Sortie : UN fichier JSON (tableau d'objets), rien d'autre. Pas de commentaire, pas de texte autour, JSON strict (guillemets doubles, pas de virgule finale).

## Ce que veut l'utilisateur
Des cocktails **de niche** : recettes signées de bars, restaurants et palaces reconnus (Death & Co, PDT, Attaboy / Milk & Honey, Employees Only, Clover Club, Dante, NoMad, The Aviary, Trick Dog, Smuggler's Cove, Three Dots and a Dash, The Savoy American Bar, The Connaught, Artesian, Dukes, Bar Termini, Bar Hemingway au Ritz Paris, Harry's New York Bar, Little Red Door, Candelaria, Le Syndicat, Experimental Cocktail Club, Schumann's, Café Royal, Raffles Long Bar, Floridita, Tiki classiques de Don the Beachcomber / Trader Vic, etc.), ou des classiques oubliés des livres de référence (Jerry Thomas, Harry Johnson, Savoy Cocktail Book, Café Royal Cocktail Book, Esquire, Trader Vic's).

**Interdits** (trop connus) : Mojito, Margarita, Negroni, Old Fashioned, Manhattan, Martini (dry), Daiquiri classique, Cosmopolitan, Moscow Mule, Espresso Martini, Spritz, Piña Colada, Mai Tai, Whiskey Sour, Gin Tonic, Bloody Mary, Long Island, Tequila Sunrise, Caipirinha, Cuba Libre, Dark 'n' Stormy, French 75, Sidecar, Bellini, Mimosa, Kir, Paloma, Tom Collins, Gimlet, Mint Julep, Irish Coffee, White/Black Russian, B-52, Zombie, Hurricane, Amaretto Sour, Americano, Sbagliato, Rob Roy, Sex on the Beach, Singapore Sling, Pornstar Martini, Bramble, Penicillin.

**Déjà dans le catalogue, ne pas refaire** (ids) : paper-plane, naked-famous, jungle-bird, penicillin, last-word, bijou, division-bell, trinidad-sour, oaxaca-old-fashioned, corpse-reviver-2, hanky-panky, boulevardier, brown-derby, airmail, old-cuban, hemingway-daiquiri, clover-club, bramble, chartreuse-swizzle, bees-knees, aviation, vieux-carre, sazerac, el-diablo, siesta, toreador, champs-elysees, japanese-cocktail, jack-rose, pisco-sour, harvey-wallbanger, salty-dog, godmother, vesper, chi-chi, lemon-drop, blood-and-sand, rusty-nail, kingston-negroni, corn-n-oil, queens-park-swizzle, saturn, painkiller, adonis, bicicletta, white-negroni, twentieth-century, ramos-gin-fizz.

## Honnêteté sur la provenance
Utilise des specs publiées et connues. Si tu n'es pas sûr du créateur, indique seulement le bar et/ou la ville et l'époque (« The Savoy, Londres · années 1930 », « Classique tiki · années 1950 »). N'invente jamais un nom de bartender ni une date précise. Reste sur des cocktails qui existent vraiment.

## Schéma d'une entrée (toutes les clés obligatoires)
{
  "id": "kebab-case-ascii-unique",
  "name": "Nom du cocktail",
  "base": ["gin"],                 // 1 ou 2 valeurs parmi: gin | whisky | rhum | agave | vodka | cognac | aperitivo. La première = spiritueux principal. 'cognac' couvre tous les brandys (calvados, pisco, applejack, armagnac). 'aperitivo' = amers, liqueurs, vermouth, xérès, vin quand c'est la base.
  "strength": 2,                   // 1 léger (long drink, low-ABV, pétillant) · 2 équilibré (sour, shaké) · 3 costaud (spirit-forward, remué, servi court)
  "style": ["speakeasy"],          // 1 ou 2 parmi: speakeasy | tiki | aperitivo | cantina (agave)
  "bitter": 0,                     // 0 pas d'amer · 1 touche d'amer (Aperol, bitters marqués, vermouth) · 2 franchement amer (Campari, Fernet, Cynar, Suze en dose)
  "ss": "sour",                    // sour | balanced | sweet
  "notes": ["herbal"],             // sous-ensemble de: herbal | spicy | smoky | floral  (peut être vide [])
  "texture": "crisp",              // crisp (filtré, net) | creamy (blanc d'œuf, crème, coco, lait) | sparkling (champagne, soda, ginger beer, bière)
  "citrus": ["lemon"],             // sous-ensemble de: lemon | lime | grapefruit | orange (jus OU liqueur d'orange/curaçao compte pour orange; zeste seul ne compte pas)
  "sun": [],                       // sous-ensemble de: pineapple | passion | coconut | apple | stone (abricot, pêche, prune)
  "berry": [],                     // sous-ensemble de: raspberry (framboise, fraise) | cherry (cerise, marasquin, Heering) | blackberry (mûre, cassis, myrtille, cranberry)
  "color": "#E8672B",              // couleur hex réaliste du liquide
  "glass": "coupe",                // coupe | rocks | highball | flute | tiki
  "origin": "Créateur · Bar, Ville · Année",   // ou seulement Bar/Ville/époque si créateur incertain
  "tagline": "Une phrase en français, 10 à 20 mots, qui donne envie et dit ce qu'il y a dedans. Ton vif, pas de superlatif creux.",
  "ingredients": [["45 ml", "gin"], ["22 ml", "jus de citron"], ["2 traits", "Angostura"], ["1", "blanc d'œuf"], ["top", "eau gazeuse"], ["1 rinçage", "absinthe"]],
  "steps": ["Phrase impérative courte.", "2 à 4 étapes."],
  "garnish": "Garniture en français, ou « Aucune. »"
}

## Règles sur les quantités (l'app les multiplie par le nombre de personnes)
- Liquides en millilitres, format exact "22 ml", "45 ml", "7 ml" (pas d'oz, pas de cl). Quart d'once = 7 ml, demi = 15 ml, 3/4 = 22 ml, 1 oz = 30 ml, 1,5 oz = 45 ml, 2 oz = 60 ml.
- Bitters : "1 trait", "2 traits", "3 traits".
- Comptes nus pour les unités : "1" + "blanc d'œuf", "6" + "feuilles de menthe", "1" + "morceau de sucre" (au singulier si 1).
- Toppers : "top" + "champagne" / "eau gazeuse" / "ginger beer".
- Rinçage : "1 rinçage" + "absinthe".
- Bord du verre : "" (vide) + "sel fin pour le bord du verre".
- Noms d'ingrédients en français (jus de citron, jus de citron vert, sirop de sucre, sirop de miel, vermouth rouge, vermouth dry, liqueur de marasquin, crème de mûre, blanc d'œuf, eau gazeuse…). Marques quand elles font la recette (Campari, Aperol, Chartreuse verte, Bénédictine, Fernet-Branca, Cynar, Suze, Lillet blanc, Cocchi Americano, Amaro Nonino, Angostura, Peychaud's, Cointreau, Galliano, Drambuie, Cherry Heering, falernum, orgeat).

## Qualité
- Pas de doublon d'id ni de nom, y compris avec la liste « déjà dans le catalogue ».
- Varie les styles, forces, textures et fruits à l'intérieur de ta famille pour que le moteur de recommandation ait du choix : quelques low-ABV / pétillants, quelques crémeux, quelques costauds, des fruits variés.
- Les tags doivent refléter honnêtement la recette (un cocktail avec 30 ml de Campari a bitter 2 ; un sour au citron a ss "sour" et citrus ["lemon"]).
- Français impeccable, typographie française (espace avant « : », « ; », « ? », « ! » ; guillemets « » si besoin ; apostrophes droites ' acceptées).
