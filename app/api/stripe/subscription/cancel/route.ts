import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { getOrCreateBillingAccountForUser } from "@/lib/billing/service";
import { getStripe, isStripeConfigured } from "@/lib/stripe/server";
import { jsonFromStripeCaughtError } from "@/lib/stripe/http-errors";

/**
 * Désactive le renouvellement automatique : l’abonnement reste actif jusqu’à current_period_end (Stripe).
 */
export const dynamic = "force-dynamic";

export async function POST() {
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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const account = await getOrCreateBillingAccountForUser(supabase, session.user.id);

    if (!account.stripe_subscription_id) {
      return NextResponse.json({ error: "Aucun abonnement Stripe actif." }, { status: 400 });
    }

    const stripe = getStripe();
    const sub = await stripe.subscriptions.retrieve(account.stripe_subscription_id);

    if (["canceled", "unpaid", "incomplete_expired"].includes(sub.status)) {
      return NextResponse.json({ error: "Cet abonnement n’est plus actif." }, { status: 400 });
    }

    if (sub.cancel_at_period_end) {
      return NextResponse.json({ error: "La résiliation à la fin de période est déjà programmée." }, { status: 400 });
    }

    await stripe.subscriptions.update(account.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    return NextResponse.json({
      ok: true,
      currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: true,
    });
  } catch (e) {
    console.error("POST /api/stripe/subscription/cancel:", e);
    const mapped = jsonFromStripeCaughtError(e);
    if (mapped) return mapped;
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
