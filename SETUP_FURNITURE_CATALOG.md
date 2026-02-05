# 🚀 Installation Rapide du Catalogue de Mobilier

## Étape 1 : Créer la table dans Supabase

1. **Ouvrez Supabase Dashboard** : https://supabase.com/dashboard
2. **Sélectionnez votre projet**
3. **Allez dans SQL Editor** (menu de gauche)
4. **Copiez-collez ce SQL** :

```sql
-- Migration: Create furniture_catalog table
CREATE TABLE IF NOT EXISTS furniture_catalog (
  id TEXT PRIMARY KEY,
  supplier_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  style TEXT NOT NULL,
  image_url TEXT DEFAULT '',
  prompt_enhancement TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_furniture_category ON furniture_catalog(category);
CREATE INDEX IF NOT EXISTS idx_furniture_style ON furniture_catalog(style);
CREATE INDEX IF NOT EXISTS idx_furniture_supplier ON furniture_catalog(supplier_id);

-- Index pour la recherche textuelle
CREATE INDEX IF NOT EXISTS idx_furniture_name_search ON furniture_catalog USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_furniture_prompt_search ON furniture_catalog USING gin(to_tsvector('english', prompt_enhancement));
```

5. **Cliquez sur "Run"** pour exécuter la requête

✅ Vous devriez voir "Success. No rows returned"

## Étape 2 : Importer les données

Depuis votre terminal, dans le dossier du projet :

```bash
node scripts/import-furniture-catalog.js nunc_catalog_2025.json
```

Le script va :
- ✅ Lire le fichier JSON
- ✅ Transformer les données
- ✅ Importer 86 meubles dans Supabase
- ✅ Afficher des statistiques

**Résultat attendu :**
```
📊 86 éléments à importer
✓ Batch 1: 50 éléments importés (50/86)
✓ Batch 2: 36 éléments importés (86/86)
✅ Import terminé: 86 éléments importés
```

## Étape 3 : Vérifier

1. **Dans Supabase Dashboard** > **Table Editor**
2. **Sélectionnez la table `furniture_catalog`**
3. **Vous devriez voir 86 lignes**

Ou testez dans l'app :
- Rechargez la page
- Cliquez sur "BROWSE CATALOG"
- Vous devriez voir les 86 meubles !

## 🐛 Si ça ne marche pas

### Erreur : "Table already exists"
➡️ C'est normal, la table existe déjà. Passez à l'étape 2.

### Erreur : "Cannot find module"
➡️ Installez les dépendances :
```bash
npm install
```

### Erreur : "Variables d'environnement manquantes"
➡️ Vérifiez votre `.env.local` :
```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
```

### Le script ne trouve pas le fichier JSON
➡️ Vérifiez que `nunc_catalog_2025.json` est à la racine du projet.

---

Une fois ces étapes terminées, le catalogue sera opérationnel ! 🎉
