"use client";

import { Clapperboard, ImageIcon, Maximize2 } from "lucide-react";

function pct(used: number, max: number) {
  if (max <= 0) return 0;
  return Math.min(100, Math.round((used / max) * 100));
}

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

  const p = pct(used, max);

  return (
    <div
      className={`relative flex flex-col rounded-xl border bg-gradient-to-b p-4 sm:p-5 min-h-[132px] shadow-sm ${ring}`}
    >
      <div className="flex items-center gap-2 text-[10px] sm:text-xs font-mono uppercase tracking-wider text-muted-foreground">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-background/80 border border-border/60 shadow-sm">
          <Icon className="h-4 w-4 text-foreground" strokeWidth={1.75} />
        </span>
        {title}
      </div>
      <div className="mt-3 flex items-baseline gap-1 flex-wrap">
        <span className="text-3xl sm:text-4xl font-bold tabular-nums tracking-tight">{used}</span>
        <span className="text-lg text-muted-foreground font-mono tabular-nums">/ {max}</span>
      </div>
      <div className="mt-auto pt-4">
        <div className="h-2 rounded-full bg-muted/80 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r transition-[width] duration-300 ${bar}`}
            style={{ width: `${p}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function QuotaCounterCards({
  variant,
  subtitle,
  usage,
  limits,
  freeGenerationsMax,
}: {
  variant: "free" | "paid";
  /** Ex. date de renouvellement Stripe ou période de quotas gratuite */
  subtitle: string;
  usage: { renders: number; animations: number; upscales: number };
  limits?: { renders: number; animations: number; upscales: number } | null;
  /** Plafond mensuel combiné HD + anim. (formule gratuite), ex. 5 */
  freeGenerationsMax?: number;
}) {
  const gMax = freeGenerationsMax ?? 5;

  return (
    <div className="space-y-3">
      {subtitle ? (
        <p className="text-[11px] font-mono text-foreground/85 leading-snug">{subtitle}</p>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {variant === "paid" && limits ? (
          <>
            <QuotaCard title="Rendus HD" icon={ImageIcon} used={usage.renders} max={limits.renders} />
            <QuotaCard title="Rendus 4K" icon={Maximize2} used={usage.upscales} max={limits.upscales} accent="amber" />
            <QuotaCard title="Animations" icon={Clapperboard} used={usage.animations} max={limits.animations} accent="violet" />
          </>
        ) : (
          <>
            <QuotaCard title="Rendus HD" icon={ImageIcon} used={usage.renders} max={gMax} />
            <QuotaCard title="Rendus 4K" icon={Maximize2} used={usage.upscales} max={1} accent="amber" />
            <QuotaCard title="Animations" icon={Clapperboard} used={usage.animations} max={gMax} accent="violet" />
          </>
        )}
      </div>
    </div>
  );
}
