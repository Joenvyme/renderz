import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getStripe, isStripeConfigured } from "@/lib/stripe/server";

/**
 * Vérifie une Checkout Session après redirection (recommandé dans le
 * [quickstart Stripe Billing](https://docs.stripe.com/billing/quickstart)).
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: "Stripe non configuré" }, { status: 503 });
    }

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const sessionId = request.nextUrl.searchParams.get("session_id");
    if (!sessionId || !sessionId.startsWith("cs_")) {
      return NextResponse.json({ error: "session_id manquant ou invalide" }, { status: 400 });
    }

    const stripe = getStripe();
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "customer"],
    });

    if (checkoutSession.metadata?.userId !== session.user.id) {
      return NextResponse.json({ error: "Cette session ne correspond pas à votre compte." }, { status: 403 });
    }

    return NextResponse.json({
      id: checkoutSession.id,
      payment_status: checkoutSession.payment_status,
      status: checkoutSession.status,
      customer:
        typeof checkoutSession.customer === "string"
          ? checkoutSession.customer
          : checkoutSession.customer?.id ?? null,
      subscription:
        typeof checkoutSession.subscription === "string"
          ? checkoutSession.subscription
          : checkoutSession.subscription?.id ?? null,
      checkoutPlan: checkoutSession.metadata?.checkoutPlan ?? null,
    });
  } catch (e) {
    console.error("GET /api/stripe/session:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
