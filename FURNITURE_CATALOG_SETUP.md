# 🪑 Guide d'Installation du Catalogue de Mobilier

## 📋 Vue d'ensemble

Le catalogue de mobilier permet aux utilisateurs de sélectionner des meubles depuis le catalogue Nunc pour enrichir leurs prompts de génération. Les descriptions des meubles sont automatiquement ajoutées au prompt pour améliorer la qualité des rendus.

## 🚀 Installation

### Étape 1 : Créer la table dans Supabase

Exécutez la migration SQL dans votre projet Supabase :

1. Allez dans **Supabase Dashboard** > **SQL Editor**
2. Copiez le contenu de `supabase/migrations/create_furniture_catalog.sql`
3. Exécutez la requête SQL

Ou via la ligne de commande :

```bash
# Si vous avez Supabase CLI configuré
supabase db push
```

### Étape 2 : Importer le catalogue

Utilisez le script d'import pour charger les données du JSON :

```bash
# Depuis la racine du projet
node scripts/import-furniture-catalog.js nunc_catalog_2025.json

# Pour supprimer les anciennes données avant d'importer (optionnel)
node scripts/import-furniture-catalog.js nunc_catalog_2025.json --clear
```

Le script va :
- ✅ Lire le fichier JSON
- ✅ Valider la structure
- ✅ Transformer les données au format Supabase
- ✅ Importer par batch de 50 éléments
- ✅ Afficher des statistiques

### Étape 3 : Vérifier l'import

Vérifiez que les données sont bien importées :

```sql
-- Dans Supabase SQL Editor
SELECT COUNT(*) FROM furniture_catalog;
SELECT category, COUNT(*) FROM furniture_catalog GROUP BY category;
```

Vous devriez voir **86 éléments** importés.

## 🎨 Utilisation

### Dans l'application

1. **Ouvrir le catalogue** : Cliquez sur le bouton "BROWSE CATALOG" dans le formulaire de génération
2. **Filtrer** : Utilisez les filtres par catégorie et style
3. **Rechercher** : Tapez dans la barre de recherche pour trouver un meuble
4. **Sélectionner** : Cliquez sur un meuble pour l'ajouter à votre sélection
5. **Générer** : Les descriptions des meubles sélectionnés seront automatiquement ajoutées au prompt

### Enrichissement automatique du prompt

Quand vous sélectionnez des meubles et générez un rendu, le prompt est enrichi automatiquement :

```
[Votre prompt original]. Include these furniture items: [description meuble 1], [description meuble 2], ...
```

Les descriptions sont en anglais et optimisées pour la génération IA.

## 📁 Structure des fichiers

```
renderz/
├── supabase/
│   └── migrations/
│       └── create_furniture_catalog.sql    # Migration SQL
├── scripts/
│   ├── import-furniture-catalog.js         # Script d'import
│   └── validate-furniture-catalog.js       # Script de validation
├── app/
│   └── api/
│       └── furniture/
│           ├── route.ts                    # API GET /api/furniture
│           ├── categories/
│           │   └── route.ts               # API GET /api/furniture/categories
│           └── styles/
│               └── route.ts               # API GET /api/furniture/styles
├── components/
│   └── furniture-catalog.tsx              # Composant UI du catalogue
└── nunc_catalog_2025.json                 # Données du catalogue
```

## 🔧 API Endpoints

### GET `/api/furniture`

Récupère le catalogue avec filtres optionnels.

**Query params :**
- `category` : Filtrer par catégorie (sofa, chair, etc.)
- `style` : Filtrer par style (modern, scandinavian, etc.)
- `supplier` : Filtrer par fournisseur (nunc, etc.)
- `search` : Recherche textuelle dans le nom
- `limit` : Limite de résultats (défaut: 100)

**Exemple :**
```bash
GET /api/furniture?category=sofa&style=modern&limit=20
```

### GET `/api/furniture/categories`

Récupère la liste des catégories disponibles.

**Réponse :**
```json
{
  "categories": ["sofa", "chair", "table", ...]
}
```

### GET `/api/furniture/styles`

Récupère la liste des styles disponibles.

**Réponse :**
```json
{
  "styles": ["modern", "scandinavian", "contemporary", ...]
}
```

## 📊 Structure de la base de données

### Table `furniture_catalog`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT (PK) | Identifiant unique (ex: "nunc-cot-counter-stool") |
| `supplier_id` | TEXT | ID du fournisseur (ex: "nunc") |
| `name` | TEXT | Nom du meuble |
| `category` | TEXT | Catégorie (sofa, chair, table, etc.) |
| `style` | TEXT | Style (modern, scandinavian, etc.) |
| `image_url` | TEXT | URL de l'image (vide pour l'instant) |
| `prompt_enhancement` | TEXT | Description pour enrichir le prompt IA |
| `metadata` | JSONB | Métadonnées (materials, color, dimensions, etc.) |
| `created_at` | TIMESTAMP | Date de création |
| `updated_at` | TIMESTAMP | Date de mise à jour |

### Index

- `idx_furniture_category` : Recherche par catégorie
- `idx_furniture_style` : Recherche par style
- `idx_furniture_supplier` : Recherche par fournisseur
- `idx_furniture_name_search` : Recherche textuelle (nom)
- `idx_furniture_prompt_search` : Recherche textuelle (prompt)

## 🖼️ Ajouter des images

Pour l'instant, les `imageUrl` sont vides. Pour ajouter les images :

1. **Uploader les images** sur Supabase Storage :
   - Créez un bucket `furniture-images` dans Supabase
   - Uploadez les images avec le nom correspondant à l'ID du meuble
   - Exemple : `nunc-cot-counter-stool.jpg`

2. **Mettre à jour les URLs** :
   ```sql
   UPDATE furniture_catalog 
   SET image_url = 'https://[project].supabase.co/storage/v1/object/public/furniture-images/nunc-cot-counter-stool.jpg'
   WHERE id = 'nunc-cot-counter-stool';
   ```

Ou utilisez un script pour mapper automatiquement les images.

## 🐛 Dépannage

### Erreur : "Table furniture_catalog does not exist"

➡️ Exécutez la migration SQL dans Supabase.

### Erreur : "No items found"

➡️ Vérifiez que l'import a bien fonctionné :
```sql
SELECT COUNT(*) FROM furniture_catalog;
```

### Le catalogue ne s'affiche pas

➡️ Vérifiez les variables d'environnement :
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Les meubles ne sont pas ajoutés au prompt

➡️ Vérifiez la console du navigateur pour les erreurs. Le prompt est enrichi automatiquement dans `handleGenerate`.

## ✅ Checklist de déploiement

- [ ] Migration SQL exécutée dans Supabase
- [ ] Catalogue importé (86 éléments)
- [ ] API endpoints testés (`/api/furniture`)
- [ ] Composant UI fonctionnel
- [ ] Enrichissement du prompt testé
- [ ] Images uploadées (optionnel)

## 📝 Notes

- Les descriptions (`promptEnhancement`) sont en anglais pour optimiser la génération IA
- Le catalogue peut être étendu avec d'autres fournisseurs
- Les filtres sont optimisés avec des index pour de bonnes performances
- Le composant UI est responsive et adapté mobile

---

Une fois installé, les utilisateurs pourront sélectionner des meubles pour enrichir leurs rendus ! 🚀
