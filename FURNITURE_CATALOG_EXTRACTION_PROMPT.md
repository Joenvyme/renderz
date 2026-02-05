# 📋 Prompt pour Extraction de Catalogue de Mobilier depuis PDF

## 🎯 Objectif
Extraire les informations d'un catalogue PDF de mobilier et générer un fichier JSON structuré compatible avec l'intégration RENDERZ.

---

## 📝 PROMPT COMPLET POUR CLAUDE OPUS / AUTRE IA

```
Tu es un expert en extraction de données et structuration de catalogues produits. 
Je vais te fournir un catalogue PDF de mobilier et je veux que tu extraies toutes les informations 
nécessaires pour créer un catalogue numérique structuré.

## CONTEXTE
Je développe une application web (RENDERZ) qui permet aux utilisateurs de générer des rendus 
architecturaux avec de l'IA. Les utilisateurs doivent pouvoir sélectionner du mobilier depuis 
un catalogue pour l'ajouter à leurs rendus.

## TÂCHE
Extrais toutes les informations des meubles présents dans le catalogue PDF fourni 
et génère un fichier JSON structuré selon le schéma ci-dessous.

## SCHEMA JSON REQUIS

Chaque meuble doit être représenté par un objet avec cette structure :

```json
{
  "name": "Nom du meuble (ex: Canapé Sectionnel Gris)",
  "category": "catégorie (voir liste ci-dessous)",
  "style": "style (voir liste ci-dessous)",
  "imageUrl": "URL de l'image si disponible dans le PDF, sinon laisse vide",
  "promptEnhancement": "Description détaillée pour l'IA de génération (ex: modern grey sectional sofa, contemporary design, comfortable cushions, fabric upholstery)",
  "metadata": {
    "materials": ["liste", "des", "matériaux"],
    "color": "couleur principale",
    "dimensions": {
      "width": 280,
      "height": 90,
      "depth": 100
    },
    "brand": "marque si mentionnée",
    "reference": "référence produit si disponible"
  }
}
```

## CATÉGORIES ACCEPTÉES
Utilise UNIQUEMENT ces catégories (en anglais, minuscules) :
- `sofa` - Canapés, divans, canapés d'angle
- `chair` - Chaises, fauteuils
- `table` - Tables (toutes sortes)
- `coffee-table` - Tables basses
- `dining-table` - Tables à manger
- `desk` - Bureaux
- `bed` - Lits
- `wardrobe` - Armoires, dressings
- `shelf` - Étagères, bibliothèques
- `lamp` - Lampes, luminaires
- `rug` - Tapis
- `curtain` - Rideaux
- `plant` - Plantes, jardinières
- `decoration` - Objets décoratifs, vases, tableaux
- `storage` - Meubles de rangement, commodes
- `ottoman` - Poufs, banquettes
- `mirror` - Miroirs
- `cabinet` - Buffets, meubles TV

Si une catégorie n'est pas claire, choisis la plus proche de cette liste.

## STYLES ACCEPTÉS
Utilise UNIQUEMENT ces styles (en anglais, minuscules) :
- `modern` - Design moderne, épuré
- `contemporary` - Contemporain
- `scandinavian` - Scandinave, nordique
- `industrial` - Industriel
- `minimalist` - Minimaliste
- `rustic` - Rustique, campagne
- `classic` - Classique, traditionnel
- `luxury` - Luxueux, haut de gamme
- `mid-century` - Milieu de siècle
- `bohemian` - Bohème
- `vintage` - Vintage, rétro
- `transitional` - Transitionnel (mixte)

Si le style n'est pas mentionné, analyse l'image/description et déduis le style le plus approprié.

## RÈGLES D'EXTRACTION

### 1. NOM DU MEUBLE
- Utilise le nom exact du produit tel qu'indiqué dans le catalogue
- Si plusieurs noms, utilise le plus descriptif
- Exemple : "Canapé 3 places en cuir noir" → "Canapé 3 places en cuir noir"

### 2. PROMPT ENHANCEMENT (CRITIQUE)
Cette description sera utilisée par l'IA de génération. Elle doit être :
- En anglais
- Descriptive et précise
- Inclure : style, matériaux principaux, couleur, caractéristiques visuelles
- Format : "style material color item, additional details, specific features"
- Exemples :
  - ✅ "modern grey sectional sofa, contemporary design, comfortable cushions, fabric upholstery"
  - ✅ "scandinavian wooden coffee table, light oak finish, minimalist legs"
  - ✅ "industrial metal pendant lamp, black finish, exposed bulb design"
  - ❌ "sofa" (trop vague)
  - ❌ "beautiful modern sofa" (pas assez de détails)

### 3. MÉTADONNÉES
- **materials** : Liste des matériaux mentionnés (ex: ["leather", "metal", "wood"])
- **color** : Couleur principale en anglais (ex: "white", "grey", "black", "brown")
- **dimensions** : Si disponibles, en centimètres (width x height x depth)
- **brand** : Marque si mentionnée
- **reference** : Référence produit si disponible (code SKU, etc.)

### 4. IMAGES
- Si le PDF contient des images, note leur position/page
- Si des URLs d'images sont mentionnées, inclus-les dans `imageUrl`
- Sinon, laisse `imageUrl` vide (je les ajouterai manuellement plus tard)

## FORMAT DE SORTIE

Génère un fichier JSON avec un tableau de tous les meubles :

```json
[
  {
    "name": "Canapé Sectionnel Gris",
    "category": "sofa",
    "style": "modern",
    "imageUrl": "",
    "promptEnhancement": "modern grey sectional sofa, contemporary design, comfortable cushions, fabric upholstery, clean lines",
    "metadata": {
      "materials": ["fabric", "metal"],
      "color": "grey",
      "dimensions": {
        "width": 280,
        "height": 90,
        "depth": 100
      }
    }
  },
  {
    "name": "Table Basse en Chêne",
    "category": "coffee-table",
    "style": "scandinavian",
    "imageUrl": "",
    "promptEnhancement": "scandinavian wooden coffee table, light oak finish, minimalist design, thin legs",
    "metadata": {
      "materials": ["oak wood"],
      "color": "light oak",
      "dimensions": {
        "width": 120,
        "height": 45,
        "depth": 60
      }
    }
  }
]
```

## INSTRUCTIONS SPÉCIFIQUES

1. **Extrais TOUS les meubles** du catalogue, même s'il y en a beaucoup
2. **Sois précis** : ne devine pas, utilise uniquement les informations disponibles
3. **Si une information manque** : laisse le champ vide ou utilise une valeur par défaut raisonnable
4. **Pour les dimensions** : convertis en centimètres si nécessaire (1 pouce = 2.54 cm)
5. **Pour les couleurs** : utilise des noms simples en anglais (white, black, grey, brown, beige, etc.)
6. **Pour le promptEnhancement** : sois très descriptif, c'est crucial pour la qualité des rendus IA
7. **Évite les doublons** : si le même meuble apparaît plusieurs fois, ne l'inclus qu'une fois

## EXEMPLE DE TRAITEMENT

**Entrée (catalogue PDF)** :
- Page 5 : "Canapé 3 places - Modèle Milano"
- Description : "Canapé moderne en tissu gris, structure en métal, dimensions 220x90x95 cm"
- Style : Contemporain
- Matériaux : Tissu, Métal

**Sortie JSON** :
```json
{
  "name": "Canapé 3 places - Modèle Milano",
  "category": "sofa",
  "style": "contemporary",
  "imageUrl": "",
  "promptEnhancement": "contemporary grey fabric sofa, 3-seater design, metal frame, modern clean lines, comfortable cushions",
  "metadata": {
    "materials": ["fabric", "metal"],
    "color": "grey",
    "dimensions": {
      "width": 220,
      "height": 90,
      "depth": 95
    },
    "reference": "Milano"
  }
}
```

## VALIDATION

Avant de finaliser, vérifie que :
- ✅ Tous les champs requis sont présents
- ✅ Les catégories et styles sont dans les listes acceptées
- ✅ Le promptEnhancement est en anglais et descriptif
- ✅ Le JSON est valide (peut être parsé)
- ✅ Pas de doublons

## QUESTIONS À ME POSER SI BESOIN

Si certaines informations sont ambiguës ou manquantes, pose-moi des questions avant de générer le JSON final.

---

**Maintenant, analyse le catalogue PDF que je vais te fournir et génère le fichier JSON structuré selon ces instructions.**
```

---

## 📤 UTILISATION

1. **Copie le prompt ci-dessus** dans Claude Opus ou une autre IA
2. **Ajoute le PDF du catalogue** (upload ou lien)
3. **Demande à l'IA** de générer le fichier JSON
4. **Vérifie le résultat** et ajuste si nécessaire
5. **Sauvegarde le JSON** dans `data/furniture-catalog.json` ou similaire

## ✅ CHECKLIST POST-EXTRACTION

Après avoir reçu le JSON de l'IA, vérifie :

- [ ] Tous les meubles du catalogue sont présents
- [ ] Les catégories sont correctes (dans la liste acceptée)
- [ ] Les styles sont appropriés
- [ ] Le `promptEnhancement` est descriptif et en anglais
- [ ] Le JSON est valide (teste avec un validateur JSON)
- [ ] Pas de doublons
- [ ] Les dimensions sont en centimètres
- [ ] Les couleurs sont en anglais

## 🔧 AJUSTEMENTS POSSIBLES

Si le JSON généré nécessite des ajustements, tu peux :
1. Demander à l'IA de corriger des points spécifiques
2. Utiliser un script de nettoyage (je peux t'en fournir un)
3. Modifier manuellement les entrées problématiques

---

## 📝 NOTES

- Le `promptEnhancement` est **crucial** : c'est ce qui sera utilisé pour générer les rendus
- Si le catalogue ne contient pas d'images, on pourra les ajouter manuellement plus tard
- Les catégories et styles doivent être exactement dans les listes fournies pour la compatibilité

---

Une fois que tu auras le JSON, je pourrai l'intégrer directement dans l'application ! 🚀

