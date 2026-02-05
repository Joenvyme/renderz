const fs = require('fs');

const data = JSON.parse(fs.readFileSync('nunc_catalog_2025.json', 'utf-8'));

const items = data.items.map(item => {
  // Échapper les apostrophes pour SQL
  const escape = (str) => (str || '').replace(/'/g, "''");
  
  const metadata = JSON.stringify(item.metadata || {});
  const name = escape(item.name);
  const prompt = escape(item.promptEnhancement);
  const imageUrl = escape(item.imageUrl || '');
  
  return `('${item.id}', '${item.supplierId}', '${name}', '${item.category}', '${item.style}', '${imageUrl}', '${prompt}', '${metadata}'::jsonb)`;
});

const sql = `INSERT INTO furniture_catalog (id, supplier_id, name, category, style, image_url, prompt_enhancement, metadata) VALUES 
${items.join(',\n')} 
ON CONFLICT (id) DO UPDATE SET 
  supplier_id = EXCLUDED.supplier_id, 
  name = EXCLUDED.name, 
  category = EXCLUDED.category, 
  style = EXCLUDED.style, 
  image_url = EXCLUDED.image_url, 
  prompt_enhancement = EXCLUDED.prompt_enhancement, 
  metadata = EXCLUDED.metadata, 
  updated_at = NOW();`;

console.log(sql);
