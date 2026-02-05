# 🖼️ Guide d'Ajout des Images du Catalogue

## 📋 Vue d'ensemble

Pour que les images des meubles s'affichent dans le catalogue, vous devez :
1. Créer un bucket Supabase Storage
2. Uploader les images
3. Mettre à jour les URLs dans la base de données

## 🚀 Méthode 1 : Via Supabase Dashboard (Recommandé)

### Étape 1 : Créer le bucket

1. Allez dans **Supabase Dashboard** > **Storage**
2. Cliquez sur **"New bucket"**
3. Nom : `furniture-images`
4. **Public bucket** : ✅ Activé (pour que les images soient accessibles)
5. Cliquez sur **"Create bucket"**

### Étape 2 : Uploader les images

1. Ouvrez le bucket `furniture-images`
2. Cliquez sur **"Upload file"**
3. Uploadez toutes les images des meubles
4. **Nommage important** : Utilisez l'ID du meuble comme nom de fichier
   - Exemple : `nunc-cot-counter-stool.jpg`
   - Format supporté : `.jpg`, `.jpeg`, `.png`, `.webp`

### Étape 3 : Mettre à jour les URLs dans la base de données

Une fois les images uploadées, vous pouvez mettre à jour les URLs avec ce script SQL :

```sql
-- Remplacer [PROJECT_REF] par votre référence de projet Supabase
-- Exemple : aodlfljsneigkrmjnpai

UPDATE furniture_catalog 
SET image_url = 'https://[PROJECT_REF].supabase.co/storage/v1/object/public/furniture-images/' || id || '.jpg'
WHERE image_url = '' OR image_url IS NULL;
```

**Ou manuellement pour chaque meuble :**

```sql
UPDATE furniture_catalog 
SET image_url = 'https://aodlfljsneigkrmjnpai.supabase.co/storage/v1/object/public/furniture-images/nunc-cot-counter-stool.jpg'
WHERE id = 'nunc-cot-counter-stool';
```

## 🔧 Méthode 2 : Via Script Node.js (Automatique)

Créez un script pour uploader automatiquement toutes les images :

```javascript
// scripts/upload-furniture-images.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function uploadImages(imagesDir) {
  const files = fs.readdirSync(imagesDir);
  
  for (const file of files) {
    const filePath = path.join(imagesDir, file);
    const fileName = path.basename(file, path.extname(file)); // ID du meuble
    
    // Vérifier que le meuble existe
    const { data: furniture } = await supabase
      .from('furniture_catalog')
      .select('id')
      .eq('id', fileName)
      .single();
    
    if (!furniture) {
      console.log(`⚠️  Meuble non trouvé: ${fileName}`);
      continue;
    }
    
    // Upload vers Supabase Storage
    const fileBuffer = fs.readFileSync(filePath);
    const { data, error } = await supabase.storage
      .from('furniture-images')
      .upload(fileName + path.extname(file), fileBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });
    
    if (error) {
      console.error(`❌ Erreur upload ${fileName}:`, error);
      continue;
    }
    
    // Mettre à jour l'URL dans la base de données
    const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/furniture-images/${data.path}`;
    
    await supabase
      .from('furniture_catalog')
      .update({ image_url: imageUrl })
      .eq('id', fileName);
    
    console.log(`✅ ${fileName} uploadé`);
  }
}

// Usage: node scripts/upload-furniture-images.js ./furniture-images
const imagesDir = process.argv[2] || './furniture-images';
uploadImages(imagesDir);
```

## 📝 Structure recommandée des fichiers

Organisez vos images comme ceci :

```
furniture-images/
├── nunc-cot-counter-stool.jpg
├── nunc-cot-bar-stool.jpg
├── nunc-cot-backrest-counter-stool.jpg
├── ...
└── nunc-skupa-b-pouf.jpg
```

**Nommage :** Utilisez exactement l'ID du meuble comme nom de fichier (sans préfixe, juste l'ID).

## ✅ Vérification

Après avoir uploadé les images, vérifiez :

```sql
-- Compter les meubles avec images
SELECT COUNT(*) FROM furniture_catalog WHERE image_url != '' AND image_url IS NOT NULL;

-- Voir quelques exemples
SELECT id, name, image_url FROM furniture_catalog WHERE image_url != '' LIMIT 5;
```

## 🎨 Formats d'image recommandés

- **Format** : JPG ou WebP (meilleure compression)
- **Taille** : 800x800px minimum (pour une bonne qualité)
- **Poids** : < 500KB par image (pour un chargement rapide)
- **Ratio** : 1:1 (carré) de préférence

## 🔗 URLs générées

Les URLs suivront ce format :
```
https://[PROJECT_REF].supabase.co/storage/v1/object/public/furniture-images/[ID].jpg
```

Exemple :
```
https://aodlfljsneigkrmjnpai.supabase.co/storage/v1/object/public/furniture-images/nunc-cot-counter-stool.jpg
```

## 🐛 Dépannage

### Les images ne s'affichent pas

1. Vérifiez que le bucket est **public**
2. Vérifiez que l'URL est correcte dans la base de données
3. Testez l'URL directement dans le navigateur

### Erreur "Bucket not found"

➡️ Créez le bucket `furniture-images` dans Supabase Storage

### Erreur "Permission denied"

➡️ Vérifiez que le bucket est public ou que vous utilisez la clé service role

---

Une fois les images ajoutées, le catalogue sera complet et les utilisateurs pourront voir les meubles avant de les sélectionner ! 🎉
