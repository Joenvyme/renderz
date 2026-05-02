/** Rendu issu d’un upscale studio (nouvelle ligne portfolio). */
export function isMagnific4KExportMetadata(metadata: unknown): boolean {
  return (
    metadata != null &&
    typeof metadata === "object" &&
    !Array.isArray(metadata) &&
    "upscale_source_render_id" in (metadata as object)
  );
}

/** Tuile galerie : afficher la pastille 4K (variante dédiée ou export upscale). */
export function galleryItemShows4KBadge(
  variant: "standard" | "4k" | "video",
  metadata: unknown
): boolean {
  if (variant === "video") return false;
  if (variant === "4k") return true;
  return isMagnific4KExportMetadata(metadata);
}

/** Vignette / liste : ce rendu représente une version 4K reconnaissable. */
export function renderShows4KBadge(r: {
  metadata?: unknown;
  upscaled_image_url?: string | null;
  generated_image_url?: string | null;
}): boolean {
  if (
    r.upscaled_image_url &&
    r.generated_image_url &&
    r.upscaled_image_url !== r.generated_image_url
  ) {
    return true;
  }
  return isMagnific4KExportMetadata(r.metadata);
}

export function Render4KBadge({
  className = "",
  compact = false,
}: {
  className?: string;
  /** Vignettes studio (très petit). */
  compact?: boolean;
}) {
  return (
    <div
      className={`pointer-events-none rounded-xl bg-emerald-400 font-mono font-bold tabular-nums tracking-tight text-emerald-950 shadow-sm ${
        compact
          ? "px-[3px] py-px text-[7px] leading-none"
          : "px-1 py-0.5 text-[8px] leading-none sm:px-1.5 sm:py-0.5 sm:text-[9px]"
      } ${className}`}
      aria-hidden
    >
      4K
    </div>
  );
}
