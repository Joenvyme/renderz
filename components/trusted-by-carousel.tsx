"use client";

import { cn } from "@/lib/utils";

/** Cabinets / studios fictifs — à remplacer par de vrais logos plus tard. */
const TRUSTED_BRANDS = [
  "Atelier Nord",
  "Studio Grid",
  "Bureau 9",
  "MA+CH",
  "Formwerk",
  "Ligne Suisse",
  "Rhône Architects",
  "Alpine Works",
  "Canton Works",
  "Bâtir SA",
] as const;

type TrustedByCarouselProps = {
  className?: string;
};

/**
 * Marquee infini sans contrôles — défile en continu avec un fade-out sur les
 * côtés. Pause au survol. Inspiration Linear / Vercel / Resend.
 */
export function TrustedByCarousel({ className }: TrustedByCarouselProps) {
  const items = [...TRUSTED_BRANDS, ...TRUSTED_BRANDS];

  return (
    <div className={cn("w-full", className)}>
      <p className="mb-4 px-1 text-center font-mono text-[9px] font-medium uppercase tracking-[0.22em] text-foreground/45 sm:mb-6 sm:px-0 sm:text-[11px] sm:tracking-[0.32em]">
        <span className="sm:hidden">Trusted by studios</span>
        <span className="hidden sm:inline">Trusted by leading architecture studios</span>
      </p>
      <div
        className="group relative -mx-1 overflow-hidden sm:mx-0"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 4%, black 96%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 4%, black 96%, transparent)",
        }}
      >
        <div
          className="flex w-max shrink-0 animate-marquee items-center gap-8 pr-8 will-change-transform group-hover:[animation-play-state:paused] motion-reduce:animate-none sm:gap-14 sm:pr-14"
          style={{ "--marquee-duration": "40s" } as React.CSSProperties}
          aria-hidden
        >
          {items.map((name, i) => (
            <span
              key={`${name}-${i}`}
              className="shrink-0 whitespace-nowrap font-mono text-xs font-semibold uppercase tracking-wide text-foreground/35 transition-colors duration-300 hover:text-foreground/90 sm:text-sm md:text-base"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
      <span className="sr-only">
        {TRUSTED_BRANDS.join(", ")} use Renderz.
      </span>
    </div>
  );
}
