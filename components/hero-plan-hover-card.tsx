"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

const DEFAULT_BEFORE = "/Hero image – 1.png";
const DEFAULT_AFTER = "/Hero image – 2.png";

type HeroPlanHoverCardProps = {
  className?: string;
  /** Titre au-dessus de la vignette (ex. « Plans to Renderz »). */
  title?: string;
  /** Image affichée par défaut (ex. plan, chantier). */
  beforeSrc?: string;
  /** Image au survol (ex. rendu final). */
  afterSrc?: string;
  /** Alt pour l’image « avant » (l’« après » reste décorative au survol). */
  beforeAlt?: string;
  /** Texte du bandeau en bas. */
  hoverHint?: string;
  priority?: boolean;
  /** Taille pour `next/image` `sizes` (ex. grille 2 colonnes). */
  sizes?: string;
};

/**
 * Carte avant → après au survol (crossfade + léger zoom).
 */
export function HeroPlanHoverCard({
  className,
  title,
  beforeSrc = DEFAULT_BEFORE,
  afterSrc = DEFAULT_AFTER,
  beforeAlt = "Projet architectural — vue plan / filaire",
  hoverHint = "Survolez pour voir le rendu",
  priority = false,
  sizes = "(max-width: 672px) 100vw, 672px",
}: HeroPlanHoverCardProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col",
        title ? "gap-3 sm:gap-3.5" : undefined,
        className
      )}
    >
      {title ? (
        <h3 className="text-center font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/85 sm:text-xs">
          {title}
        </h3>
      ) : null}

      <div className="group relative w-full overflow-hidden rounded-[6px] border border-border/50 bg-muted/20 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
        <div className="relative aspect-video w-full">
          <div className="absolute inset-0 origin-center transition-transform duration-700 ease-out will-change-transform group-hover:scale-[1.04] motion-reduce:group-hover:scale-100">
            <Image
              src={beforeSrc}
              alt={beforeAlt}
              fill
              className="object-cover"
              sizes={sizes}
              priority={priority}
            />
          </div>
          <div
            className="pointer-events-none absolute inset-0 origin-center opacity-0 transition-opacity duration-700 ease-out will-change-opacity group-hover:opacity-100 motion-reduce:transition-none"
            aria-hidden
          >
            <div className="absolute inset-0 origin-center transition-transform duration-700 ease-out will-change-transform group-hover:scale-[1.04] motion-reduce:group-hover:scale-100">
              <Image
                src={afterSrc}
                alt=""
                fill
                className="object-cover"
                sizes={sizes}
              />
            </div>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent px-4 pb-3 pt-12 opacity-100 transition-opacity duration-500 group-hover:opacity-0 sm:pb-4">
            <p className="text-center font-mono text-[10px] uppercase tracking-widest text-white/90 sm:text-xs">
              {hoverHint}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
