"use client";

import Link from "next/link";
import { AlertCircle, X } from "lucide-react";
import type { BillingPayload } from "@/lib/billing/billing-types";
import { TRIAL_GENERATIONS_TOTAL } from "@/lib/billing/constants";

type QuotaUsageBannerProps = {
  billing: BillingPayload | null;
  dismissed: boolean;
  onDismiss: () => void;
};

/**
 * Bandeau discret quand le palier Trial approche ou atteint les limites.
 */
export function QuotaUsageBanner({ billing, dismissed, onDismiss }: QuotaUsageBannerProps) {
  if (dismissed || !billing || billing.unlimited || billing.tier !== "trial") return null;

  const used = billing.trial.generationsUsed;
  const max = billing.trial.generationsMax ?? TRIAL_GENERATIONS_TOTAL;

  const generationsExhausted = used >= max;
  const generationsNear = used >= max - 5 && used < max;

  if (!generationsExhausted && !generationsNear) return null;

  const isUrgent = generationsExhausted;

  const message = generationsExhausted
    ? `You’ve used all ~${max} trial creations. Subscribe to Solo for 200 renders/month without watermark.`
    : `You have ${max - used} trial creations left. Subscribe anytime for higher limits.`;

  return (
    <div
      className={`relative mb-4 flex items-start gap-3 rounded-[6px] border px-3 py-2.5 sm:px-4 sm:py-3 ${
        isUrgent
          ? "border-amber-300/80 bg-amber-50 text-amber-950"
          : "border-border/80 bg-muted/30 text-foreground"
      }`}
      role="status"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1 pr-6">
        <p className="text-xs font-medium leading-snug sm:text-sm">{message}</p>
        <Link
          href="/settings?plan=solo_monthly#billing"
          className="mt-1.5 inline-block font-mono text-[10px] uppercase tracking-wider underline underline-offset-2 hover:no-underline sm:text-[11px]"
        >
          View Solo plans
        </Link>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="absolute right-2 top-2 rounded p-1 opacity-70 transition-opacity hover:opacity-100"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
