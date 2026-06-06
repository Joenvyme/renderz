"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { BillingPayload } from "@/lib/billing/billing-types";
import type { BillingTier } from "@/lib/billing/constants";
import { TRIAL_CTA_LABEL } from "@/lib/billing/plans";
import { startStripeCheckout } from "@/lib/billing/stripe-checkout-client";
import type { CheckoutPlanKey } from "@/lib/billing/plans";
import { checkoutKeyForPlan } from "@/lib/billing/plans";
import type { PlanId } from "@/lib/billing/plans";
import { PricingAgencyRemark } from "@/components/pricing-agency-remark";
import {
  PricingPlansGrid,
  type PricingInterval,
} from "@/components/pricing-plans-grid";
import { STUDIO_DEFAULT_SEATS } from "@/lib/billing/plans";

export function SubscriptionPlans({
  billing,
  loading,
}: {
  billing: BillingPayload | null;
  loading: boolean;
}) {
  const [interval, setInterval] = useState<PricingInterval>("monthly");
  const [studioSeats, setStudioSeats] = useState(STUDIO_DEFAULT_SEATS);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const startCheckout = async (plan: CheckoutPlanKey, quantity?: number) => {
    setCheckoutLoading(plan);
    try {
      await startStripeCheckout(plan, { quantity });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Checkout error");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Portal failed");
      if (data.url) window.location.href = data.url;
    } catch (e) {
      alert(e instanceof Error ? e.message : "Portal error");
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!billing) {
    return <p className="text-sm font-mono text-muted-foreground">Impossible de charger les offres.</p>;
  }

  if (!billing.stripeConfigured) {
    return (
      <p className="rounded-[2px] border border-amber-200/80 bg-amber-50 px-3 py-2 font-mono text-xs text-amber-800">
        Stripe n’est pas configuré côté serveur — ajoutez STRIPE_SECRET_KEY et les STRIPE_PRICE_SOLO_* /
        STRIPE_PRICE_STUDIO_* pour activer les paiements.
      </p>
    );
  }

  if (billing.unlimited) {
    return (
      <p className="text-sm font-mono text-muted-foreground">
        Compte interne : aucune limite de quota, pas d’abonnement à souscrire.
      </p>
    );
  }

  const tier = billing.tier as BillingTier;
  const activePlanId: PlanId | null =
    tier === "solo" ? "solo" : tier === "studio" ? "studio" : null;

  const soloPlanKey = checkoutKeyForPlan("solo", interval);
  const studioPlanKey = checkoutKeyForPlan("studio", interval);

  const soloFooter =
    tier === "solo" ? (
      <Button
        className="h-11 w-full rounded-[2px] font-mono text-xs tracking-wider"
        disabled={portalLoading}
        onClick={openPortal}
      >
        {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gérer facturation & abonnement"}
      </Button>
    ) : soloPlanKey ? (
      <Button
        className="h-11 w-full rounded-[4px] bg-black font-mono text-xs tracking-wider text-white hover:bg-black/90"
        disabled={!!checkoutLoading}
        onClick={() => startCheckout(soloPlanKey)}
      >
        {checkoutLoading === soloPlanKey ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          TRIAL_CTA_LABEL
        )}
      </Button>
    ) : (
      <div className="w-full rounded-[2px] border border-border py-3 text-center font-mono text-xs text-muted-foreground">
        {tier === "studio" ? "Vous êtes sur Studio" : "—"}
      </div>
    );

  const studioFooter =
    tier === "studio" ? (
      <Button
        variant="outline"
        className="h-11 w-full rounded-[2px] border-2 border-black font-mono text-xs tracking-wider"
        disabled={portalLoading}
        onClick={openPortal}
      >
        {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gérer facturation & abonnement"}
      </Button>
    ) : studioPlanKey ? (
      <Button
        variant="outline"
        className="h-11 w-full rounded-[2px] border-2 border-black font-mono text-xs tracking-wider hover:bg-black hover:text-white"
        disabled={!!checkoutLoading}
        onClick={() => startCheckout(studioPlanKey, studioSeats)}
      >
        {checkoutLoading === studioPlanKey ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Start 7-day trial"
        )}
      </Button>
    ) : (
      <div className="w-full rounded-[2px] border border-border py-3 text-center font-mono text-xs text-muted-foreground">
        {tier === "solo" ? "Vous êtes sur Solo" : "—"}
      </div>
    );

  return (
    <div className="w-full">
      {tier === "trial" && (
        <p className="mb-4 rounded-[4px] border border-border/80 bg-muted/30 px-3 py-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
          Compte essai gratuit (~50 rendus watermark). Choisissez Solo ou Studio pour l’essai
          abonnement 7 jours.
        </p>
      )}
      <PricingPlansGrid
        interval={interval}
        onIntervalChange={setInterval}
        activePlanId={activePlanId}
        studioSeats={studioSeats}
        onStudioSeatsChange={setStudioSeats}
        soloFooter={soloFooter}
        studioFooter={studioFooter}
        agencyRemark={<PricingAgencyRemark />}
      />
      <p className="mt-4 text-center font-mono text-[10px] text-muted-foreground">
        Essai 7 jours · watermark pendant l’essai · annulez avant le jour 7
      </p>
    </div>
  );
}
