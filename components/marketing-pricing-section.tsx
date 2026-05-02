"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PricingPlansGrid, type PricingInterval } from "@/components/pricing-plans-grid";

type MarketingPricingSectionProps = {
  onGetStarted: () => void;
  onContact: () => void;
  className?: string;
};

/**
 * Grille tarifaire marketing (page d’accueil) — même grille que Paramètres / abonnement.
 */
export function MarketingPricingSection({ onGetStarted, onContact, className }: MarketingPricingSectionProps) {
  const [interval, setInterval] = useState<PricingInterval>("monthly");

  return (
    <PricingPlansGrid
      className={cn(className)}
      interval={interval}
      onIntervalChange={setInterval}
      subscriberTier={null}
      freeFooter={
        <Button
          type="button"
          variant="outline"
          onClick={onGetStarted}
          className="w-full rounded-[2px] border-2 border-black font-mono text-xs tracking-wider hover:bg-black hover:text-white"
        >
          COMMENCER
        </Button>
      }
      proFooter={
        <Button
          type="button"
          onClick={onGetStarted}
          className="w-full rounded-[4px] bg-black font-mono text-xs tracking-wider text-white hover:bg-black/85"
        >
          CHOISIR PRO
        </Button>
      }
      enterpriseFooter={
        <Button
          type="button"
          variant="outline"
          onClick={onContact}
          className="w-full rounded-[2px] border-2 border-black font-mono text-xs tracking-wider hover:bg-black hover:text-white"
        >
          NOUS CONTACTER
        </Button>
      }
    />
  );
}
