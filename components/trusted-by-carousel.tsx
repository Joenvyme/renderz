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
      <p className="mb-5 text-center font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-foreground/45 sm:mb-6 sm:text-[11px]">
        Trusted by leading architecture studios
      </p>
      <div
        className="group relative overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        }}
      >
        <div
          className="flex w-max shrink-0 animate-marquee items-center gap-10 pr-10 will-change-transform group-hover:[animation-play-state:paused] sm:gap-14 sm:pr-14 motion-reduce:animate-none"
          style={{ "--marquee-duration": "40s" } as React.CSSProperties}
          aria-hidden
        >
          {items.map((name, i) => (
            <span
              key={`${name}-${i}`}
              className="shrink-0 whitespace-nowrap font-mono text-sm font-semibold uppercase tracking-wide text-foreground/35 transition-colors duration-300 hover:text-foreground/90 sm:text-base"
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
