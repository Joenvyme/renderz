#!/usr/bin/env node

/**
 * Script de validation pour le catalogue de mobilier
 * Usage: node scripts/validate-furniture-catalog.js data/furniture-catalog.json
 */

const fs = require('fs');
const path = require('path');

// Catégories acceptées
const VALID_CATEGORIES = [
  'sofa', 'chair', 'table', 'coffee-table', 'dining-table', 'desk',
  'bed', 'wardrobe', 'shelf', 'lamp', 'rug', 'curtain', 'plant',
  'decoration', 'storage', 'ottoman', 'mirror', 'cabinet'
];

// Styles acceptés
const VALID_STYLES = [
  'modern', 'contemporary', 'scandinavian', 'industrial', 'minimalist',
  'rustic', 'classic', 'luxury', 'mid-century', 'bohemian', 'vintage', 'transitional'
];

function validateCatalog(filePath) {
  console.log(`\n🔍 Validation du catalogue: ${filePath}\n`);

  // Lire le fichier
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Fichier non trouvé: ${filePath}`);
    process.exit(1);
  }

  let catalog;
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    catalog = JSON.parse(content);
  } catch (error) {
    console.error(`❌ Erreur de parsing JSON: ${error.message}`);
    process.exit(1);
  }

  if (!Array.isArray(catalog)) {
    console.error('❌ Le catalogue doit être un tableau JSON');
    process.exit(1);
  }

  console.log(`📊 Nombre d'éléments: ${catalog.length}\n`);

  const errors = [];
  const warnings = [];
  const names = new Set();

  catalog.forEach((item, index) => {
    const itemNum = index + 1;
    const prefix = `[Item ${itemNum}]`;

    // Vérifier les champs requis
    if (!item.name) {
      errors.push(`${prefix} ❌ 'name' manquant`);
    } else {
      if (names.has(item.name)) {
        warnings.push(`${prefix} ⚠️  Doublon détecté: "${item.name}"`);
      }
      names.add(item.name);
    }

    if (!item.category) {
      errors.push(`${prefix} ❌ 'category' manquant`);
    } else if (!VALID_CATEGORIES.includes(item.category)) {
      errors.push(`${prefix} ❌ Catégorie invalide: "${item.category}" (valides: ${VALID_CATEGORIES.join(', ')})`);
    }

    if (!item.style) {
      warnings.push(`${prefix} ⚠️  'style' manquant`);
    } else if (!VALID_STYLES.includes(item.style)) {
      warnings.push(`${prefix} ⚠️  Style invalide: "${item.style}" (valides: ${VALID_STYLES.join(', ')})`);
    }

    if (!item.promptEnhancement) {
      errors.push(`${prefix} ❌ 'promptEnhancement' manquant (crucial pour la génération IA)`);
    } else if (item.promptEnhancement.length < 20) {
      warnings.push(`${prefix} ⚠️  'promptEnhancement' trop court (minimum 20 caractères recommandé)`);
    }

    // Vérifier metadata
    if (!item.metadata) {
      warnings.push(`${prefix} ⚠️  'metadata' manquant`);
    } else {
      if (!item.metadata.materials || !Array.isArray(item.metadata.materials)) {
        warnings.push(`${prefix} ⚠️  'metadata.materials' doit être un tableau`);
      }
      if (!item.metadata.color) {
        warnings.push(`${prefix} ⚠️  'metadata.color' manquant`);
      }
    }

    // Vérifier dimensions si présentes
    if (item.metadata?.dimensions) {
      const dims = item.metadata.dimensions;
      if (typeof dims.width !== 'number' || dims.width <= 0) {
        warnings.push(`${prefix} ⚠️  Dimension 'width' invalide`);
      }
      if (typeof dims.height !== 'number' || dims.height <= 0) {
        warnings.push(`${prefix} ⚠️  Dimension 'height' invalide`);
      }
      if (typeof dims.depth !== 'number' || dims.depth <= 0) {
        warnings.push(`${prefix} ⚠️  Dimension 'depth' invalide`);
      }
    }
  });

  // Afficher les résultats
  if (errors.length > 0) {
    console.log('❌ ERREURS CRITIQUES:\n');
    errors.forEach(err => console.log(`  ${err}`));
    console.log('');
  }

  if (warnings.length > 0) {
    console.log('⚠️  AVERTISSEMENTS:\n');
    warnings.forEach(warn => console.log(`  ${warn}`));
    console.log('');
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ Catalogue valide ! Aucune erreur détectée.\n');
  } else if (errors.length === 0) {
    console.log('✅ Catalogue valide (avec avertissements mineurs)\n');
  } else {
    console.log(`❌ ${errors.length} erreur(s) à corriger\n`);
    process.exit(1);
  }

  // Statistiques
  const categories = {};
  const styles = {};
  catalog.forEach(item => {
    if (item.category) {
      categories[item.category] = (categories[item.category] || 0) + 1;
    }
    if (item.style) {
      styles[item.style] = (styles[item.style] || 0) + 1;
    }
  });

  console.log('📈 STATISTIQUES:\n');
  console.log('Catégories:');
  Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count}`);
    });
  console.log('\nStyles:');
  Object.entries(styles)
    .sort((a, b) => b[1] - a[1])
    .forEach(([style, count]) => {
      console.log(`  ${style}: ${count}`);
    });
  console.log('');
}

// Exécution
const filePath = process.argv[2] || 'data/furniture-catalog.json';
validateCatalog(filePath);

