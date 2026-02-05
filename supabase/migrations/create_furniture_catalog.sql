-- Migration: Create furniture_catalog table
-- Description: Table pour stocker le catalogue de mobilier Nunc

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

-- Index pour les recherches par catégorie et style
CREATE INDEX IF NOT EXISTS idx_furniture_category ON furniture_catalog(category);
CREATE INDEX IF NOT EXISTS idx_furniture_style ON furniture_catalog(style);
CREATE INDEX IF NOT EXISTS idx_furniture_supplier ON furniture_catalog(supplier_id);

-- Index pour la recherche textuelle (nom et prompt)
CREATE INDEX IF NOT EXISTS idx_furniture_name_search ON furniture_catalog USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_furniture_prompt_search ON furniture_catalog USING gin(to_tsvector('english', prompt_enhancement));

-- Commentaires pour la documentation
COMMENT ON TABLE furniture_catalog IS 'Catalogue de mobilier pour enrichir les prompts de génération';
COMMENT ON COLUMN furniture_catalog.prompt_enhancement IS 'Description détaillée en anglais pour enrichir le prompt IA';
COMMENT ON COLUMN furniture_catalog.metadata IS 'Métadonnées JSON (materials, color, dimensions, designer, reference, etc.)';
