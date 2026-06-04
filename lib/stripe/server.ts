import Stripe from "stripe";
import type { BillingTier } from "@/lib/billing/constants";
import {
  checkoutPlanKeys,
  isCheckoutPlanKey,
  stripeEnvKeyForCheckout,
  tierFromCheckoutPlanKey as tierFromPlanKey,
  type CheckoutPlanKey,
} from "@/lib/billing/plans";
import {
  normalizeStripeSecretKey,
  validateStripeSecretKey,
  type StripeKeyValidation,
} from "@/lib/stripe/validate-key";

export type { CheckoutPlanKey } from "@/lib/billing/plans";
export { checkoutPlanKeys, isCheckoutPlanKey };

let stripeSingleton: Stripe | null = null;
let stripeSingletonKey: string | null = null;

export { validateStripeSecretKey, type StripeKeyValidation };

export function getStripeSecretKey(): string | null {
  return normalizeStripeSecretKey(process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe {
  const validated = validateStripeSecretKey(process.env.STRIPE_SECRET_KEY);
  if (!validated.ok) {
    throw new Error(validated.error);
  }
  if (!stripeSingleton || stripeSingletonKey !== validated.key) {
    stripeSingleton = new Stripe(validated.key, { typescript: true });
    stripeSingletonKey = validated.key;
  }
  return stripeSingleton;
}

export function isStripeConfigured(): boolean {
  const key = getStripeSecretKey();
  if (!key) return false;
  return validateStripeSecretKey(key).ok;
}

/** Nom de variable d’environnement pour chaque plan (serveur uniquement). */
export const PLAN_ENV_KEYS: Record<CheckoutPlanKey, string> = {
  solo_monthly: "STRIPE_PRICE_SOLO_MONTHLY",
  solo_yearly: "STRIPE_PRICE_SOLO_YEARLY",
  studio_monthly: "STRIPE_PRICE_STUDIO_MONTHLY",
  studio_yearly: "STRIPE_PRICE_STUDIO_YEARLY",
};

export function getStripePriceIdForPlan(plan: CheckoutPlanKey): string | null {
  const envKey = stripeEnvKeyForCheckout(plan);
  const v = process.env[envKey];
  return v?.trim() || null;
}

export type ResolvePriceFailure =
  | { ok: true; priceId: string }
  | { ok: false; reason: "missing_env"; envKey: string }
  | { ok: false; reason: "lookup_not_found"; envKey: string; lookupKey: string };

export async function resolveStripePriceIdForPlanDetailed(
  stripe: Stripe,
  plan: CheckoutPlanKey
): Promise<ResolvePriceFailure> {
  const envKey = stripeEnvKeyForCheckout(plan);
  const raw = getStripePriceIdForPlan(plan);
  if (!raw) {
    return { ok: false, reason: "missing_env", envKey };
  }
  if (raw.startsWith("price_")) {
    return { ok: true, priceId: raw };
  }

  const prices = await stripe.prices.list({
    lookup_keys: [raw],
    active: true,
    limit: 1,
  });
  const id = prices.data[0]?.id;
  if (!id) {
    return { ok: false, reason: "lookup_not_found", envKey, lookupKey: raw };
  }
  return { ok: true, priceId: id };
}

export async function resolveStripePriceIdForPlan(
  stripe: Stripe,
  plan: CheckoutPlanKey
): Promise<string | null> {
  const r = await resolveStripePriceIdForPlanDetailed(stripe, plan);
  return r.ok ? r.priceId : null;
}

export function tierFromCheckoutPlanKey(plan: string | undefined | null): BillingTier | null {
  if (!isCheckoutPlanKey(plan)) return null;
  return tierFromPlanKey(plan);
}

export function tierFromStripePriceId(priceId: string | undefined | null): BillingTier | null {
  if (!priceId) return null;
  for (const plan of checkoutPlanKeys()) {
    const raw = process.env[stripeEnvKeyForCheckout(plan)]?.trim();
    if (raw?.startsWith("price_") && raw === priceId) {
      return tierFromPlanKey(plan);
    }
  }
  return null;
}

const PLAN_TO_TIER: Record<CheckoutPlanKey, BillingTier> = {
  solo_monthly: "solo",
  solo_yearly: "solo",
  studio_monthly: "studio",
  studio_yearly: "studio",
};

export function tierFromEnvLookupKey(lookupKey: string | null | undefined): BillingTier | null {
  if (!lookupKey) return null;
  for (const plan of checkoutPlanKeys()) {
    const raw = process.env[stripeEnvKeyForCheckout(plan)]?.trim();
    if (raw && !raw.startsWith("price_") && raw === lookupKey) {
      return PLAN_TO_TIER[plan];
    }
  }
  return null;
}

export function isStudioCheckoutPlan(plan: CheckoutPlanKey): boolean {
  return plan.startsWith("studio_");
}
