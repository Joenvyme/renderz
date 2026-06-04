"use client";

import { Clapperboard, ImageIcon, Maximize2, Sparkles } from "lucide-react";
import type { BillingPayload } from "@/lib/billing/billing-types";
import { getQuotaMetrics, quotaUsagePercent } from "@/lib/billing/quota-display";

function QuotaCard({
  title,
  icon: Icon,
  used,
  max,
  accent = "default",
}: {
  title: string;
  icon: typeof ImageIcon;
  used: number;
  max: number;
  accent?: "default" | "amber" | "violet";
}) {
  const ring =
    accent === "amber"
      ? "from-amber-500/15 to-amber-500/5 border-amber-500/20"
      : accent === "violet"
        ? "from-violet-500/15 to-violet-500/5 border-violet-500/20"
        : "from-foreground/8 to-foreground/3 border-border/80";
  const bar =
    accent === "amber"
      ? "from-amber-600 to-amber-500"
      : accent === "violet"
        ? "from-violet-600 to-violet-500"
        : "from-neutral-800 to-neutral-600";

  const p = quotaUsagePercent(used, max);

  return (
    <div
      className={`relative flex min-h-[132px] flex-col rounded-[6px] border bg-gradient-to-b p-4 shadow-sm sm:p-5 ${ring}`}
    >
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground sm:text-xs">
        <span className="flex h-8 w-8 items-center justify-center rounded-[4px] border border-border/60 bg-background/80 shadow-sm">
          <Icon className="h-4 w-4 text-foreground" strokeWidth={1.75} />
        </span>
        {title}
      </div>
      <div className="mt-3 flex flex-wrap items-baseline gap-1">
        <span className="text-3xl font-bold tabular-nums tracking-tight sm:text-4xl">{used}</span>
        <span className="font-mono text-lg tabular-nums text-muted-foreground">/ {max}</span>
      </div>
      <div className="mt-auto pt-4">
        <div className="h-2 overflow-hidden rounded-full bg-muted/80">
          <div
            className={`h-full rounded-full bg-gradient-to-r transition-[width] duration-300 ${bar}`}
            style={{ width: `${p}%` }}
          />
        </div>
      </div>
    </div>
  );
}

const METRIC_ICONS = {
  generations: Sparkles,
  renders: ImageIcon,
  upscales: Maximize2,
  animations: Clapperboard,
} as const;

export function QuotaCounterCards({
  subtitle,
  billing,
}: {
  variant: "trial" | "paid";
  subtitle: string;
  usage: { renders: number; animations: number; upscales: number };
  limits?: { renders: number; animations: number; upscales: number } | null;
  freeGenerationsMax?: number;
  /** Source unique pour les compteurs (évite le double plafond Free HD / anim). */
  billing: BillingPayload;
}) {
  const metrics = getQuotaMetrics(billing);

  return (
    <div className="space-y-3">
      {subtitle ? (
        <p className="text-[11px] font-mono leading-snug text-foreground/85">{subtitle}</p>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {metrics.map((m) => {
          const Icon = METRIC_ICONS[m.id as keyof typeof METRIC_ICONS] ?? ImageIcon;
          return (
            <QuotaCard
              key={m.id}
              title={m.label}
              icon={Icon}
              used={m.used}
              max={m.max}
              accent={m.accent}
            />
          );
        })}
      </div>
    </div>
  );
}
