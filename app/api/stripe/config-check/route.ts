import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { checkoutPlanKeys } from "@/lib/billing/plans";
import {
  getStripeSecretKey,
  getStripePriceIdForPlan,
  PLAN_ENV_KEYS,
  resolveStripePriceIdForPlanDetailed,
  validateStripeSecretKey,
  type CheckoutPlanKey,
} from "@/lib/stripe/server";
import { getStripe } from "@/lib/stripe/server";
import { jsonFromStripeCaughtError } from "@/lib/stripe/http-errors";

export const dynamic = "force-dynamic";

function keyHint(key: string): string {
  if (key.length < 12) return "(trop court)";
  return `${key.slice(0, 12)}…${key.slice(-4)} (len=${key.length})`;
}

const PLANS: CheckoutPlanKey[] = checkoutPlanKeys();

/**
 * Diagnostic Stripe (session requise) — n’expose jamais la clé complète.
 */
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const raw = process.env.STRIPE_SECRET_KEY;
    const normalized = getStripeSecretKey();
    const validation = validateStripeSecretKey(raw);

    const prices: Record<
      string,
      { envKey: string; rawSet: boolean; rawPrefix: string | null; resolveOk: boolean; detail?: string }
    > = {};

    for (const plan of PLANS) {
      const envKey = PLAN_ENV_KEYS[plan];
      const rawPrice = getStripePriceIdForPlan(plan);
      prices[plan] = {
        envKey,
        rawSet: Boolean(rawPrice),
        rawPrefix: rawPrice ? rawPrice.slice(0, 12) + (rawPrice.length > 12 ? "…" : "") : null,
        resolveOk: false,
      };
    }

    if (!validation.ok) {
      return NextResponse.json({
        ok: false,
        step: "local_validation",
        validation: { ok: false, code: validation.code, error: validation.error },
        keyHint: normalized ? keyHint(normalized) : null,
        prices,
        hint:
          "Corrigez STRIPE_SECRET_KEY dans Vercel (scope Production), redéployez, puis réessayez.",
      });
    }

    let stripeAuth: { ok: true; livemode?: boolean } | { ok: false; code?: string; error: string } = {
      ok: false,
      error: "Non testé",
    };

    try {
      const stripe = getStripe();
      const bal = await stripe.balance.retrieve();
      stripeAuth = { ok: true, livemode: bal.livemode };
    } catch (e) {
      const mapped = jsonFromStripeCaughtError(e);
      if (mapped) {
        const body = (await mapped.json()) as { code?: string; error?: string };
        stripeAuth = { ok: false, code: body.code, error: body.error ?? "Erreur Stripe" };
      } else {
        stripeAuth = {
          ok: false,
          error: e instanceof Error ? e.message : "Erreur inconnue",
        };
      }
    }

    if (stripeAuth.ok) {
      const stripe = getStripe();
      for (const plan of PLANS) {
        const resolved = await resolveStripePriceIdForPlanDetailed(stripe, plan);
        const entry = prices[plan]!;
        if (resolved.ok) {
          entry.resolveOk = true;
          try {
            const price = await stripe.prices.retrieve(resolved.priceId);
            entry.detail = `${price.id} · livemode=${price.livemode}`;
          } catch {
            entry.detail = resolved.priceId;
          }
        } else {
          entry.resolveOk = false;
          entry.detail =
            resolved.reason === "missing_env"
              ? `Variable ${resolved.envKey} manquante`
              : `Lookup « ${resolved.lookupKey} » introuvable (mode Test/Live ?)`;
        }
      }
    }

    return NextResponse.json({
      ok: stripeAuth.ok && Object.values(prices).every((p) => p.resolveOk),
      step: stripeAuth.ok ? "complete" : "stripe_api",
      validation: { ok: true, mode: validation.ok ? validation.mode : undefined },
      keyHint: validation.ok ? keyHint(validation.key) : null,
      stripeAuth,
      prices,
    });
  } catch (e) {
    console.error("GET /api/stripe/config-check:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
