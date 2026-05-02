/**
 * Constantes et types Gemini Image — importables côté client (sans sharp / Node-only).
 * La génération réelle vit dans `nano-banana.ts` (serveur uniquement).
 */

/**
 * Ratios supportés par gemini-3-pro-image-preview (tableau officiel 1K / doc image generation).
 * @see https://ai.google.dev/gemini-api/docs/image-generation#aspect_ratios_and_image_size
 */
export type AspectRatio =
  | '1:1'
  | '2:3'
  | '3:2'
  | '3:4'
  | '4:3'
  | '4:5'
  | '5:4'
  | '9:16'
  | '16:9'
  | '21:9';

/** Résolutions de sortie API (`imageSize`) — majuscule K obligatoire côté Google. */
export type ImageOutputSize = '1K' | '2K' | '4K';

export const ASPECT_RATIOS: { value: AspectRatio; label: string; resolution1K: string }[] = [
  { value: '1:1', label: 'Square', resolution1K: '1024×1024' },
  { value: '16:9', label: 'Widescreen', resolution1K: '1376×768' },
  { value: '9:16', label: 'Vertical', resolution1K: '768×1376' },
  { value: '4:3', label: 'Landscape', resolution1K: '1200×896' },
  { value: '3:4', label: 'Portrait', resolution1K: '896×1200' },
  { value: '3:2', label: 'Photo L', resolution1K: '1264×848' },
  { value: '2:3', label: 'Photo P', resolution1K: '848×1264' },
  { value: '21:9', label: 'Ultrawide', resolution1K: '1584×672' },
  { value: '4:5', label: '4:5', resolution1K: '928×1152' },
  { value: '5:4', label: '5:4', resolution1K: '1152×928' },
];

/** Libellés produit ↔ valeurs `imageSize` de l’API (HD ≈ 1K, Full HD ≈ 2K, 4K). */
export const IMAGE_OUTPUT_SIZES: {
  value: ImageOutputSize;
  label: string;
  hint: string;
}[] = [
  { value: '1K', label: 'HD', hint: '1K' },
  { value: '2K', label: 'Full HD', hint: '2K' },
  { value: '4K', label: '4K', hint: '4K' },
];

export const DEFAULT_IMAGE_OUTPUT_SIZE: ImageOutputSize = '1K';

export function isValidAspectRatio(v: string): v is AspectRatio {
  return ASPECT_RATIOS.some((r) => r.value === v);
}

export function isValidImageOutputSize(v: string): v is ImageOutputSize {
  return IMAGE_OUTPUT_SIZES.some((s) => s.value === v);
}

export type ImageRole = 'main' | 'style' | 'reference';

export interface ImageInput {
  url: string;
  role: ImageRole;
}

/**
 * Nombre maximal d’images d’entrée pour une requête `generateContent` (Gemini multimodal).
 * @see https://ai.google.dev/gemini-api/docs/image-generation
 */
export const MAX_INPUT_IMAGES = 16;
