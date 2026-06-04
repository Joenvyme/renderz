"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  PricingIntervalTabs,
  PricingPlansGrid,
  type PricingInterval,
} from "@/components/pricing-plans-grid";

type MarketingPricingSectionProps = {
  onStartTrial: () => void;
  onChooseSolo: (interval: PricingInterval) => void;
  onChooseStudio: (interval: PricingInterval, seats: number) => void;
  onContactAgency?: () => void;
  className?: string;
  theme?: "light" | "dark";
};

/**
 * Grille tarifaire marketing (page d’accueil) — même grille que Paramètres / abonnement.
 */
export function MarketingPricingSection({
  onStartTrial,
  onChooseSolo,
  onChooseStudio,
  onContactAgency,
  className,
  theme = "light",
}: MarketingPricingSectionProps) {
  const [interval, setInterval] = useState<PricingInterval>("monthly");
  const [studioSeats, setStudioSeats] = useState(3);
  const isDark = theme === "dark";

  const trialFooter = (
    <Button
      type="button"
      variant="outline"
      onClick={onStartTrial}
      className={cn(
        "min-h-11 w-full touch-manipulation rounded-[4px] font-mono text-[11px] uppercase tracking-[0.1em]",
        isDark
          ? "border border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
          : "rounded-[2px] border-2 border-black tracking-wider hover:bg-black hover:text-white"
      )}
    >
      {isDark ? "Start 7-day trial" : "START 7-DAY TRIAL"}
    </Button>
  );

  const soloFooter = (
    <Button
      type="button"
      onClick={() => onChooseSolo(interval)}
      className={cn(
        "min-h-11 w-full touch-manipulation rounded-[4px] font-mono text-[11px] uppercase tracking-[0.1em]",
        isDark
          ? "border border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
          : "rounded-[2px] border-2 border-black tracking-wider hover:bg-black hover:text-white"
      )}
    >
      {isDark ? "Choose Solo" : "CHOOSE SOLO"}
    </Button>
  );

  const studioFooter = (
    <Button
      type="button"
      onClick={() => onChooseStudio(interval, studioSeats)}
      className={cn(
        "min-h-11 w-full touch-manipulation rounded-[4px] font-mono text-[11px] uppercase tracking-[0.1em]",
        isDark
          ? "bg-black text-white hover:bg-black/85"
          : "bg-black text-xs tracking-wider text-white hover:bg-black/85"
      )}
    >
      {isDark ? "Choose Studio" : "CHOOSE STUDIO"}
    </Button>
  );

  const agencyFooter = (
    <Button
      type="button"
      variant="outline"
      onClick={onContactAgency ?? (() => (window.location.href = "mailto:hello@renderz.ch?subject=Agency%20plan"))}
      className={cn(
        "min-h-11 w-full touch-manipulation rounded-[4px] font-mono text-[11px] uppercase tracking-[0.1em]",
        isDark
          ? "border border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
          : "rounded-[2px] border-2 border-black tracking-wider hover:bg-black hover:text-white"
      )}
    >
      {isDark ? "Contact us" : "CONTACT US"}
    </Button>
  );

  if (isDark) {
    return (
      <div className={cn("w-full min-w-0", className)}>
        <div className="mb-10 flex flex-col gap-6 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-4 text-left">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/45">
              Pricing
            </p>
            <h2 className="max-w-[22ch] text-balance text-[clamp(2rem,5vw,3.375rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-white">
              7-day trial. Upgrade when it pays for itself
            </h2>
          </div>
          <PricingIntervalTabs
            interval={interval}
            onIntervalChange={setInterval}
            theme="dark"
            className="shrink-0"
          />
        </div>

        <PricingPlansGrid
          theme="dark"
          interval={interval}
          onIntervalChange={setInterval}
          activePlanId={null}
          showIntervalToggle={false}
          studioSeats={studioSeats}
          onStudioSeatsChange={setStudioSeats}
          trialFooter={trialFooter}
          soloFooter={soloFooter}
          studioFooter={studioFooter}
          agencyFooter={agencyFooter}
        />
      </div>
    );
  }

  return (
    <PricingPlansGrid
      className={cn(className)}
      interval={interval}
      onIntervalChange={setInterval}
      activePlanId={null}
      studioSeats={studioSeats}
      onStudioSeatsChange={setStudioSeats}
      trialFooter={trialFooter}
      soloFooter={soloFooter}
      studioFooter={studioFooter}
      agencyFooter={agencyFooter}
    />
  );
}
