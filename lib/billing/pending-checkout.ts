import type { CheckoutPlanKey } from "@/lib/billing/plans";
import { checkoutPlanKeys, isCheckoutPlanKey } from "@/lib/billing/plans";

const STORAGE_KEY = "renderz_pending_checkout";

export type PendingCheckout = {
  plan: CheckoutPlanKey;
  quantity?: number;
};

export { isCheckoutPlanKey };

export function setPendingCheckout(payload: PendingCheckout): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function setPendingCheckoutPlan(plan: CheckoutPlanKey, quantity?: number): void {
  setPendingCheckout({ plan, quantity });
}

/** Lit et efface le checkout en attente (une seule consommation). */
export function consumePendingCheckout(): PendingCheckout | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { plan?: string; quantity?: number };
    if (!isCheckoutPlanKey(parsed.plan)) return null;
    const quantity =
      typeof parsed.quantity === "number" && parsed.quantity >= 1 ? parsed.quantity : undefined;
    return { plan: parsed.plan, quantity };
  } catch {
    return null;
  }
}

/** @deprecated Utiliser consumePendingCheckout */
export function consumePendingCheckoutPlan(): CheckoutPlanKey | null {
  return consumePendingCheckout()?.plan ?? null;
}

export function settingsUrlForCheckoutPlan(plan: CheckoutPlanKey, quantity?: number): string {
  const params = new URLSearchParams({ plan });
  if (quantity != null && quantity > 1) {
    params.set("quantity", String(quantity));
  }
  return `/settings?${params.toString()}#billing`;
}
