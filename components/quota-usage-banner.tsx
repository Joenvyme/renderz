"use client";

import Link from "next/link";
import { AlertCircle, X } from "lucide-react";
import type { BillingPayload } from "@/lib/billing/billing-types";
import { FREE_GENERATIONS_PER_MONTH } from "@/lib/billing/constants";

type QuotaUsageBannerProps = {
  billing: BillingPayload | null;
  dismissed: boolean;
  onDismiss: () => void;
};

/**
 * Bandeau discret quand le palier Free approche ou atteint les limites du mois.
 */
export function QuotaUsageBanner({ billing, dismissed, onDismiss }: QuotaUsageBannerProps) {
  if (dismissed || !billing || billing.unlimited || billing.tier !== "free") return null;

  const used = billing.usage.renders + billing.usage.animations;
  const max = billing.free.generationsMax ?? FREE_GENERATIONS_PER_MONTH;
  const upscalesUsed = billing.usage.upscales;
  const upscalesMax = 1;

  const generationsExhausted = used >= max;
  const generationsNear = used >= max - 1 && used < max;
  const upscaleExhausted = upscalesUsed >= upscalesMax;

  if (!generationsExhausted && !generationsNear && !upscaleExhausted) return null;

  const isUrgent = generationsExhausted || upscaleExhausted;

  let message: string;
  if (generationsExhausted && upscaleExhausted) {
    message =
      "You’ve used all free creations and your 4K upscale for this month. Upgrade to Pro to keep going.";
  } else if (generationsExhausted) {
    message = `You’ve used all ${max} free creations this month. Upgrade to Pro for 100 renders + 100 animations per month.`;
  } else if (upscaleExhausted) {
    message = "You’ve used your free 4K upscale this month. Upgrade to Pro for 25 upscales per month.";
  } else {
    message = `You have ${max - used} free creation left this month. Upgrade anytime for higher limits.`;
  }

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
          href="/settings?plan=pro_monthly#billing"
          className="mt-1.5 inline-block font-mono text-[10px] uppercase tracking-wider underline underline-offset-2 hover:no-underline sm:text-[11px]"
        >
          View Pro plans
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
