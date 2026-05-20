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
    <div className="mx-auto w-full max-w-4xl shrink-0 px-4 text-center">
      <div className="mb-5 flex justify-center sm:mb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-white/70 px-3 py-1 text-[11px] font-medium tracking-wide text-foreground/75 shadow-[0_2px_12px_rgba(0,0,0,0.04)] backdrop-blur-xl sm:text-xs">
          <span aria-hidden>🇨🇭</span>
          Made with heart in the Swiss mountains
        </span>
      </div>

      <h1 className="mx-auto whitespace-nowrap text-[clamp(1.0625rem,5.4vw,3.25rem)] font-semibold leading-[1.05] tracking-tight text-foreground">
        Your <AuroraText>AI</AuroraText> <AuroraText>rendering</AuroraText> assistant.
      </h1>

      <p className="mx-auto mt-2 whitespace-nowrap text-[clamp(1.0625rem,5.4vw,3.25rem)] font-semibold leading-[1.05] tracking-tight text-foreground sm:mt-3">
        Built for Architects &amp; Designers
      </p>

      <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:mt-6 sm:text-base md:text-lg">
        Show concepts easily and get client approvals faster.
      </p>
    </div>
  );
}
