"use client";

import { useEffect, useState } from "react";
import { AuroraText } from "@/components/ui/aurora-text";
import { cn } from "@/lib/utils";

/**
 * Bloc d'intro du hero — rendu uniquement côté client pour éviter tout
 * mismatch d'hydratation causé par des extensions navigateur.
 */
type HeroIntroProps = {
  className?: string;
};

export function HeroIntro({ className }: HeroIntroProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        aria-hidden
        className="mx-auto w-full max-w-4xl shrink-0"
        style={{ minHeight: "11.5rem" }}
      />
    );
  }

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-4xl flex-col items-center text-center",
        className
      )}
    >
      <div className="mb-3 flex justify-center sm:mb-5">
        <span className="inline-flex max-w-[min(100%,16rem)] items-center justify-center gap-1 rounded-full border border-border/60 bg-white/80 px-2.5 py-1 text-[9px] font-medium tracking-wide text-foreground/75 shadow-[0_2px_12px_rgba(0,0,0,0.04)] backdrop-blur-xl sm:max-w-none sm:gap-1.5 sm:px-3 sm:py-1 sm:text-xs">
          <span aria-hidden className="shrink-0 text-[10px] sm:text-xs">
            🇨🇭
          </span>
          <span className="sm:hidden">Swiss-made</span>
          <span className="hidden sm:inline">Built in Switzerland for architects &amp; designers</span>
        </span>
      </div>

      <h1 className="flex w-full flex-col items-center overflow-visible text-balance text-[clamp(1.625rem,7vw,3.25rem)] font-semibold leading-[1.08] tracking-tight text-foreground md:text-[clamp(1.875rem,5.2vw,3.25rem)]">
        <span>Photoreal renders</span>
        <span className="mt-1 overflow-visible px-0.5 sm:mt-1.5 sm:px-1">
          for your next <AuroraText className="pb-0 pr-[0.15em]">client review</AuroraText>
        </span>
      </h1>

      <p className="mx-auto mt-3 max-w-[19rem] text-pretty text-[13px] leading-[1.45] text-muted-foreground sm:mt-5 sm:max-w-xl sm:text-base sm:leading-relaxed md:text-lg">
        <span className="sm:hidden">
          Plans, sketches, photos → presentation-ready visuals. No 3D pipeline.
        </span>
        <span className="hidden sm:inline">
          Turn plans, sketches, and photos into presentation-ready visuals — in plain English, without a 3D pipeline.
        </span>
      </p>
    </div>
  );
}
