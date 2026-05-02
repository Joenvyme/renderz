"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import type { BillingPayload } from "@/lib/billing/billing-types";
import { PricingPlansGrid, type PricingInterval } from "@/components/pricing-plans-grid";

export function SubscriptionPlans({
  billing,
  loading,
}: {
  billing: BillingPayload | null;
  loading: boolean;
}) {
  const [interval, setInterval] = useState<PricingInterval>("monthly");
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const startCheckout = async (plan: string) => {
    setCheckoutLoading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      if (data.url) window.location.href = data.url;
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
        Stripe n’est pas configuré côté serveur — ajoutez STRIPE_SECRET_KEY et les STRIPE_PRICE_* pour activer les
        paiements.
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

  const tier = billing.tier as "free" | "pro" | "enterprise";
  const proPlanKey = interval === "monthly" ? "pro_monthly" : "pro_yearly";
  const entPlanKey = interval === "monthly" ? "enterprise_monthly" : "enterprise_yearly";

  const freeFooter =
    tier === "free" ? (
      <div className="w-full rounded-[2px] border-2 border-black/20 py-3 text-center font-mono text-xs tracking-wider text-muted-foreground">
        Votre plan actuel
      </div>
    ) : (
      <div className="w-full rounded-[2px] border border-border py-3 text-center font-mono text-xs text-muted-foreground">
        Inclus dans les offres payantes
      </div>
    );

  const proFooter =
    tier === "pro" ? (
      <Button
        className="h-11 w-full rounded-[2px] font-mono text-xs tracking-wider"
        disabled={portalLoading}
        onClick={openPortal}
      >
        {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gérer facturation & abonnement"}
      </Button>
    ) : tier === "free" ? (
      <Button
        className="h-11 w-full rounded-[4px] bg-black font-mono text-xs tracking-wider text-white hover:bg-black/90"
        disabled={!!checkoutLoading}
        onClick={() => startCheckout(proPlanKey)}
      >
        {checkoutLoading === proPlanKey ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Passer à Pro
          </>
        )}
      </Button>
    ) : (
      <div className="w-full rounded-[2px] border border-border py-3 text-center font-mono text-xs text-muted-foreground">
        Vous êtes sur Enterprise
      </div>
    );

  const enterpriseFooter =
    tier === "enterprise" ? (
      <Button
        variant="outline"
        className="h-11 w-full rounded-[2px] border-2 border-black font-mono text-xs tracking-wider"
        disabled={portalLoading}
        onClick={openPortal}
      >
        {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gérer facturation & abonnement"}
      </Button>
    ) : (
      <Button
        variant="outline"
        className="h-11 w-full rounded-[2px] border-2 border-black font-mono text-xs tracking-wider hover:bg-black hover:text-white"
        disabled={!!checkoutLoading}
        onClick={() => startCheckout(entPlanKey)}
      >
        {checkoutLoading === entPlanKey ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Passer à Enterprise"
        )}
      </Button>
    );

  return (
    <div className="w-full">
      <PricingPlansGrid
        interval={interval}
        onIntervalChange={setInterval}
        subscriberTier={tier}
        freeFooter={freeFooter}
        proFooter={proFooter}
        enterpriseFooter={enterpriseFooter}
      />
      {(tier === "pro" || tier === "enterprise") && (
        <p className="mt-6 text-center font-mono text-[10px] text-muted-foreground">
          Paiement sécurisé par Stripe — après un achat, redirection vers la page des paramètres pour finaliser.
        </p>
      )}
    </div>
  );
}
