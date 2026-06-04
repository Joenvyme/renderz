import type Stripe from "stripe";
import { STUDIO_MIN_SEATS } from "@/lib/billing/plans";
import {
  checkoutPlanKeys,
  resolveStripePriceIdForPlanDetailed,
} from "@/lib/stripe/server";

const PORTAL_METADATA_KEY = "renderz_managed";
const PORTAL_METADATA_VALUE = "v1";

let cachedConfigurationId: string | null = null;

async function portalProductsFromPrices(
  stripe: Stripe
): Promise<Stripe.BillingPortal.ConfigurationCreateParams.Features.SubscriptionUpdate.Product[]> {
  const byProduct = new Map<string, Set<string>>();

  for (const plan of checkoutPlanKeys()) {
    const resolved = await resolveStripePriceIdForPlanDetailed(stripe, plan);
    if (!resolved.ok) continue;

    const price = await stripe.prices.retrieve(resolved.priceId);
    const productId =
      typeof price.product === "string" ? price.product : price.product?.id;
    if (!productId) continue;

    if (!byProduct.has(productId)) byProduct.set(productId, new Set());
    byProduct.get(productId)!.add(resolved.priceId);
  }

  if (byProduct.size === 0) {
    throw new Error(
      "Aucun prix Stripe résolu pour le portail (vérifiez STRIPE_PRICE_SOLO_* / STRIPE_PRICE_STUDIO_*)."
    );
  }

  return Array.from(byProduct.entries()).map(([product, prices]) => ({
    product,
    prices: Array.from(prices),
  }));
}

async function findManagedPortalConfiguration(
  stripe: Stripe
): Promise<string | null> {
  const configured = process.env.STRIPE_PORTAL_CONFIGURATION_ID?.trim();
  if (configured) return configured;

  let startingAfter: string | undefined;
  do {
    const page = await stripe.billingPortal.configurations.list({
      limit: 20,
      starting_after: startingAfter,
    });
    for (const cfg of page.data) {
      if (cfg.metadata?.[PORTAL_METADATA_KEY] === PORTAL_METADATA_VALUE) {
        return cfg.id;
      }
    }
    startingAfter = page.data.at(-1)?.id;
  } while (startingAfter);

  return null;
}

/**
 * Portail client : mise à jour plan/quantité (Studio), proration, annulation en fin de période.
 */
export async function ensureBillingPortalConfiguration(
  stripe: Stripe
): Promise<string> {
  const fromEnv = process.env.STRIPE_PORTAL_CONFIGURATION_ID?.trim();
  if (fromEnv) return fromEnv;

  if (cachedConfigurationId) return cachedConfigurationId;

  const existing = await findManagedPortalConfiguration(stripe);
  if (existing) {
    cachedConfigurationId = existing;
    return existing;
  }

  const products = await portalProductsFromPrices(stripe);

  const configuration = await stripe.billingPortal.configurations.create({
    metadata: {
      [PORTAL_METADATA_KEY]: PORTAL_METADATA_VALUE,
    },
    business_profile: {
      headline: "Renderz — billing",
    },
    features: {
      customer_update: {
        enabled: true,
        allowed_updates: ["email", "address"],
      },
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: {
        enabled: true,
        mode: "at_period_end",
        cancellation_reason: {
          enabled: true,
          options: ["too_expensive", "missing_features", "switched_service", "other"],
        },
      },
      subscription_update: {
        enabled: true,
        default_allowed_updates: ["price", "quantity"],
        proration_behavior: "create_prorations",
        products,
      },
    },
  });

  cachedConfigurationId = configuration.id;
  return configuration.id;
}

export function studioPortalQuantityConstraints(): {
  minimum: number;
  maximum: number;
} {
  return { minimum: STUDIO_MIN_SEATS, maximum: 99 };
}
