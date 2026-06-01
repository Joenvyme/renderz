"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PricingPlansGrid, type PricingInterval } from "@/components/pricing-plans-grid";

type MarketingPricingSectionProps = {
  onGetStarted: () => void;
  onChoosePro: (interval: PricingInterval) => void;
  onChooseEnterprise: (interval: PricingInterval) => void;
  onContact: () => void;
  className?: string;
};

/**
 * Grille tarifaire marketing (page d’accueil) — même grille que Paramètres / abonnement.
 */
export function MarketingPricingSection({
  onGetStarted,
  onChoosePro,
  onChooseEnterprise,
  onContact,
  className,
}: MarketingPricingSectionProps) {
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
          className="min-h-11 w-full touch-manipulation rounded-[2px] border-2 border-black font-mono text-xs tracking-wider hover:bg-black hover:text-white"
        >
          START FREE — NO CARD
        </Button>
      }
      proFooter={
        <Button
          type="button"
          onClick={() => onChoosePro(interval)}
          className="min-h-11 w-full touch-manipulation rounded-[4px] bg-black font-mono text-xs tracking-wider text-white hover:bg-black/85"
        >
          CHOOSE PRO
        </Button>
      }
      enterpriseFooter={
        <Button
          type="button"
          variant="outline"
          onClick={() => onChooseEnterprise(interval)}
          className="min-h-11 w-full touch-manipulation rounded-[2px] border-2 border-black font-mono text-xs tracking-wider hover:bg-black hover:text-white"
        >
          CHOOSE ENTERPRISE
        </Button>
      }
    />
  );
}
