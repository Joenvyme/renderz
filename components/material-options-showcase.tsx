"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type MaterialOption = {
  title: string;
  src: string;
  prompt: string;
};

const MATERIAL_OPTIONS: MaterialOption[] = [
  {
    title: "Dark",
    src: "/compare-dark.png",
    prompt: "Dark marble counters, walnut cabinetry, moody evening light.",
  },
  {
    title: "Scandinavian",
    src: "/compare-scandinave.png",
    prompt: "Bright Scandinavian kitchen — white oak, linen, soft daylight.",
  },
  {
    title: "White Marble",
    src: "/compare-white.png",
    prompt: "All-white marble, minimal hardware, crisp gallery light.",
  },
  {
    title: "Warm Wood",
    src: "/compare-wood.png",
    prompt: "Warm natural wood throughout, golden afternoon sun.",
  },
];

export function MaterialOptionsShowcase() {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:gap-5">
        {MATERIAL_OPTIONS.map((option) => (
          <article
            key={option.src}
            tabIndex={0}
            aria-label={`${option.title} — ${option.prompt}`}
            className={cn(
              "group relative overflow-hidden rounded-[6px] border border-border/60 bg-white outline-none",
              "shadow-[0_10px_32px_-20px_rgba(0,0,0,0.2)] transition-all duration-300",
              "hover:-translate-y-0.5 hover:border-foreground/30",
              "focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
            )}
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <Image
                src={option.src}
                alt={`${option.title} material variant`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 520px"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02] motion-reduce:group-hover:scale-100"
              />

              {/* Prompt au survol */}
              <div
                className={cn(
                  "absolute inset-0 z-[1] flex items-center justify-center px-4 opacity-0",
                  "group-hover:opacity-100 group-focus-within:opacity-100"
                )}
                aria-hidden
              >
                <div className="absolute inset-0 bg-black/30 backdrop-blur-md motion-reduce:backdrop-blur-none motion-reduce:bg-black/50" />
                <p className="relative z-[2] max-w-[90%] text-balance text-center text-sm font-medium leading-snug text-white sm:text-base">
                  &ldquo;{option.prompt}&rdquo;
                </p>
              </div>
            </div>

            <div className="absolute left-2 top-2 z-[2] rounded-[2px] border border-white/30 bg-black/55 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white backdrop-blur-sm sm:left-3 sm:top-3 sm:text-[11px]">
              {option.title}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
