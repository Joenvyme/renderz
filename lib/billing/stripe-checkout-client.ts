import type { CheckoutPlanKey } from "@/lib/stripe/server";

export async function startStripeCheckout(plan: CheckoutPlanKey): Promise<void> {
  const res = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan }),
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
export function shouldAutoCheckoutPlan(
  plan: CheckoutPlanKey,
  tier: "free" | "pro" | "enterprise"
): boolean {
  if (tier === "free") return true;
  if (tier === "pro" && plan.startsWith("enterprise")) return true;
  return false;
}
