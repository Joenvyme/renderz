"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  TRIAL_CTA_LABEL,
  TRIAL_PROMO_BULLETS,
  TRIAL_PROMO_FOOTNOTE,
  TRIAL_PROMO_SKIP_TRIAL_HINT,
} from "@/lib/billing/plans";

type PricingTrialPromoBannerProps = {
  onStartSoloTrial: () => void;
  onSkipTrialHint?: () => void;
  dark?: boolean;
  className?: string;
};

/**
 * Bandeau CTA compact : texte à gauche, bouton à droite.
 */
export function PricingTrialPromoBanner({
  onStartSoloTrial,
  onSkipTrialHint,
  dark = false,
  className,
}: PricingTrialPromoBannerProps) {
  const dot = cn("mx-1.5", dark ? "text-white/30" : "text-border");

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-4 rounded-[6px] border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-5 sm:py-3.5",
        dark
          ? "border-white/15 bg-white/[0.04]"
          : "border-border/80 bg-muted/25",
        className
      )}
    >
      <p
        className={cn(
          "min-w-0 flex-1 text-left font-mono text-[10px] leading-relaxed tracking-[0.06em] sm:text-[11px]",
          dark ? "text-white/60" : "text-muted-foreground"
        )}
      >
        {TRIAL_PROMO_BULLETS.map((b, i) => (
          <span key={b}>
            {i > 0 && <span className={dot}>·</span>}
            {b}
          </span>
        ))}
        <span className={dot}>·</span>
        {TRIAL_PROMO_FOOTNOTE}
        {onSkipTrialHint ? (
          <>
            <span className={dot}>·</span>
            <button
              type="button"
              onClick={onSkipTrialHint}
              className={cn(
                "underline underline-offset-2 transition-opacity hover:opacity-80",
                dark ? "text-white/75" : "text-foreground/80"
              )}
            >
              {TRIAL_PROMO_SKIP_TRIAL_HINT}
            </button>
          </>
        ) : null}
      </p>

      <Button
        type="button"
        onClick={onStartSoloTrial}
        className={cn(
          "h-10 shrink-0 touch-manipulation rounded-[4px] px-6 font-mono text-[11px] uppercase tracking-[0.12em] sm:h-11 sm:px-8",
          dark
            ? "bg-white text-black hover:bg-white/90"
            : "bg-black text-white hover:bg-black/85"
        )}
      >
        {TRIAL_CTA_LABEL}
      </Button>
    </div>
  );
}
