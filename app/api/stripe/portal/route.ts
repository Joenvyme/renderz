import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { getOrCreateBillingAccountForUser } from "@/lib/billing/service";
import { getStripe, isStripeConfigured } from "@/lib/stripe/server";
import { jsonFromStripeCaughtError } from "@/lib/stripe/http-errors";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000";

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

    const billingAccount = await getOrCreateBillingAccountForUser(supabase, session.user.id);

    if (!billingAccount.stripe_customer_id) {
      return NextResponse.json(
        { error: "Aucun client Stripe : souscrivez d’abord à un abonnement." },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const portal = await stripe.billingPortal.sessions.create({
      customer: billingAccount.stripe_customer_id,
      return_url: `${APP_URL.replace(/\/$/, "")}/settings`,
    });

    return NextResponse.json({ url: portal.url });
  } catch (e) {
    console.error("stripe portal:", e);
    const mapped = jsonFromStripeCaughtError(e);
    if (mapped) return mapped;
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
