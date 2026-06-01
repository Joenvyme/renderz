import type { CheckoutPlanKey } from "@/lib/stripe/server";

const STORAGE_KEY = "renderz_pending_checkout_plan";

const CHECKOUT_PLANS: CheckoutPlanKey[] = [
  "pro_monthly",
  "pro_yearly",
  "enterprise_monthly",
  "enterprise_yearly",
];

export function isCheckoutPlanKey(value: string | null | undefined): value is CheckoutPlanKey {
  if (!value) return false;
  return (CHECKOUT_PLANS as string[]).includes(value);
}

export function setPendingCheckoutPlan(plan: CheckoutPlanKey): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, plan);
  } catch {
    /* ignore */
  }
}

/** Lit et efface le plan en attente (une seule consommation). */
export function consumePendingCheckoutPlan(): CheckoutPlanKey | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    return isCheckoutPlanKey(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function settingsUrlForCheckoutPlan(plan: CheckoutPlanKey): string {
  return `/settings?plan=${encodeURIComponent(plan)}#billing`;
}
