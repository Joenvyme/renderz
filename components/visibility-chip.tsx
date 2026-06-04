"use client";

import { Lock, Users, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type Visibility = "private" | "organization";

export interface VisibilityChipProps {
  visibility: Visibility;
  /**
   * Si fourni, le chip devient un bouton interactif qui appelle ce callback
   * avec la valeur cible. Sinon il est read-only (display).
   */
  onToggle?: (next: Visibility) => void;
  /** Désactive le clic (déjà en cours de mise à jour). */
  loading?: boolean;
  /** Hide labels on small screens (utile dans une vignette dense). */
  compact?: boolean;
  /**
   * `false` quand l'item n'a pas d'organisation rattachée :
   * on continue à afficher le chip mais on désactive le toggle.
   */
  canShare?: boolean;
  className?: string;
}

/**
 * Pastille « Privé » / « Partagé » avec un toggle optionnel.
 *
 * - read-only :
 *   `<VisibilityChip visibility={r.visibility} />`
 * - interactif :
 *   `<VisibilityChip visibility={r.visibility} onToggle={async (v) => { await patch(v); }} />`
 */
export function VisibilityChip({
  visibility,
  onToggle,
  loading,
  compact = false,
  canShare = true,
  className,
}: VisibilityChipProps) {
  const isShared = visibility === "organization";

  const baseClasses = cn(
    "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide transition-colors",
    isShared
      ? "border-emerald-600/30 bg-emerald-50/80 text-emerald-800"
      : "border-border bg-white/85 text-muted-foreground",
    className
  );

  const Icon = isShared ? Users : Lock;
  const label = isShared ? "Shared" : "Private";
  const labelClass = compact ? "hidden sm:inline" : "inline";

  if (!onToggle) {
    return (
      <span className={baseClasses} title={label}>
        {loading ? (
          <Loader2 className="h-2.5 w-2.5 animate-spin" />
        ) : (
          <Icon className="h-2.5 w-2.5" strokeWidth={2} />
        )}
        <span className={labelClass}>{label}</span>
      </span>
    );
  }

  const disabled = !!loading || (!canShare && !isShared);
  const nextValue: Visibility = isShared ? "private" : "organization";
  const tooltip = disabled
    ? !canShare && !isShared
      ? "No organization available — select one in the header"
      : "Updating…"
    : isShared
      ? "Make private"
      : "Share with organization";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (!disabled) onToggle(nextValue);
      }}
      disabled={disabled}
      className={cn(
        baseClasses,
        "cursor-pointer hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60",
        isShared && !disabled && "hover:bg-emerald-100/90"
      )}
      title={tooltip}
      aria-label={tooltip}
    >
      {loading ? (
        <Loader2 className="h-2.5 w-2.5 animate-spin" />
      ) : (
        <Icon className="h-2.5 w-2.5" strokeWidth={2} />
      )}
      <span className={labelClass}>{label}</span>
    </button>
  );
}
