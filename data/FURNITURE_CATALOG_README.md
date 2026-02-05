# 📦 Guide d'Import du Catalogue de Mobilier

## 🎯 Vue d'ensemble

Ce dossier contient les fichiers nécessaires pour importer un catalogue de mobilier dans RENDERZ.

## 📁 Fichiers

- `furniture-catalog-template.json` - Template avec exemples de structure
- `furniture-catalog.json` - **À créer** : votre catalogue extrait (à placer ici)

## 🚀 Processus d'import

### Étape 1 : Extraction depuis PDF

1. Ouvrez le fichier `FURNITURE_CATALOG_EXTRACTION_PROMPT.md` à la racine du projet
2. Copiez le prompt complet
3. Utilisez Claude Opus ou une autre IA avec votre catalogue PDF
4. Demandez à l'IA de générer le JSON selon le format requis
5. Sauvegardez le résultat dans `data/furniture-catalog.json`

### Étape 2 : Validation

Validez le JSON généré :

```bash
node scripts/validate-furniture-catalog.js data/furniture-catalog.json
```

Le script vérifie :
- ✅ Structure JSON valide
- ✅ Champs requis présents
- ✅ Catégories et styles dans les listes acceptées
- ✅ Pas de doublons
- ✅ Dimensions valides
- ⚠️  Avertissements sur champs optionnels manquants

### Étape 3 : Ajout des images (si nécessaire)

Si le JSON ne contient pas d'URLs d'images (`imageUrl` vide) :

1. Organisez vos images dans un dossier (ex: `public/furniture-images/`)
2. Ou préparez-vous à les uploader sur Supabase Storage
3. Je pourrai créer un script pour mapper les images aux meubles

### Étape 4 : Import dans la base de données

Une fois le JSON validé, je créerai :
- La table Supabase `furniture_catalog`
- Un script d'import pour charger les données
- Le bucket Storage pour les images

## 📋 Format attendu

Chaque meuble doit avoir cette structure :

```json
{
  "name": "Nom du meuble",
  "category": "sofa|chair|table|...",
  "style": "modern|scandinavian|...",
  "imageUrl": "URL ou vide",
  "promptEnhancement": "Description détaillée en anglais",
  "metadata": {
    "materials": ["liste", "matériaux"],
    "color": "couleur",
    "dimensions": { "width": 100, "height": 50, "depth": 60 }
  }
}
```

## ✅ Checklist avant import

- [ ] JSON valide (testé avec le script de validation)
- [ ] Tous les champs requis présents
- [ ] Catégories dans la liste acceptée
- [ ] Styles dans la liste acceptée
- [ ] `promptEnhancement` descriptif et en anglais
- [ ] Pas de doublons
- [ ] Images préparées (si disponibles)

## 🔧 Aide

Si vous avez des questions ou des problèmes :
1. Vérifiez le template `furniture-catalog-template.json`
2. Consultez `FURNITURE_CATALOG_EXTRACTION_PROMPT.md` pour les détails
3. Utilisez le script de validation pour identifier les erreurs

Une fois le JSON prêt, je pourrai l'intégrer dans l'application ! 🚀

