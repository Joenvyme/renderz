#!/usr/bin/env node

/**
 * Script pour uploader les images des meubles vers Supabase Storage
 * Usage: node scripts/upload-furniture-images.js [chemin/vers/images]
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadImages(imagesDir) {
  console.log(`\n📤 Upload des images depuis: ${imagesDir}\n`);

  if (!fs.existsSync(imagesDir)) {
    console.error(`❌ Dossier non trouvé: ${imagesDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(imagesDir).filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
  });

  if (files.length === 0) {
    console.error('❌ Aucune image trouvée dans le dossier');
    process.exit(1);
  }

  console.log(`📊 ${files.length} image(s) trouvée(s)\n`);

  let uploaded = 0;
  let updated = 0;
  let errors = 0;

  for (const file of files) {
    const filePath = path.join(imagesDir, file);
    const ext = path.extname(file);
    const fileName = path.basename(file, ext); // ID du meuble (sans extension)
    
    try {
      // 1. Vérifier que le meuble existe
      const { data: furniture, error: fetchError } = await supabase
        .from('furniture_catalog')
        .select('id, name')
        .eq('id', fileName)
        .single();
      
      if (fetchError || !furniture) {
        console.log(`⚠️  Meuble non trouvé: ${fileName} (fichier: ${file})`);
        errors++;
        continue;
      }
      
      // 2. Lire le fichier
      const fileBuffer = fs.readFileSync(filePath);
      
      // 3. Upload vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('furniture-images')
        .upload(fileName + ext, fileBuffer, {
          contentType: `image/${ext.slice(1)}`,
          upsert: true, // Remplacer si existe déjà
        });
      
      if (uploadError) {
        console.error(`❌ Erreur upload ${fileName}:`, uploadError.message);
        errors++;
        continue;
      }
      
      uploaded++;
      
      // 4. Mettre à jour l'URL dans la base de données
      const imageUrl = `${supabaseUrl}/storage/v1/object/public/furniture-images/${uploadData.path}`;
      
      const { error: updateError } = await supabase
        .from('furniture_catalog')
        .update({ image_url: imageUrl })
        .eq('id', fileName);
      
      if (updateError) {
        console.error(`❌ Erreur mise à jour ${fileName}:`, updateError.message);
        errors++;
        continue;
      }
      
      updated++;
      console.log(`✅ ${furniture.name} (${fileName})`);
      
    } catch (error) {
      console.error(`❌ Erreur pour ${fileName}:`, error.message);
      errors++;
    }
  }

  console.log(`\n📊 Résumé:`);
  console.log(`   ✅ ${uploaded} image(s) uploadée(s)`);
  console.log(`   ✅ ${updated} URL(s) mise(s) à jour`);
  if (errors > 0) {
    console.log(`   ❌ ${errors} erreur(s)`);
  }
  console.log('');
}

// Exécution
const imagesDir = process.argv[2] || './furniture-images';

if (!imagesDir) {
  console.error('Usage: node scripts/upload-furniture-images.js [chemin/vers/images]');
  process.exit(1);
}

uploadImages(imagesDir).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
