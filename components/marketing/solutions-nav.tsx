"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PROFILE_NAV_GROUPS,
  getProfileNameBySlug,
} from "@/content/profiles";

type SolutionsNavProps = {
  variant: "header" | "footer";
  onNavigate?: () => void;
};

export function SolutionsNav({ variant, onNavigate }: SolutionsNavProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (variant !== "header" || !open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, variant]);

  if (variant === "footer") {
    return (
      <div className="grid w-full gap-8 sm:grid-cols-3 sm:gap-6">
        {PROFILE_NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/80 sm:text-xs">
              {group.label}
            </p>
            <ul className="space-y-2">
              {group.slugs.map((slug) => (
                <li key={slug}>
                  <Link
                    href={`/for/${slug}`}
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground sm:text-sm"
                  >
                    {getProfileNameBySlug(slug)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex min-h-10 touch-manipulation items-center gap-1 rounded-[2px] px-2 font-mono text-[10px] uppercase tracking-wide text-foreground transition-colors hover:bg-muted sm:min-h-9 sm:px-3 sm:text-xs"
      >
        Solutions
        <ChevronDown
          className={cn("size-3.5 transition-transform sm:size-4", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(calc(100vw-2rem),22rem)] rounded-[4px] border border-border/60 bg-white p-4 shadow-[0_16px_48px_rgba(0,0,0,0.12)] sm:w-[28rem] sm:p-5">
          <div className="grid gap-5 sm:grid-cols-3 sm:gap-4">
            {PROFILE_NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground sm:text-[10px]">
                  {group.label}
                </p>
                <ul className="space-y-1.5">
                  {group.slugs.map((slug) => (
                    <li key={slug}>
                      <Link
                        href={`/for/${slug}`}
                        onClick={() => {
                          setOpen(false);
                          onNavigate?.();
                        }}
                        className="block text-xs leading-snug text-foreground transition-colors hover:text-foreground/70 sm:text-[13px]"
                      >
                        {getProfileNameBySlug(slug)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
