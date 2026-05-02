import type { BillingPayload } from "@/lib/billing/billing-types";

function formatUtcDateLabel(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Ligne au-dessus des cartes de quotas (renouvellement Stripe ou période gratuite). */
export function formatQuotaCardsSubtitle(b: BillingPayload): string {
  if (b.unlimited) return "";
  if (b.tier === "free") {
    return `Période de quotas · ${b.free.periodKey}`;
  }
  if (b.subscription?.currentPeriodEnd) {
    const label = formatUtcDateLabel(b.subscription.currentPeriodEnd);
    if (b.subscription.cancelAtPeriodEnd) {
      return `Accès jusqu’au ${label} — renouvellement désactivé`;
    }
    return `Renouvellement automatique le ${label} (UTC)`;
  }
  return `Période · ${b.period.key}`;
}
