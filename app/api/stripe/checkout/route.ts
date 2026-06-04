import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { getOrCreateBillingAccountForUser } from "@/lib/billing/service";
import {
  isCheckoutPlanKey,
  studioCheckoutQuantity,
  STUDIO_MIN_SEATS,
} from "@/lib/billing/plans";
import {
  buildCheckoutSubscriptionData,
  checkoutPaymentMethodCollection,
  shouldApplyStripeSubscriptionTrial,
} from "@/lib/stripe/checkout-trial";
import {
  getStripe,
  isStripeConfigured,
  isStudioCheckoutPlan,
  resolveStripePriceIdForPlanDetailed,
  validateStripeSecretKey,
  type CheckoutPlanKey,
} from "@/lib/stripe/server";
import { stripeKeyValidationErrorResponse } from "@/lib/stripe/validate-key";
import { jsonFromStripeCaughtError } from "@/lib/stripe/http-errors";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe n’est pas configuré (STRIPE_SECRET_KEY)." },
        { status: 503 }
      );
    }

    const keyCheck = validateStripeSecretKey(process.env.STRIPE_SECRET_KEY);
    if (!keyCheck.ok) {
      return NextResponse.json(stripeKeyValidationErrorResponse(keyCheck), { status: 503 });
    }

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = (await request.json()) as { plan?: CheckoutPlanKey; quantity?: number };
    const plan = body.plan;
    if (!isCheckoutPlanKey(plan)) {
      return NextResponse.json({ error: "plan invalide" }, { status: 400 });
    }

    const isStudio = isStudioCheckoutPlan(plan);
    const quantity = isStudio
      ? studioCheckoutQuantity(typeof body.quantity === "number" ? body.quantity : STUDIO_MIN_SEATS)
      : 1;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const billingAccount = await getOrCreateBillingAccountForUser(supabase, session.user.id);
    const applyTrial = shouldApplyStripeSubscriptionTrial(billingAccount);

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

    const subscriptionMetadata: Record<string, string> = {
      userId: session.user.id,
      billingAccountId: billingAccount.id,
      checkoutPlan: plan,
    };

    const lineItem: {
      price: string;
      quantity: number;
      adjustable_quantity?: { enabled: boolean; minimum: number; maximum?: number };
    } = {
      price: priceId,
      quantity,
    };

    if (isStudio) {
      lineItem.adjustable_quantity = {
        enabled: true,
        minimum: STUDIO_MIN_SEATS,
        maximum: 99,
      };
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [lineItem],
      payment_method_collection: checkoutPaymentMethodCollection(billingAccount, applyTrial),
      billing_address_collection: "auto",
      success_url: `${APP_URL.replace(/\/$/, "")}/settings?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL.replace(/\/$/, "")}/settings?checkout=canceled`,
      client_reference_id: billingAccount.id,
      metadata: {
        ...subscriptionMetadata,
        ...(isStudio ? { seatQuantity: String(quantity) } : {}),
        stripeTrialApplied: applyTrial ? "true" : "false",
      },
      subscription_data: buildCheckoutSubscriptionData(billingAccount, subscriptionMetadata),
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
