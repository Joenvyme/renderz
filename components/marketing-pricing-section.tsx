"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PricingAgencyRemark } from "@/components/pricing-agency-remark";
import { PricingTrialPromoBanner } from "@/components/pricing-trial-promo-banner";
import {
  PricingPlansGrid,
  type PricingInterval,
} from "@/components/pricing-plans-grid";

type MarketingPricingSectionProps = {
  onChooseSolo: (interval: PricingInterval) => void;
  onChooseStudio: (interval: PricingInterval, seats: number) => void;
  onContactAgency?: () => void;
  className?: string;
  theme?: "light" | "dark";
};

function TrialFinePrint({ dark, onHighlightedCard }: { dark?: boolean; onHighlightedCard?: boolean }) {
  return (
    <p
      className={cn(
        "mt-2 text-center font-mono text-[10px] leading-snug tracking-wide",
        onHighlightedCard ? "text-black/55" : dark ? "text-white/55" : "text-muted-foreground"
      )}
    >
      Trial: watermarked · personal use only · card on file · CHF 0 today
    </p>
  );
}

function PlanTrialButton({
  onClick,
  dark,
  highlighted,
}: {
  onClick: () => void;
  dark?: boolean;
  highlighted?: boolean;
}) {
  return (
    <div className="w-full">
      <Button
        type="button"
        onClick={onClick}
        className={cn(
          "min-h-11 w-full touch-manipulation rounded-[4px] font-mono text-[11px] uppercase tracking-[0.1em]",
          highlighted
            ? "bg-black text-white hover:bg-black/90"
            : dark
              ? "border-2 border-white/40 bg-transparent text-white hover:bg-white/12 hover:text-white"
              : "rounded-[2px] border-2 border-black bg-transparent text-black hover:bg-black/8 hover:text-black"
        )}
      >
        {dark ? "Start 7-day trial" : "START 7-DAY TRIAL"}
      </Button>
      <TrialFinePrint dark={dark} onHighlightedCard={highlighted} />
    </div>
  );
}

export function MarketingPricingSection({
  onChooseSolo,
  onChooseStudio,
  onContactAgency,
  className,
  theme = "light",
}: MarketingPricingSectionProps) {
  const [interval, setInterval] = useState<PricingInterval>("monthly");
  const [studioSeats, setStudioSeats] = useState(3);
  const isDark = theme === "dark";

  const trialPromoBanner = (
    <PricingTrialPromoBanner
      dark={isDark}
      onStartSoloTrial={() => onChooseSolo("monthly")}
      onSkipTrialHint={() => setInterval("yearly")}
    />
  );

  const soloFooter = (
    <PlanTrialButton dark={isDark} highlighted onClick={() => onChooseSolo(interval)} />
  );

  const studioFooter = (
    <PlanTrialButton dark={isDark} onClick={() => onChooseStudio(interval, studioSeats)} />
  );

  const agencyRemark = (
    <PricingAgencyRemark dark={isDark} onContact={onContactAgency} />
  );

  const pricingStack = (
    <PricingPlansGrid
      className={className}
      theme={isDark ? "dark" : "light"}
      interval={interval}
      onIntervalChange={setInterval}
      activePlanId={null}
      showIntervalToggle
      studioSeats={studioSeats}
      onStudioSeatsChange={setStudioSeats}
      trialPromoBanner={trialPromoBanner}
      soloFooter={soloFooter}
      studioFooter={studioFooter}
      agencyRemark={agencyRemark}
    />
  );

  if (!isDark) {
    return pricingStack;
  }

  return (
    <div className="w-full min-w-0">
      <div className="mb-8 space-y-4 text-left sm:mb-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/45">
          Pricing
        </p>
        <h2 className="max-w-[26ch] text-balance text-[clamp(2rem,5vw,3.375rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-white">
          Try Solo free for 7 days. Scale with Studio.
        </h2>
      </div>
      {pricingStack}
    </div>
  );
}
