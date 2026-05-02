import Stripe from "stripe";
import type { BillingTier } from "@/lib/billing/constants";

let stripeSingleton: Stripe | null = null;

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(process.env.STRIPE_SECRET_KEY, {
      typescript: true,
    });
  }
  return stripeSingleton;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export type CheckoutPlanKey =
  | "pro_monthly"
  | "pro_yearly"
  | "enterprise_monthly"
  | "enterprise_yearly";

/** Nom de variable d’environnement pour chaque plan (à documenter / copier dans .env.local). */
export const PLAN_ENV_KEYS: Record<CheckoutPlanKey, string> = {
  pro_monthly: "STRIPE_PRICE_PRO_MONTHLY",
  pro_yearly: "STRIPE_PRICE_PRO_YEARLY",
  enterprise_monthly: "STRIPE_PRICE_ENTERPRISE_MONTHLY",
  enterprise_yearly: "STRIPE_PRICE_ENTERPRISE_YEARLY",
};

export function getStripePriceIdForPlan(plan: CheckoutPlanKey): string | null {
  const envKey = PLAN_ENV_KEYS[plan];
  const v = process.env[envKey];
  return v?.trim() || null;
}

/**
 * Résout le Price ID pour Checkout : soit une variable `price_xxx` directe,
 * soit une lookup key (comme dans le [quickstart Stripe](https://docs.stripe.com/billing/quickstart)).
 */
export type ResolvePriceFailure =
  | { ok: true; priceId: string }
  | { ok: false; reason: "missing_env"; envKey: string }
  | { ok: false; reason: "lookup_not_found"; envKey: string; lookupKey: string };

export async function resolveStripePriceIdForPlanDetailed(
  stripe: Stripe,
  plan: CheckoutPlanKey
): Promise<ResolvePriceFailure> {
  const envKey = PLAN_ENV_KEYS[plan];
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

/** Palier à partir des métadonnées Checkout (`checkoutPlan`), fiable même avec lookup keys. */
export function tierFromCheckoutPlanKey(plan: string | undefined | null): BillingTier | null {
  if (!plan) return null;
  if (plan === "pro_monthly" || plan === "pro_yearly") return "pro";
  if (plan === "enterprise_monthly" || plan === "enterprise_yearly") return "enterprise";
  return null;
}

/** Déduit le palier à partir d’un Price Stripe (abonnement). */
export function tierFromStripePriceId(priceId: string | undefined | null): BillingTier | null {
  if (!priceId) return null;
  const pro = [process.env.STRIPE_PRICE_PRO_MONTHLY, process.env.STRIPE_PRICE_PRO_YEARLY].filter(
    Boolean
  ) as string[];
  const ent = [process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY, process.env.STRIPE_PRICE_ENTERPRISE_YEARLY].filter(
    Boolean
  ) as string[];
  const proIds = pro.filter((p) => p.startsWith("price_"));
  const entIds = ent.filter((p) => p.startsWith("price_"));
  if (proIds.includes(priceId)) return "pro";
  if (entIds.includes(priceId)) return "enterprise";
  return null;
}

const PLAN_TO_TIER: Record<CheckoutPlanKey, BillingTier> = {
  pro_monthly: "pro",
  pro_yearly: "pro",
  enterprise_monthly: "enterprise",
  enterprise_yearly: "enterprise",
};

/** Si les env. contiennent des lookup keys, retrouver le palier via la lookup key du Price. */
export function tierFromEnvLookupKey(lookupKey: string | null | undefined): BillingTier | null {
  if (!lookupKey) return null;
  for (const plan of Object.keys(PLAN_ENV_KEYS) as CheckoutPlanKey[]) {
    const raw = process.env[PLAN_ENV_KEYS[plan]]?.trim();
    if (raw && !raw.startsWith("price_") && raw === lookupKey) {
      return PLAN_TO_TIER[plan];
    }
  }
  return null;
}
