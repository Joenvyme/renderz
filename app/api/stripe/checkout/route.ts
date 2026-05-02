import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { getOrCreateBillingAccountForUser } from "@/lib/billing/service";
import {
  getStripe,
  isStripeConfigured,
  resolveStripePriceIdForPlanDetailed,
  type CheckoutPlanKey,
} from "@/lib/stripe/server";
import { jsonFromStripeCaughtError } from "@/lib/stripe/http-errors";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000";

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe n’est pas configuré (STRIPE_SECRET_KEY)." },
        { status: 503 }
      );
    }

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = (await request.json()) as { plan?: CheckoutPlanKey };
    const plan = body.plan;
    const allowed: CheckoutPlanKey[] = [
      "pro_monthly",
      "pro_yearly",
      "enterprise_monthly",
      "enterprise_yearly",
    ];
    if (!plan || !allowed.includes(plan)) {
      return NextResponse.json({ error: "plan invalide" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const billingAccount = await getOrCreateBillingAccountForUser(supabase, session.user.id);

    const stripe = getStripe();
    const resolved = await resolveStripePriceIdForPlanDetailed(stripe, plan);
    if (!resolved.ok) {
      if (resolved.reason === "missing_env") {
        return NextResponse.json(
          {
            error: `Ajoutez ${resolved.envKey}=price_… dans .env.local (copiez l’ID du prix dans Stripe → Produits → [votre offre] → Tarifs, mode Test ou Live selon votre STRIPE_SECRET_KEY). Voir stripe.env.example à la racine du repo.`,
            code: "MISSING_STRIPE_PRICE_ENV",
            envKey: resolved.envKey,
          },
          { status: 503 }
        );
      }
      return NextResponse.json(
        {
          error: `La valeur de ${resolved.envKey} (« ${resolved.lookupKey} ») ne correspond à aucun prix actif dans Stripe. Vérifiez la lookup key sur le Price, ou mettez directement un ID commençant par price_. Même mode Test/Live que la clé secrète.`,
          code: "STRIPE_LOOKUP_NOT_FOUND",
          envKey: resolved.envKey,
        },
        { status: 503 }
      );
    }
    const priceId = resolved.priceId;

    const customerId = billingAccount.stripe_customer_id || undefined;

    // Aligné sur https://docs.stripe.com/billing/quickstart — session_id pour vérifier côté serveur après redirection.
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      billing_address_collection: "auto",
      success_url: `${APP_URL.replace(/\/$/, "")}/settings?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL.replace(/\/$/, "")}/settings?checkout=canceled`,
      client_reference_id: billingAccount.id,
      metadata: {
        userId: session.user.id,
        billingAccountId: billingAccount.id,
        checkoutPlan: plan,
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
          billingAccountId: billingAccount.id,
          checkoutPlan: plan,
        },
      },
      ...(customerId
        ? { customer: customerId }
        : { customer_email: session.user.email || undefined }),
    });

    if (!checkoutSession.url) {
      return NextResponse.json({ error: "Session Stripe sans URL" }, { status: 500 });
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (e) {
    console.error("stripe checkout:", e);
    const mapped = jsonFromStripeCaughtError(e);
    if (mapped) return mapped;
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
