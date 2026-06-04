/** Clés localStorage pour le formulaire de génération sur la landing (pré-auth + reprise). */
export const LANDING_RENDER_FORM_STORAGE_KEYS = {
  IMAGES: "renderz_pending_images",
  PROMPT: "renderz_pending_prompt",
  RENDER_ID: "renderz_current_render_id",
  ASPECT_RATIO: "renderz_aspect_ratio",
  IMAGE_SIZE: "renderz_image_size",
  /** `gemini` | `magnific` — aligné sur POST /api/generate */
  PIPELINE: "renderz_pipeline",
  /** @deprecated — migré vers MAGNIFIC_ADJUST_MODE + MAGNIFIC_STYLE_VALUE */
  MAGNIFIC_CREATIVITY: "renderz_magnific_creativity",
  MAGNIFIC_SCALE: "renderz_magnific_scale",
  /** `resemblance` | `creativity` — mode actif à l’envoi (un seul axe utilisé par l’API). */
  MAGNIFIC_ADJUST_MODE: "renderz_magnific_adjust_mode",
  /** @deprecated — préférer MAGNIFIC_RESEMBLANCE_VALUE + MAGNIFIC_CREATIVITY_VALUE */
  MAGNIFIC_STYLE_VALUE: "renderz_magnific_style_value",
  MAGNIFIC_RESEMBLANCE_VALUE: "renderz_magnific_resemblance_value",
  MAGNIFIC_CREATIVITY_VALUE: "renderz_magnific_creativity_value",
  /** Génération lancée sur la landing sans session — reprise après auth. */
  PENDING_GENERATE: "renderz_pending_generate",
} as const;

/** URL de retour après inscription depuis « Generate » sur la landing. */
export function landingResumeAfterAuthPath() {
  return "/?resumeGenerate=1#hero-section";
}

export function landingResumeAfterAuthUrl() {
  if (typeof window === "undefined") return landingResumeAfterAuthPath();
  return `${window.location.origin}${landingResumeAfterAuthPath()}`;
}
