"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Eye, Lock, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export type VisibilityFilterValue = "private" | "organization";

export interface VisibilityFilterProps {
  /** Set des visibilités sélectionnées. Vide ou les 2 cochées = équivalent à « tout ». */
  value: Set<VisibilityFilterValue>;
  onChange: (next: Set<VisibilityFilterValue>) => void;
  /**
   * - `toolbar` : bouton inline avec border-bottom (style /profile toolbar).
   * - `compact` : pill avec bordure (style /catalog toolbar).
   */
  variant?: "toolbar" | "compact";
  className?: string;
}

/**
 * Filtre visibilité (Shared / Private) sous forme de bouton + dropdown multi-sélection.
 *
 * Sémantique :
 * - 0 ou 2 cochés ⇒ aucune contrainte (= « tout afficher »).
 * - 1 coché ⇒ filtre strict sur cette visibilité.
 *
 * Le bouton montre l'état actif (1 seul coché = libellé direct + style "actif").
 */
export function VisibilityFilter({
  value,
  onChange,
  variant = "toolbar",
  className,
}: VisibilityFilterProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onMouse = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onMouse);
    return () => document.removeEventListener("mousedown", onMouse);
  }, [open]);

  const toggle = (v: VisibilityFilterValue) => {
    const next = new Set(value);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    onChange(next);
  };

  const sharedActive = value.has("organization");
  const privateActive = value.has("private");
  // « En filtre » uniquement quand 1 seul est coché. 0 ou 2 → aucun effet.
  const isFiltering = value.size === 1;

  const buttonLabel = (() => {
    if (sharedActive && !privateActive) return "Shared";
    if (privateActive && !sharedActive) return "Private";
    return "Visibility";
  })();

  const panel = open ? (
    <div
      role="menu"
      aria-label="Filter by visibility"
      className={cn(
        "absolute z-30 mt-1 min-w-[180px] overflow-hidden rounded-[6px] border border-border/80 bg-white py-1 shadow-md",
        variant === "compact" ? "right-0 top-full" : "left-0 top-full"
      )}
    >
      <DropdownRow
        icon={<Users className="h-3.5 w-3.5 opacity-70" strokeWidth={2} />}
        label="Shared"
        checked={sharedActive}
        onClick={() => toggle("organization")}
      />
      <DropdownRow
        icon={<Lock className="h-3.5 w-3.5 opacity-70" strokeWidth={2} />}
        label="Private"
        checked={privateActive}
        onClick={() => toggle("private")}
      />
    </div>
  ) : null;

  if (variant === "compact") {
    return (
      <div ref={wrapperRef} className={cn("relative", className)}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          className={cn(
            "inline-flex h-8 items-center gap-1 rounded-md border px-2 text-[12px] font-medium transition-colors",
            isFiltering
              ? "border-foreground bg-foreground/5 text-foreground"
              : "border-border bg-white text-muted-foreground hover:bg-muted/40 hover:text-foreground"
          )}
        >
          <Eye className="h-3 w-3" strokeWidth={2} />
          {buttonLabel}
          <ChevronDown className="h-3 w-3 opacity-70" strokeWidth={2} />
        </button>
        {panel}
      </div>
    );
  }

  // Variante "toolbar" — bouton inline avec border-bottom au style de la toolbar /profile.
  return (
    <div ref={wrapperRef} className={cn("relative shrink-0", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "max-lg:snap-start max-lg:snap-always max-lg:touch-manipulation inline-flex items-center gap-1.5 border-b-2 border-transparent py-2.5 sm:py-0.5 transition-colors",
          isFiltering
            ? "font-semibold text-foreground border-foreground"
            : "font-normal text-muted-foreground hover:text-foreground"
        )}
      >
        <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        {buttonLabel}
        <ChevronDown className="h-3 w-3 opacity-70" strokeWidth={2} />
      </button>
      {panel}
    </div>
  );
}

function DropdownRow({
  icon,
  label,
  checked,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="menuitemcheckbox"
      aria-checked={checked}
      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium text-foreground transition-colors hover:bg-muted/50"
    >
      <span
        className={cn(
          "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border transition-colors",
          checked
            ? "border-foreground bg-foreground text-background"
            : "border-border bg-white"
        )}
        aria-hidden
      >
        {checked && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
      </span>
      {icon}
      <span className="flex-1">{label}</span>
    </button>
  );
}

/** Serialize the filter set into a query param. Null if 0 or 2 selected. */
export function serializeVisibilityFilter(
  value: Set<VisibilityFilterValue>
): string | null {
  if (value.size === 0 || value.size === 2) return null;
  return Array.from(value).join(",");
}
