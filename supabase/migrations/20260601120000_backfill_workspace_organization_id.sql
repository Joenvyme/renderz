-- Rattache les données legacy (organization_id NULL) à l'org perso du créateur.
-- À exécuter une fois en prod pour isoler correctement les espaces de travail.

UPDATE renders
SET organization_id = 'org_' || user_id::text
WHERE organization_id IS NULL;

UPDATE projects
SET organization_id = 'org_' || user_id::text
WHERE organization_id IS NULL;

UPDATE catalog_folders
SET organization_id = 'org_' || user_id::text
WHERE organization_id IS NULL;

UPDATE catalog_items
SET organization_id = 'org_' || user_id::text
WHERE organization_id IS NULL;

UPDATE source_images
SET organization_id = 'org_' || user_id::text
WHERE organization_id IS NULL;
