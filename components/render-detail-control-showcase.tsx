"use client";

import Image from "next/image";
import { ArrowRight, ImagePlus, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const PROMPT =
  "Change the glass top to warm amber glass, like the reference texture.";

function RenderFrame({
  src,
  alt,
  label,
  className,
}: {
  src: string;
  alt: string;
  label: string;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-[6px] border border-border/60 bg-white",
        "shadow-[0_12px_40px_-24px_rgba(0,0,0,0.2)]",
        className
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image src={src} alt={alt} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
      </div>
      <div className="absolute left-2 top-2 rounded-[2px] border border-white/25 bg-black/55 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-white backdrop-blur-sm sm:left-3 sm:top-3 sm:text-[10px]">
        {label}
      </div>
    </article>
  );
}

/**
 * Démo statique : barre de génération (référence scène + carte texture) → prompt → avant / après.
 */
export function RenderDetailControlShowcase() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 sm:space-y-8">
      {/* ── Fake générateur compact ── */}
      <div
        aria-hidden
        className="pointer-events-none select-none rounded-[6px] border border-border/60 bg-white p-3 shadow-[0_10px_36px_-20px_rgba(0,0,0,0.18)] sm:p-4"
      >
        {/* Images de référence */}
        <div className="mb-2 flex flex-nowrap items-center gap-2.5 overflow-x-auto pb-0.5 [scrollbar-width:none] sm:gap-3 [&::-webkit-scrollbar]:hidden">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border/80 bg-muted/15 sm:h-20 sm:w-20">
            <Image
              src="/Fourniture-table-clear-glass.png"
              alt="Base render"
              fill
              sizes="80px"
              className="object-cover"
            />
            <span className="absolute left-1.5 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-400 px-1 font-mono text-[9px] font-bold text-emerald-950 shadow-sm sm:left-2 sm:top-2 sm:h-6 sm:min-w-6 sm:text-[10px]">
              1
            </span>
          </div>

          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border/80 bg-muted/15 sm:h-20 sm:w-20">
            <Image
              src="/Texture-yellow-glass.png"
              alt="Yellow glass texture reference"
              fill
              sizes="80px"
              className="object-cover"
            />
            <span className="absolute left-1.5 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-400 px-1 font-mono text-[9px] font-bold text-emerald-950 shadow-sm sm:left-2 sm:top-2 sm:h-6 sm:min-w-6 sm:text-[10px]">
              2
            </span>
          </div>
        </div>

        {/* Barre prompt */}
        <div className="flex flex-nowrap items-center gap-2 rounded-xl border border-border/80 bg-muted/15 px-3 py-2 shadow-[0_4px_20px_rgba(0,0,0,0.06)] sm:gap-2.5 sm:px-3.5 sm:py-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground/50">
            <ImagePlus className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
          </span>
          <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-foreground sm:text-[15px]">
            {PROMPT}
          </p>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground/50">
            <SlidersHorizontal className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
          </span>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/[0.06] text-foreground">
            <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
          </span>
        </div>
      </div>

      {/* Avant / Après */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <RenderFrame
          src="/Fourniture-table-clear-glass.png"
          alt="Render before glass texture change"
          label="Before"
        />
        <RenderFrame
          src="/table.png"
          alt="Render after glass texture change"
          label="After"
        />
      </div>
    </div>
  );
}
