/** Affichage tarifs (CHF) — aligné sur SUBSCRIPTION_PRICING.md */
export const PRO_MONTHLY = 60;
export const PRO_YEARLY = 648;
export const ENT_MONTHLY = 450;
export const ENT_YEARLY = 4860;
export const ANNUAL_DISCOUNT_LABEL = "−10 %";

export type PricingInterval = "monthly" | "yearly";

export function formatChf(n: number) {
  return new Intl.NumberFormat("fr-CH", {
    style: "decimal",
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}
