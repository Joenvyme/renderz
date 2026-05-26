"use client";

import { useEffect, useState } from "react";
import { AuroraText } from "@/components/ui/aurora-text";

/**
 * Bloc d'intro du hero — rendu uniquement côté client pour éviter tout
 * mismatch d'hydratation causé par des extensions navigateur.
 */
export function HeroIntro() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        aria-hidden
        className="mx-auto w-full max-w-4xl shrink-0 px-4"
        style={{ minHeight: "15rem" }}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl shrink-0 px-1 text-center sm:px-4">
      <div className="mb-4 flex justify-center sm:mb-6">
        <span className="inline-flex max-w-[min(100%,18rem)] items-center justify-center gap-1.5 rounded-full border border-border/60 bg-white/70 px-2.5 py-1 text-[10px] font-medium tracking-wide text-foreground/75 shadow-[0_2px_12px_rgba(0,0,0,0.04)] backdrop-blur-xl sm:max-w-none sm:px-3 sm:text-xs">
          <span aria-hidden className="shrink-0">
            🇨🇭
          </span>
          <span className="sm:hidden">Swiss-made</span>
          <span className="hidden sm:inline">Made with heart in the Swiss mountains</span>
        </span>
      </div>

      <h1 className="mx-auto max-w-full text-balance text-[clamp(0.9375rem,4.6vw,3.25rem)] font-semibold leading-[1.08] tracking-tight text-foreground sm:whitespace-nowrap sm:text-[clamp(1.0625rem,5.4vw,3.25rem)] sm:leading-[1.05]">
        Your <AuroraText>AI</AuroraText> <AuroraText>rendering</AuroraText> assistant.
      </h1>

      <p className="mx-auto mt-2 max-w-full text-balance text-[clamp(0.9375rem,4.2vw,3.25rem)] font-semibold leading-[1.08] tracking-tight text-foreground sm:mt-3 sm:whitespace-nowrap sm:text-[clamp(1.0625rem,5.4vw,3.25rem)] sm:leading-[1.05]">
        Built for Architects &amp; Designers
      </p>

      <p className="mx-auto mt-4 max-w-xl px-1 text-sm leading-relaxed text-muted-foreground sm:mt-6 sm:px-0 sm:text-base md:text-lg">
        Show concepts easily and get client approvals faster.
      </p>
    </div>
  );
}
