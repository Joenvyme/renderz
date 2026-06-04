import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import {
  currentUtcPeriodKey,
  TRIAL_GENERATIONS_TOTAL,
  TRIAL_UPSCALES_TOTAL,
  TIER_LIMITS,
  isBillingUnlimitedEmail,
  type BillingTier,
} from "@/lib/billing/constants";
import { getMonthlyUsage, getOrCreateBillingAccountForUser } from "@/lib/billing/service";
import { getStripe, isStripeConfigured } from "@/lib/stripe/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const account = await getOrCreateBillingAccountForUser(supabase, session.user.id);
    const periodKey = currentUtcPeriodKey();
    const usage = await getMonthlyUsage(supabase, account.id, periodKey);
    const unlimited = isBillingUnlimitedEmail(session.user.email);

    const tier = account.tier as BillingTier;
    const limits =
      tier === "trial" || tier === "agency"
        ? null
        : TIER_LIMITS[tier as "solo" | "studio"];

    let subscription: { currentPeriodEnd: string; cancelAtPeriodEnd: boolean } | null = null;
    if (isStripeConfigured() && account.stripe_subscription_id) {
      try {
        const stripe = getStripe();
        const sub = await stripe.subscriptions.retrieve(account.stripe_subscription_id);
        const terminal = ["canceled", "unpaid", "incomplete_expired"].includes(sub.status);
        if (!terminal) {
          subscription = {
            currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          };
        }
      } catch (e) {
        console.warn("GET /api/user/billing: subscription retrieve", e);
      }
    }

    return NextResponse.json({
      billingAccountId: account.id,
      tier: account.tier,
      stripeConfigured: isStripeConfigured(),
      subscriptionStatus: account.stripe_subscription_status,
      subscription,
      unlimited,
      period: { key: periodKey, timezone: "UTC" },
      usage: {
        renders: usage.renders_used,
        animations: usage.animations_used,
        upscales: usage.upscales_used,
      },
      limits,
      trial: {
        generationsUsed: usage.renders_used + usage.animations_used,
        generationsMax: TRIAL_GENERATIONS_TOTAL,
        periodKey,
        upscalesUsed: usage.upscales_used,
        upscalesMax: TRIAL_UPSCALES_TOTAL,
      },
    });
  } catch (e) {
    console.error("GET /api/user/billing:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
