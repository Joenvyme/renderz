"use client";

import { cn } from "@/lib/utils";
import { AGENCY_REMARK } from "@/lib/billing/plans";

type PricingAgencyRemarkProps = {
  onContact?: () => void;
  dark?: boolean;
  className?: string;
};

/** Ligne Agency discrète sous les cartes (pas une carte tarifaire). */
export function PricingAgencyRemark({ onContact, dark = false, className }: PricingAgencyRemarkProps) {
  const contact = onContact ?? (() => {
    window.location.href = "mailto:hello@renderz.ch?subject=Agency%20plan";
  });

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center gap-2 border-t pt-8 text-center",
        dark ? "border-white/10" : "border-border/60",
        className
      )}
    >
      <p
        className={cn(
          "font-mono text-[11px] uppercase tracking-[0.2em]",
          dark ? "text-white/80" : "text-foreground"
        )}
      >
        {AGENCY_REMARK.title}
      </p>
      <p className={cn("text-sm font-medium", dark ? "text-white/90" : "text-foreground")}>
        {AGENCY_REMARK.subtitle}
      </p>
      <p
        className={cn(
          "max-w-md text-sm leading-relaxed",
          dark ? "text-white/50" : "text-muted-foreground"
        )}
      >
        {AGENCY_REMARK.description}
      </p>
      <button
        type="button"
        onClick={contact}
        className={cn(
          "mt-1 font-mono text-[11px] uppercase tracking-wider underline underline-offset-4 transition-opacity hover:opacity-70",
          dark ? "text-white/55" : "text-muted-foreground"
        )}
      >
        {AGENCY_REMARK.ctaLabel}
      </button>
    </div>
  );
}
