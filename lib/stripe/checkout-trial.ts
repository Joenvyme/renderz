import type Stripe from "stripe";
import { TRIAL_DAYS } from "@/lib/billing/plans";
import type { BillingAccountRow } from "@/lib/billing/service";
import { isPaidTier } from "@/lib/billing/constants";

/**
 * Essai Stripe 7 jours uniquement pour les comptes tier `trial` sans abonnement actif.
 * Les upgrades (solo → studio) ou réabonnements n’obtiennent pas un second essai.
 */
export function shouldApplyStripeSubscriptionTrial(account: BillingAccountRow): boolean {
  if (isPaidTier(account.tier)) return false;
  if (account.stripe_subscription_id) return false;
  const status = account.stripe_subscription_status?.toLowerCase();
  if (status && ["active", "trialing", "past_due"].includes(status)) return false;
  return account.tier === "trial";
}

export function buildCheckoutSubscriptionData(
  account: BillingAccountRow,
  metadata: Record<string, string>
): Stripe.Checkout.SessionCreateParams.SubscriptionData {
  const base: Stripe.Checkout.SessionCreateParams.SubscriptionData = { metadata };

  if (!shouldApplyStripeSubscriptionTrial(account)) {
    return base;
  }

  return {
    ...base,
    trial_period_days: TRIAL_DAYS,
    trial_settings: {
      end_behavior: {
        missing_payment_method: "cancel",
      },
    },
  };
}

export function checkoutPaymentMethodCollection(
  account: BillingAccountRow,
  applyTrial: boolean
): Stripe.Checkout.SessionCreateParams.PaymentMethodCollection {
  if (applyTrial) return "if_required";
  if (account.stripe_customer_id) return "if_required";
  return "always";
}
