"use client";

import type { ReactNode } from "react";
import { Check, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  ANNUAL_DISCOUNT_LABEL,
  ENT_MONTHLY,
  ENT_YEARLY,
  PRO_MONTHLY,
  PRO_YEARLY,
  formatChf,
  type PricingInterval,
} from "@/lib/billing/pricing-display";

export type { PricingInterval };

type SubscriberTier = "free" | "pro" | "enterprise";

function ProPriceHead({ interval }: { interval: PricingInterval }) {
  if (interval === "monthly") {
    return (
      <div className="flex flex-wrap items-baseline gap-1">
        <span className="font-mono text-3xl font-bold tabular-nums sm:text-4xl lg:text-5xl">{formatChf(PRO_MONTHLY)}</span>
        <span className="text-base font-medium text-muted-foreground sm:text-lg">CHF / month</span>
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="font-mono text-3xl font-bold tabular-nums sm:text-4xl lg:text-5xl">{formatChf(PRO_YEARLY)}</span>
        <span className="text-base font-medium text-muted-foreground sm:text-lg">CHF / year</span>
        <span className="rounded-[2px] border border-emerald-200/80 bg-emerald-100 px-2 py-0.5 font-mono text-[10px] uppercase text-emerald-900">
          {ANNUAL_DISCOUNT_LABEL}
        </span>
      </div>
      <p className="font-mono text-xs text-muted-foreground">
        That's {formatChf(PRO_YEARLY / 12)} CHF / month, billed once a year
      </p>
    </div>
  );
}

function EntPriceHead({ interval }: { interval: PricingInterval }) {
  if (interval === "monthly") {
    return (
      <div className="flex flex-wrap items-baseline gap-1">
        <span className="font-mono text-3xl font-bold tabular-nums sm:text-4xl lg:text-5xl">{formatChf(ENT_MONTHLY)}</span>
        <span className="text-base font-medium text-muted-foreground sm:text-lg">CHF / month</span>
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="font-mono text-3xl font-bold tabular-nums sm:text-4xl lg:text-5xl">{formatChf(ENT_YEARLY)}</span>
        <span className="text-base font-medium text-muted-foreground sm:text-lg">CHF / year</span>
        <span className="rounded-[2px] border border-emerald-200/80 bg-emerald-100 px-2 py-0.5 font-mono text-[10px] uppercase text-emerald-900">
          {ANNUAL_DISCOUNT_LABEL}
        </span>
      </div>
      <p className="font-mono text-xs text-muted-foreground">
        That's {formatChf(ENT_YEARLY / 12)} CHF / month, billed once a year
      </p>
    </div>
  );
}

function shellFreeEnt(active: boolean, base: string) {
  return cn(
    base,
    active ? "border-2 border-black ring-1 ring-black/5" : "border border-border/50"
  );
}

export type PricingPlansGridProps = {
  interval: PricingInterval;
  onIntervalChange: (v: PricingInterval) => void;
  freeFooter: ReactNode;
  proFooter: ReactNode;
  enterpriseFooter: ReactNode;
  /** Abonné connecté (paramètres) : carte du palier actuel mise en avant. Omit pour la landing. */
  subscriberTier?: SubscriberTier | null;
  className?: string;
};

/**
 * Grille 3 colonnes + onglets Mensuel / Annuel — même UI que la landing (shadcn Tabs, Badge, Separator).
 */
export function PricingPlansGrid({
  interval,
  onIntervalChange,
  freeFooter,
  proFooter,
  enterpriseFooter,
  subscriberTier = null,
  className,
}: PricingPlansGridProps) {
  const emphasizeFree = subscriberTier === "free";
  const emphasizeEnterprise = subscriberTier === "enterprise";

  return (
    <div className={cn("w-full min-w-0", className)}>
      <div className="mb-6 flex justify-center px-1 sm:mb-10">
        <Tabs
          value={interval}
          onValueChange={(v) => onIntervalChange(v as PricingInterval)}
          className="w-full max-w-md sm:w-fit"
          aria-label="Billing period"
        >
          <TabsList className="grid h-11 w-full grid-cols-2 gap-1 p-1 sm:w-max">
            <TabsTrigger value="monthly" className="h-full min-h-0 touch-manipulation px-4 py-0 sm:px-6">
              Monthly
            </TabsTrigger>
            <TabsTrigger value="yearly" className="h-full min-h-0 touch-manipulation gap-1.5 px-3 py-0 sm:gap-2 sm:px-6">
              <span>Yearly</span>
              <span
                className={cn(
                  "rounded-[2px] border px-1.5 py-0.5 font-mono text-[10px] font-normal normal-case tracking-normal",
                  interval === "yearly"
                    ? "border-white/35 bg-white/20 text-white"
                    : "border-emerald-200/80 bg-emerald-100 text-emerald-900"
                )}
              >
                {ANNUAL_DISCOUNT_LABEL}
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex w-full flex-col items-stretch gap-6 md:flex-row md:items-stretch">
        {/* Free */}
        <div
          className={cn(
            shellFreeEnt(
              emphasizeFree,
              "flex w-full min-w-0 flex-1 flex-col rounded-[6px] bg-white/50 p-4 text-left shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-xl sm:p-6 md:p-8"
            )
          )}
        >
          <Badge variant="outline" className="mb-3 w-fit font-mono text-[10px] uppercase tracking-widest">
            Free
          </Badge>
          <p className="mb-6 text-sm text-muted-foreground">Free trial — no card</p>
          <div className="min-h-[5.5rem]">
            <div className="flex flex-wrap items-baseline gap-1">
              <span className="font-mono text-3xl font-bold tabular-nums sm:text-4xl lg:text-5xl">0</span>
              <span className="text-base font-medium text-muted-foreground sm:text-lg">CHF</span>
            </div>
          </div>
          <p className="pointer-events-none select-none text-sm text-transparent" aria-hidden>
            &nbsp;
          </p>
          <Separator className="my-6" />
          <div className="flex flex-1 flex-col">
            <ul className="space-y-4 text-sm leading-snug text-muted-foreground md:leading-snug">
              <li className="flex items-start gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-black" aria-hidden />
                <span className="text-foreground">
                  5 creations per month (1 image or 1 animation = 1 creation; resets every calendar month UTC)
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-black" aria-hidden />
                <span className="text-foreground">1 4K upscale (Magnific) per month (same UTC period)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-black" aria-hidden />
                <span className="text-foreground">1 project folder</span>
              </li>
              <li className="flex items-start gap-2.5 text-muted-foreground">
                <X className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>Pro / team quotas</span>
              </li>
            </ul>
            <div className="mt-8">{freeFooter}</div>
          </div>
        </div>

        {/* Pro */}
        <div
          className={cn(
            "relative flex w-full min-w-0 flex-1 flex-col rounded-[6px] border-2 border-black bg-white/80 p-4 text-left shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-xl ring-1 ring-black/10 sm:p-6 md:p-8",
            subscriberTier === "pro" && "ring-2 ring-black/15"
          )}
        >
          <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
            <span className="rounded-[4px] bg-black px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-white">
              Popular
            </span>
          </div>
          <Badge variant="outline" className="mb-3 mt-2 w-fit font-mono text-[10px] uppercase tracking-widest">
            Pro
          </Badge>
          <p className="mb-6 text-sm text-muted-foreground">Creators & freelancers</p>
          <div className="min-h-[5.5rem]">
            <ProPriceHead interval={interval} />
          </div>
          <p className={cn("text-sm text-muted-foreground", interval === "yearly" ? "invisible" : "")}>
            {interval === "monthly" ? "Billed monthly" : "\u00a0"}
          </p>
          <Separator className="my-6" />
          <div className="flex flex-1 flex-col">
            <ul className="space-y-4 text-sm leading-snug text-muted-foreground md:leading-snug">
              <li className="flex items-start gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-black" aria-hidden />
                <span className="text-foreground">100 renders / month</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-black" aria-hidden />
                <span className="text-foreground">100 animations / month</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-black" aria-hidden />
                <span className="text-foreground">25 upscales / month</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-black" aria-hidden />
                <span className="text-foreground">Unlimited projects</span>
              </li>
            </ul>
            <div className="mt-8">{proFooter}</div>
          </div>
        </div>

        {/* Enterprise */}
        <div
          className={cn(
            shellFreeEnt(
              emphasizeEnterprise,
              "flex w-full min-w-0 flex-1 flex-col rounded-[6px] bg-white/50 p-4 text-left shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-xl sm:p-6 md:p-8"
            )
          )}
        >
          <Badge variant="outline" className="mb-3 w-fit font-mono text-[10px] uppercase tracking-widest">
            Enterprise
          </Badge>
          <p className="mb-6 text-sm text-muted-foreground">Teams & agencies</p>
          <div className="min-h-[5.5rem]">
            <EntPriceHead interval={interval} />
          </div>
          <p className={cn("text-sm text-muted-foreground", interval === "yearly" ? "invisible" : "")}>
            {interval === "monthly" ? "Billed monthly" : "\u00a0"}
          </p>
          <Separator className="my-6" />
          <div className="flex flex-1 flex-col">
            <ul className="space-y-4 text-sm leading-snug text-muted-foreground md:leading-snug">
              <li className="flex items-start gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-black" aria-hidden />
                <span className="text-foreground">Unlimited members (invitations)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-black" aria-hidden />
                <span className="text-foreground">
                  Shared pool: 1000 renders, 250 animations, 100 upscales / month
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-black" aria-hidden />
                <span className="text-foreground">Furniture catalog & priority</span>
              </li>
            </ul>
            <div className="mt-8">{enterpriseFooter}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
