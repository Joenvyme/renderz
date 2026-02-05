#!/usr/bin/env node

/**
 * Script d'import du catalogue de mobilier Nunc dans Supabase
 * Usage: node scripts/import-furniture-catalog.js [path/to/catalog.json]
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase depuis les variables d'environnement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  console.error('\n💡 Créez un fichier .env.local avec ces variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function importCatalog(filePath) {
  console.log(`\n📦 Import du catalogue depuis: ${filePath}\n`);

  // Lire le fichier JSON
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Fichier non trouvé: ${filePath}`);
    process.exit(1);
  }

  let catalogData;
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    catalogData = JSON.parse(content);
  } catch (error) {
    console.error(`❌ Erreur de parsing JSON: ${error.message}`);
    process.exit(1);
  }

  // Vérifier la structure
  if (!catalogData.items || !Array.isArray(catalogData.items)) {
    console.error('❌ Structure JSON invalide: "items" doit être un tableau');
    process.exit(1);
  }

  const items = catalogData.items;
  console.log(`📊 ${items.length} éléments à importer\n`);

  // Transformer les données pour correspondre au schéma Supabase
  const furnitureItems = items.map(item => ({
    id: item.id,
    supplier_id: item.supplierId || 'nunc',
    name: item.name,
    category: item.category,
    style: item.style,
    image_url: item.imageUrl || '',
    prompt_enhancement: item.promptEnhancement,
    metadata: {
      materials: item.metadata?.materials || [],
      color: item.metadata?.color || '',
      dimensions: item.metadata?.dimensions || {},
      brand: item.metadata?.brand || '',
      reference: item.metadata?.reference || '',
      designer: item.metadata?.designer || '',
    },
  }));

  // Vérifier les doublons
  const ids = furnitureItems.map(item => item.id);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length > 0) {
    console.warn(`⚠️  Doublons détectés: ${duplicates.join(', ')}`);
  }

  // Option 1: Supprimer les anciennes données (optionnel)
  const clearExisting = process.argv.includes('--clear');
  if (clearExisting) {
    console.log('🗑️  Suppression des anciennes données...');
    const { error: deleteError } = await supabase
      .from('furniture_catalog')
      .delete()
      .neq('id', ''); // Supprime tout
    
    if (deleteError) {
      console.error('❌ Erreur lors de la suppression:', deleteError.message);
      process.exit(1);
    }
    console.log('✓ Anciennes données supprimées\n');
  }

  // Option 2: Upsert (insert ou update)
  console.log('📤 Import des données...');
  
  // Insérer par batch de 50 pour éviter les limites
  const batchSize = 50;
  let imported = 0;
  let errors = 0;

  for (let i = 0; i < furnitureItems.length; i += batchSize) {
    const batch = furnitureItems.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('furniture_catalog')
      .upsert(batch, {
        onConflict: 'id',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error(`❌ Erreur batch ${i / batchSize + 1}:`, error.message);
      errors += batch.length;
    } else {
      imported += batch.length;
      console.log(`✓ Batch ${i / batchSize + 1}: ${batch.length} éléments importés (${imported}/${furnitureItems.length})`);
    }
  }

  console.log(`\n✅ Import terminé:`);
  console.log(`   ✓ ${imported} éléments importés`);
  if (errors > 0) {
    console.log(`   ❌ ${errors} erreurs`);
  }

  // Statistiques
  const { data: stats } = await supabase
    .from('furniture_catalog')
    .select('category, style')
    .eq('supplier_id', 'nunc');

  if (stats) {
    const categories = {};
    const styles = {};
    stats.forEach(item => {
      categories[item.category] = (categories[item.category] || 0) + 1;
      styles[item.style] = (styles[item.style] || 0) + 1;
    });

    console.log(`\n📈 Statistiques:`);
    console.log(`   Catégories: ${Object.keys(categories).length}`);
    console.log(`   Styles: ${Object.keys(styles).length}`);
    console.log(`\n   Top catégories:`);
    Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([cat, count]) => {
        console.log(`     ${cat}: ${count}`);
      });
  }

  console.log('');
}

// Exécution
const filePath = process.argv[2] || path.join(__dirname, '..', 'nunc_catalog_2025.json');
importCatalog(filePath).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
