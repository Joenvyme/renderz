"use client";

import Link from "next/link";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { QuotaLimitPresentation } from "@/lib/billing/quota-errors";

type QuotaLimitDialogProps = {
  open: boolean;
  content: QuotaLimitPresentation | null;
  onClose: () => void;
};

export function QuotaLimitDialog({ open, content, onClose }: QuotaLimitDialogProps) {
  if (!open || !content) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <Card className="relative z-[201] w-full max-w-md rounded-[6px] border border-border bg-white p-5 shadow-xl sm:p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
          <Sparkles className="h-5 w-5 text-amber-800" aria-hidden />
        </div>

        <h3 className="pr-8 text-lg font-bold tracking-tight text-foreground">{content.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{content.description}</p>

        {content.detail && (
          <p className="mt-3 rounded-[4px] border border-border/80 bg-muted/40 px-3 py-2 font-mono text-[11px] leading-snug text-muted-foreground">
            {content.detail}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="font-mono text-xs" onClick={onClose}>
            Not now
          </Button>
          <Button asChild className="font-mono text-xs !bg-black hover:!bg-black/85">
            <Link href={content.upgradeHref} onClick={onClose}>
              {content.upgradeLabel}
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
