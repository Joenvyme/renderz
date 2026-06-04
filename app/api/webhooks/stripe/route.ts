import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { STUDIO_MIN_SEATS } from "@/lib/billing/plans";
import {
  getStripe,
  tierFromCheckoutPlanKey,
  tierFromEnvLookupKey,
  tierFromStripePriceId,
} from "@/lib/stripe/server";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET manquant");
    return NextResponse.json({ error: "Configuration webhook manquante" }, { status: 500 });
  }

  const rawBody = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Signature absente" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    console.error("Webhook Stripe signature:", err);
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const stripe = getStripe();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const billingAccountId =
          session.metadata?.billingAccountId || session.client_reference_id || undefined;
        if (!billingAccountId) {
          console.error("checkout.session.completed sans billingAccountId");
          break;
        }

        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id;

        if (!subscriptionId || !customerId) {
          console.error("checkout.session.completed sans subscription/customer");
          break;
        }

        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = sub.items.data[0]?.price?.id;
        const tier =
          tierFromCheckoutPlanKey(session.metadata?.checkoutPlan) ??
          tierFromStripePriceId(priceId);
        if (!tier) {
          console.error(
            "checkout.session.completed : palier inconnu (metadata checkoutPlan + price)",
            session.metadata?.checkoutPlan,
            priceId
          );
          break;
        }

        await supabase
          .from("billing_account")
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            stripe_subscription_status: sub.status,
            tier,
            updated_at: new Date().toISOString(),
          })
          .eq("id", billingAccountId);

        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;

        const { data: row } = await supabase
          .from("billing_account")
          .select("id")
          .eq("stripe_subscription_id", sub.id)
          .maybeSingle();

        if (!row?.id) {
          console.warn("subscription.updated : billing_account introuvable pour", sub.id);
          break;
        }

        const item = sub.items.data[0];
        const priceId = item?.price?.id;
        let resolvedTier =
          tierFromCheckoutPlanKey(
            typeof sub.metadata?.checkoutPlan === "string" ? sub.metadata.checkoutPlan : null
          ) ?? tierFromStripePriceId(priceId);

        if (!resolvedTier && priceId) {
          const price = await stripe.prices.retrieve(priceId);
          resolvedTier = tierFromEnvLookupKey(price.lookup_key ?? undefined);
        }

        if (resolvedTier === "studio" && item?.id) {
          const qty = item.quantity ?? 0;
          if (qty < STUDIO_MIN_SEATS) {
            await stripe.subscriptions.update(sub.id, {
              items: [{ id: item.id, quantity: STUDIO_MIN_SEATS }],
              proration_behavior: "create_prorations",
            });
          }
        }

        const terminal = ["canceled", "unpaid", "incomplete_expired"].includes(sub.status);
        const patch: Record<string, unknown> = {
          stripe_subscription_status: sub.status,
          updated_at: new Date().toISOString(),
        };
        if (terminal) {
          patch.tier = "trial";
          patch.stripe_subscription_id = null;
        } else if (resolvedTier) {
          patch.tier = resolvedTier;
        }

        await supabase.from("billing_account").update(patch).eq("id", row.id);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;

        await supabase
          .from("billing_account")
          .update({
            tier: "trial",
            stripe_subscription_id: null,
            stripe_subscription_status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", sub.id);

        break;
      }

      default:
        break;
    }
  } catch (e) {
    console.error("Webhook handler error:", e);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
