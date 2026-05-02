export type GenerationPipeline = 'gemini' | 'magnific';

/** Fidélité à l’image d’entrée vs interprétation plus libre (API : un seul curseur à la fois). */
export type MagnificAdjustMode = 'resemblance' | 'creativity';

export const MAGNIFIC_SCALE_FACTORS = [2, 4, 8, 16] as const;
export type MagnificScaleFactor = (typeof MAGNIFIC_SCALE_FACTORS)[number];

export function parseGenerationPipeline(v: unknown): GenerationPipeline {
  return v === 'magnific' ? 'magnific' : 'gemini';
}

/** -10 … +10 (entiers), pour créativité, ressemblance ou curseur unique selon le mode. */
export function clampMagnificStyleValue(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.min(10, Math.max(-10, Math.round(n)));
}

/** @deprecated utiliser clampMagnificStyleValue */
export function clampMagnificCreativity(v: unknown): number {
  return clampMagnificStyleValue(v);
}

export function parseMagnificScale(v: unknown): MagnificScaleFactor {
  const n = Number(v);
  if (n === 2 || n === 4 || n === 8 || n === 16) return n;
  return 4;
}

export function parseMagnificAdjustMode(v: unknown): MagnificAdjustMode {
  return v === 'creativity' ? 'creativity' : 'resemblance';
}
