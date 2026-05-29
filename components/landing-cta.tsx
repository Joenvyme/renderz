"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type LandingCtaProps = {
  onClick: () => void;
  label?: string;
  className?: string;
};

/** CTA landing — renvoie vers le hero (générateur). */
export function LandingCta({
  onClick,
  label = "Start creating free",
  className,
}: LandingCtaProps) {
  return (
    <div className={cn("flex justify-center", className)}>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex min-h-11 w-full max-w-xs touch-manipulation items-center justify-center gap-2 rounded-[2px] border border-border/50 bg-black px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-[0_8px_32px_rgba(0,0,0,0.12)] transition-colors duration-200 hover:bg-black/85 active:bg-black/90 sm:w-auto sm:max-w-none sm:min-h-12 sm:px-10 sm:py-4 sm:text-base"
      >
        {label}
        <ArrowRight className="size-4 shrink-0" aria-hidden />
      </button>
    </div>
  );
}
