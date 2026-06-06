"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  PROFILE_NAV_GROUPS,
  getProfileNameBySlug,
} from "@/content/profiles";
import {
  FEATURE_NAV_GROUPS,
  getFeatureNavLabel,
} from "@/content/features";

export type NavLink = { href: string; label: string };
export type NavGroup = { label: string; items: NavLink[] };

export const PLATFORM_NAV: NavGroup[] = FEATURE_NAV_GROUPS.map((group) => ({
  label: group.label,
  items: group.slugs.map((slug) => ({
    href: `/platform/${slug}`,
    label: getFeatureNavLabel(slug) ?? slug,
  })),
}));

export const USE_CASES_NAV: NavGroup[] = PROFILE_NAV_GROUPS.map((group) => ({
  label: group.label,
  items: group.slugs.map((slug) => ({
    href: `/for/${slug}`,
    label: getProfileNameBySlug(slug) ?? slug,
  })),
}));

const TRIGGER_CLASSES =
  "inline-flex min-h-10 touch-manipulation items-center gap-1 rounded-[2px] px-2 font-mono text-[10px] uppercase tracking-wide text-foreground transition-colors hover:bg-muted sm:min-h-9 sm:px-3 sm:text-xs";

function NavDropdown({
  label,
  groups,
  columns,
}: {
  label: string;
  groups: NavGroup[];
  columns: number;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
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
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((prev) => !prev)}
        className={TRIGGER_CLASSES}
      >
        {label}
        <ChevronDown
          className={cn("size-3.5 transition-transform sm:size-4", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          className={cn(
            "absolute right-0 top-full z-50 mt-2 rounded-[4px] border border-border/60 bg-white p-5 shadow-[0_16px_48px_rgba(0,0,0,0.12)]",
            columns >= 3 ? "w-[min(calc(100vw-2rem),32rem)]" : "w-[min(calc(100vw-2rem),24rem)]"
          )}
        >
          <div
            className={cn(
              "grid gap-5 sm:gap-4",
              columns >= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"
            )}
          >
            {groups.map((group) => (
              <div key={group.label}>
                <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground sm:text-[10px]">
                  {group.label}
                </p>
                <ul className="space-y-1.5">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="block text-xs leading-snug text-foreground transition-colors hover:text-foreground/70 sm:text-[13px]"
                      >
                        {item.label}
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

function MobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex min-h-10 min-w-10 touch-manipulation items-center justify-center rounded-[2px] text-foreground transition-colors hover:bg-muted"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 top-14 z-40 bg-black/20"
          />
          <div className="fixed inset-x-0 top-14 z-50 max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-b border-border bg-white px-4 py-5 shadow-[0_16px_48px_rgba(0,0,0,0.12)]">
            <MobileSection title="Platform" groups={PLATFORM_NAV} onNavigate={() => setOpen(false)} />
            <MobileSection title="Use Cases" groups={USE_CASES_NAV} onNavigate={() => setOpen(false)} />
            <div className="pt-2">
              <Link
                href="/#pricing-section"
                onClick={() => setOpen(false)}
                className="block py-2 font-mono text-[11px] uppercase tracking-wide text-foreground"
              >
                Pricing
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function MobileSection({
  title,
  groups,
  onNavigate,
}: {
  title: string;
  groups: NavGroup[];
  onNavigate: () => void;
}) {
  return (
    <div className="border-b border-border/40 pb-4 mb-4">
      <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-foreground/80">
        {title}
      </p>
      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
              {group.label}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className="block py-1 text-sm text-foreground/90 transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Desktop nav links (sm+): Platform + Use Cases dropdowns + Pricing. */
export function MarketingDesktopNav() {
  return (
    <nav className="hidden items-center gap-1 sm:flex">
      <NavDropdown label="Platform" groups={PLATFORM_NAV} columns={2} />
      <NavDropdown label="Use Cases" groups={USE_CASES_NAV} columns={3} />
      <Link href="/#pricing-section" className={TRIGGER_CLASSES}>
        Pricing
      </Link>
    </nav>
  );
}

/** Mobile hamburger menu (<sm). */
export function MarketingMobileNav() {
  return <MobileMenu />;
}

/** Footer columns: Platform + Use Cases + Pricing. */
export function MarketingFooterNav() {
  return (
    <div className="grid w-full gap-8 sm:grid-cols-4 sm:gap-6">
      <FooterColumn title="Platform" items={PLATFORM_NAV.flatMap((g) => g.items)} />
      {USE_CASES_NAV.map((group) => (
        <FooterColumn key={group.label} title={group.label} items={group.items} />
      ))}
    </div>
  );
}

function FooterColumn({ title, items }: { title: string; items: NavLink[] }) {
  return (
    <div>
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/80 sm:text-xs">
        {title}
      </p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground sm:text-sm"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
