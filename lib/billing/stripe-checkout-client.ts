import type { BillingTier } from "@/lib/billing/constants";
import type { CheckoutPlanKey } from "@/lib/billing/plans";
import { isStudioCheckoutPlan } from "@/lib/stripe/server";

export async function startStripeCheckout(
  plan: CheckoutPlanKey,
  options?: { quantity?: number }
): Promise<void> {
  const body: { plan: CheckoutPlanKey; quantity?: number } = { plan };
  if (options?.quantity != null && isStudioCheckoutPlan(plan)) {
    body.quantity = options.quantity;
  }

  const res = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok) {
    throw new Error(data.error || "Checkout failed");
  }
  if (!data.url) {
    throw new Error("Stripe session without redirect URL");
  }
  window.location.href = data.url;
}

/** true si un checkout auto depuis la landing a du sens pour ce palier. */
export function shouldAutoCheckoutPlan(plan: CheckoutPlanKey, tier: BillingTier): boolean {
  if (tier === "trial" || tier === "agency") return true;
  if (tier === "solo" && plan.startsWith("studio")) return true;
  return false;
}
