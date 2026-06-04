"use client";

import { useState, type ReactNode } from "react";
import { Check, Minus, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  ANNUAL_DISCOUNT_LABEL,
  PLANS,
  STUDIO_DEFAULT_SEATS,
  STUDIO_MIN_SEATS,
  formatChf,
  getPlan,
  planHeadlineAmount,
  studioHeadlineAmount,
  type PlanDefinition,
  type PlanId,
  type PricingInterval,
} from "@/lib/billing/plans";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type { PricingInterval };

type PricingTheme = "light" | "dark";

type PricingIntervalTabsProps = {
  interval: PricingInterval;
  onIntervalChange: (v: PricingInterval) => void;
  theme?: PricingTheme;
  className?: string;
};

export function PricingIntervalTabs({
  interval,
  onIntervalChange,
  theme = "light",
  className,
}: PricingIntervalTabsProps) {
  const isDark = theme === "dark";

  return (
    <Tabs
      value={interval}
      onValueChange={(v) => onIntervalChange(v as PricingInterval)}
      className={cn(isDark ? "w-fit" : "w-full max-w-md sm:w-fit", className)}
      aria-label="Billing period"
    >
      <TabsList
        className={cn(
          "grid h-11 grid-cols-2 gap-0 p-0",
          isDark
            ? "w-fit overflow-hidden rounded-[4px] border border-white/20 bg-transparent"
            : "w-full gap-1 p-1 sm:w-max"
        )}
      >
        <TabsTrigger
          value="monthly"
          className={cn(
            "h-full min-h-0 touch-manipulation rounded-none px-4 py-0 font-mono text-[11px] uppercase tracking-[0.08em] sm:px-6",
            isDark &&
              "data-[state=active]:bg-white data-[state=active]:text-black data-[state=inactive]:bg-transparent data-[state=inactive]:text-white/60"
          )}
        >
          Monthly
        </TabsTrigger>
        <TabsTrigger
          value="yearly"
          className={cn(
            "h-full min-h-0 touch-manipulation gap-1.5 rounded-none px-3 py-0 font-mono text-[11px] uppercase tracking-[0.08em] sm:gap-2 sm:px-6",
            isDark &&
              "data-[state=active]:bg-white data-[state=active]:text-black data-[state=inactive]:bg-transparent data-[state=inactive]:text-white/60"
          )}
        >
          <span>Yearly</span>
          <span
            className={cn(
              "rounded-[2px] border px-1.5 py-0.5 font-mono text-[10px] font-normal normal-case tracking-normal",
              isDark
                ? interval === "yearly"
                  ? "border-black/20 bg-black/10 text-black"
                  : "border-white/25 bg-transparent text-white/70"
                : interval === "yearly"
                  ? "border-white/35 bg-white/20 text-white"
                  : "border-emerald-200/80 bg-emerald-100 text-emerald-900"
            )}
          >
            {ANNUAL_DISCOUNT_LABEL}
          </span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

export type PricingPlansGridProps = {
  interval: PricingInterval;
  onIntervalChange: (v: PricingInterval) => void;
  trialFooter: ReactNode;
  soloFooter: ReactNode;
  studioFooter: ReactNode;
  agencyFooter: ReactNode;
  /** Espace actif abonné (mapping legacy à brancher côté settings). */
  activePlanId?: PlanId | null;
  studioSeats?: number;
  onStudioSeatsChange?: (seats: number) => void;
  className?: string;
  theme?: PricingTheme;
  showIntervalToggle?: boolean;
};

function FeatureList({
  items,
  dark,
  onLightSurface,
}: {
  items: string[];
  dark?: boolean;
  onLightSurface?: boolean;
}) {
  const textClass = dark
    ? onLightSurface
      ? "text-foreground"
      : "text-white/90"
    : "text-foreground";
  const iconClass = dark && !onLightSurface ? "text-white" : "text-black";

  return (
    <ul className="flex flex-1 flex-col gap-3.5 sm:space-y-4 sm:gap-0">
      {items.map((item) => (
        <li
          key={item}
          className={cn(
            "flex items-start gap-2.5 text-sm leading-snug md:leading-snug",
            dark ? "leading-[1.45]" : "text-muted-foreground"
          )}
        >
          <Check className={cn("mt-0.5 size-4 shrink-0", iconClass)} aria-hidden />
          <span className={textClass}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function PlanPriceBlock({
  plan,
  interval,
  dark,
  onLightSurface,
  studioSeats,
}: {
  plan: PlanDefinition;
  interval: PricingInterval;
  dark?: boolean;
  onLightSurface?: boolean;
  studioSeats: number;
}) {
  const suffixMuted = dark
    ? onLightSurface
      ? "text-black/50"
      : "text-white/55"
    : "text-muted-foreground";
  const subMuted = dark
    ? onLightSurface
      ? "text-black/50"
      : "text-white/50"
    : "text-muted-foreground";

  if (plan.id === "agency") {
    return (
      <div className="min-h-[4.5rem] sm:min-h-[5.5rem]">
        <span className="font-mono text-[clamp(2rem,5vw,3.25rem)] font-bold tracking-[-0.03em]">
          Custom
        </span>
        <p className={cn("mt-2 text-sm", subMuted)}>Tailored for 10+ seats</p>
      </div>
    );
  }

  if (plan.id === "studio") {
    const studio = studioHeadlineAmount(interval, studioSeats);
    return (
      <div className="min-h-[4.5rem] space-y-2 sm:min-h-[5.5rem]">
        <div className="flex flex-wrap items-baseline">
          <span
            className={cn(
              "font-mono font-bold tabular-nums tracking-[-0.03em]",
              dark
                ? "text-[clamp(1.75rem,4.5vw,2.75rem)]"
                : "text-2xl sm:text-3xl lg:text-4xl"
            )}
          >
            {studio.headline}
          </span>
        </div>
        <p className={cn("font-mono text-[10px] uppercase tracking-[0.06em] sm:text-xs", subMuted)}>
          {studio.sub}
        </p>
      </div>
    );
  }

  const head = planHeadlineAmount(plan, interval);
  return (
    <div className="min-h-[4.5rem] space-y-1 sm:min-h-[5.5rem]">
      <div className="flex flex-wrap items-baseline gap-1">
        <span
          className={cn(
            "font-mono font-bold tabular-nums tracking-[-0.03em]",
            dark
              ? "text-[clamp(2.5rem,6vw,3.625rem)]"
              : "text-3xl sm:text-4xl lg:text-5xl"
          )}
        >
          {plan.id === "trial" ? "0" : formatChf(head.main)}
        </span>
        <span className={cn("text-base sm:text-[15px]", suffixMuted)}>{head.suffix}</span>
        {interval === "yearly" && plan.id !== "trial" && (
          <span className="rounded-[2px] border border-emerald-200/80 bg-emerald-100 px-2 py-0.5 font-mono text-[10px] uppercase text-emerald-900">
            {ANNUAL_DISCOUNT_LABEL}
          </span>
        )}
      </div>
      {head.sub ? (
        <p className={cn("font-mono text-[10px] uppercase tracking-[0.06em] sm:text-xs", subMuted)}>
          {head.sub}
        </p>
      ) : plan.id === "trial" ? (
        <p className={cn("font-mono text-[10px] uppercase tracking-[0.06em]", subMuted)}>
          {head.sub ?? `${getPlan("trial").trialDays}-day trial · watermarked`}
        </p>
      ) : null}
    </div>
  );
}

function StudioSeatSelector({
  seats,
  onChange,
  dark,
  onLightSurface,
}: {
  seats: number;
  onChange: (n: number) => void;
  dark?: boolean;
  onLightSurface?: boolean;
}) {
  const dec = () => onChange(Math.max(STUDIO_MIN_SEATS, seats - 1));
  const inc = () => onChange(seats + 1);

  return (
    <div
      className={cn(
        "mt-4 flex items-center justify-between gap-3 rounded-[4px] border px-3 py-2",
        dark
          ? onLightSurface
            ? "border-black/15 bg-black/[0.03]"
            : "border-white/20 bg-white/5"
          : "border-border/80 bg-muted/20"
      )}
    >
      <span className="font-mono text-[10px] uppercase tracking-wider">Seats</span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-[4px]"
          onClick={dec}
          disabled={seats <= STUDIO_MIN_SEATS}
          aria-label="Remove seat"
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span className="min-w-[2ch] text-center font-mono text-sm font-semibold tabular-nums">
          {seats}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-[4px]"
          onClick={inc}
          aria-label="Add seat"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function PlanCardShell({
  plan,
  active,
  dark,
  onLightSurface,
  children,
}: {
  plan: PlanDefinition;
  active: boolean;
  dark?: boolean;
  onLightSurface?: boolean;
  children: ReactNode;
}) {
  if (dark) {
    if (onLightSurface) {
      return (
        <div className="relative flex flex-col rounded-lg bg-white p-[34px_30px] text-black">
          {children}
        </div>
      );
    }
    return (
      <div
        className={cn(
          "relative flex flex-col rounded-lg border p-[34px_30px] text-white",
          plan.highlighted ? "border-white/40 ring-1 ring-white/20" : "border-white/14"
        )}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex w-full min-w-0 flex-1 flex-col rounded-[6px] p-4 text-left shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-xl sm:p-6 md:p-8",
        plan.highlighted
          ? "border-2 border-black bg-white/80 ring-1 ring-black/10"
          : active
            ? "border-2 border-black bg-white/50 ring-1 ring-black/5"
            : "border border-border/50 bg-white/50",
        active && !plan.highlighted && "ring-2 ring-black/15"
      )}
    >
      {children}
    </div>
  );
}

/** Grille Trial / Solo / Studio (highlight) / Agency. */
export function PricingPlansGrid({
  interval,
  onIntervalChange,
  trialFooter,
  soloFooter,
  studioFooter,
  agencyFooter,
  activePlanId = null,
  studioSeats: studioSeatsProp,
  onStudioSeatsChange,
  className,
  theme = "light",
  showIntervalToggle = true,
}: PricingPlansGridProps) {
  const isDark = theme === "dark";
  const [studioSeatsInternal, setStudioSeatsInternal] = useState(STUDIO_DEFAULT_SEATS);
  const studioSeats = studioSeatsProp ?? studioSeatsInternal;
  const setStudioSeats = onStudioSeatsChange ?? setStudioSeatsInternal;

  const renderCard = (plan: PlanDefinition, footer: ReactNode) => {
    const onLightSurface = isDark && plan.highlighted;
    const labelClass = isDark
      ? onLightSurface
        ? "text-black"
        : "text-white/70"
      : undefined;

    return (
      <PlanCardShell
        key={plan.id}
        plan={plan}
        active={activePlanId === plan.id}
        dark={isDark}
        onLightSurface={onLightSurface}
      >
        {!isDark && plan.highlighted && (
          <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
            <span className="rounded-[4px] bg-black px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-white">
              Most popular
            </span>
          </div>
        )}

        <span
          className={cn(
            "font-mono text-[11px] uppercase tracking-[0.18em]",
            isDark && !onLightSurface && "text-white/70",
            plan.highlighted && isDark && !onLightSurface && "text-white",
            !isDark && "mb-3"
          )}
        >
          {plan.name}
          {plan.highlighted && isDark ? " · Popular" : ""}
        </span>

        {!isDark && (
          <Badge variant="outline" className="mb-3 w-fit font-mono text-[10px] uppercase tracking-widest">
            {plan.name}
          </Badge>
        )}

        <p
          className={cn(
            "text-sm",
            isDark ? (onLightSurface ? "text-black/55" : "text-white/55") : "mb-6 text-muted-foreground",
            !isDark && plan.highlighted && "mt-2"
          )}
        >
          {plan.tagline}
        </p>

        <PlanPriceBlock
          plan={plan}
          interval={interval}
          dark={isDark}
          onLightSurface={onLightSurface}
          studioSeats={studioSeats}
        />

        {plan.id === "studio" && (
          <StudioSeatSelector
            seats={studioSeats}
            onChange={setStudioSeats}
            dark={isDark}
            onLightSurface={onLightSurface}
          />
        )}

        {!isDark && <Separator className="my-6" />}

        <div className={cn("flex flex-1 flex-col", isDark && "mt-7")}>
          <FeatureList
            items={plan.features}
            dark={isDark}
            onLightSurface={onLightSurface}
          />
          <div className="mt-8">{footer}</div>
        </div>
      </PlanCardShell>
    );
  };

  const footers: Record<PlanId, ReactNode> = {
    trial: trialFooter,
    solo: soloFooter,
    studio: studioFooter,
    agency: agencyFooter,
  };

  if (isDark) {
    return (
      <div className={cn("w-full min-w-0", className)}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((plan) => renderCard(plan, footers[plan.id]))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full min-w-0", className)}>
      {showIntervalToggle && (
        <div className="mb-6 flex justify-center px-1 sm:mb-10">
          <PricingIntervalTabs
            interval={interval}
            onIntervalChange={onIntervalChange}
            theme="light"
          />
        </div>
      )}

      <div className="flex w-full flex-col items-stretch gap-6 xl:flex-row xl:items-stretch">
        {PLANS.map((plan) => renderCard(plan, footers[plan.id]))}
      </div>
    </div>
  );
}
