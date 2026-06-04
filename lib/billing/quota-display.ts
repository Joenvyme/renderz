import type { BillingPayload } from "@/lib/billing/billing-types";
import {
  TRIAL_GENERATIONS_TOTAL,
  TRIAL_UPSCALES_TOTAL,
} from "@/lib/billing/constants";

export type QuotaMetric = {
  id: string;
  label: string;
  used: number;
  max: number;
  accent?: "default" | "amber" | "violet";
};

export function quotaUsagePercent(used: number, max: number) {
  if (max <= 0) return 0;
  return Math.min(100, Math.round((used / max) * 100));
}

/** Métriques affichées (profil, paramètres) — alignées sur la logique d’API / quotas. */
export function getQuotaMetrics(billing: BillingPayload): QuotaMetric[] {
  if (billing.unlimited) return [];

  if (billing.tier === "trial") {
    const metrics: QuotaMetric[] = [
      {
        id: "generations",
        label: "Creations (HD + anim.)",
        used: billing.trial.generationsUsed,
        max: billing.trial.generationsMax ?? TRIAL_GENERATIONS_TOTAL,
        accent: "default",
      },
    ];
    if (TRIAL_UPSCALES_TOTAL > 0) {
      metrics.push({
        id: "upscales",
        label: "4K upscales",
        used: billing.trial.upscalesUsed,
        max: billing.trial.upscalesMax ?? TRIAL_UPSCALES_TOTAL,
        accent: "amber",
      });
    }
    return metrics;
  }

  if (!billing.limits) return [];

  return [
    {
      id: "renders",
      label: "HD renders",
      used: billing.usage.renders,
      max: billing.limits.renders,
      accent: "default",
    },
    {
      id: "upscales",
      label: "4K upscales",
      used: billing.usage.upscales,
      max: billing.limits.upscales,
      accent: "amber",
    },
    {
      id: "animations",
      label: "Animations",
      used: billing.usage.animations,
      max: billing.limits.animations,
      accent: "violet",
    },
  ];
}
