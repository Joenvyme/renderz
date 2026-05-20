"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

type AutoBeforeAfterProps = {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt?: string;
  afterAlt?: string;
  className?: string;
  beforeLabel?: string;
  afterLabel?: string;
  priority?: boolean;
  /** Mode background : remplit le parent, sans bordure, sans aspect ratio. */
  fullBleed?: boolean;
  /** Cache les labels (Sketch / AI Render) et le handle au centre. */
  hideChrome?: boolean;
  /**
   * "loop" : boucle aller-retour (style showcase).
   * "once" : joue une seule fois au mount, puis reste sur l'after.
   */
  mode?: "loop" | "once";
  /** Délai avant déclenchement en mode "once". Par défaut 2500 ms. */
  delayMs?: number;
  /**
   * Durée d'un cycle complet (en mode loop) OU durée du wipe (en mode once).
   * Par défaut : 8 s pour loop, 2.5 s pour once.
   */
  durationSec?: number;
};

/**
 * Avant / après automatique.
 * - mode="loop" : wipe horizontal en boucle continue (showcase).
 * - mode="once" : pause initiale, puis un seul wipe doux, et l'image reste sur le rendu.
 */
export function AutoBeforeAfter({
  beforeSrc,
  afterSrc,
  beforeAlt = "Sketch / plan",
  afterAlt = "AI render",
  className,
  beforeLabel = "Sketch",
  afterLabel = "AI Render",
  priority = false,
  fullBleed = false,
  hideChrome = false,
  mode = "loop",
  delayMs = 2500,
  durationSec,
}: AutoBeforeAfterProps) {
  const isOnce = mode === "once";
  const effectiveDuration = durationSec ?? (isOnce ? 2.5 : 8);

  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!isOnce) return;
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setRevealed(true);
      return;
    }
    const t = window.setTimeout(() => setRevealed(true), delayMs);
    return () => window.clearTimeout(t);
  }, [isOnce, delayMs]);

  const transition = `clip-path ${effectiveDuration}s cubic-bezier(0.65, 0, 0.35, 1), left ${effectiveDuration}s cubic-bezier(0.65, 0, 0.35, 1)`;

  // Style du calque "before" : clip qui révèle l'after de gauche à droite.
  const beforeStyle: React.CSSProperties = isOnce
    ? {
        clipPath: revealed ? "inset(0 0 0 100%)" : "inset(0 0 0 0%)",
        transition,
        willChange: "clip-path",
      }
    : { clipPath: "inset(0 0 0 50%)", animationDuration: `${effectiveDuration}s` };

  // Style de la ligne / handle : suit le bord du wipe.
  const lineStyle: React.CSSProperties = isOnce
    ? {
        left: revealed ? "100%" : "0%",
        transition,
        willChange: "left",
      }
    : { animationDuration: `${effectiveDuration}s` };

  return (
    <div
      className={cn(
        fullBleed
          ? "absolute inset-0 overflow-hidden"
          : "relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border/40 bg-muted/20 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.25)]",
        className
      )}
    >
      {/* After (toujours présent dessous) */}
      <Image
        src={afterSrc}
        alt={afterAlt}
        fill
        sizes="(max-width: 768px) 100vw, 768px"
        className="object-cover"
        priority={priority}
      />

      {/* Before — clip-path qui révèle/cache le after */}
      <div
        className={cn(
          "absolute inset-0",
          !isOnce && "animate-ba-wipe motion-reduce:animate-none"
        )}
        style={beforeStyle}
      >
        <Image
          src={beforeSrc}
          alt={beforeAlt}
          fill
          sizes="(max-width: 768px) 100vw, 768px"
          className="object-cover"
          priority={priority}
        />
      </div>

      {/* Ligne de séparation + handle, position synchronisée avec le clip */}
      {!hideChrome ? (
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0",
            isOnce ? "" : "left-1/2 animate-ba-line motion-reduce:animate-none"
          )}
          style={lineStyle}
          aria-hidden
        >
          <span className="absolute inset-y-0 w-px -translate-x-1/2 bg-white shadow-[0_0_0_0.5px_rgba(0,0,0,0.08)]" />
          <span className="absolute top-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/10">
            <GripVertical className="size-4 text-foreground/60" strokeWidth={2.5} />
          </span>
        </div>
      ) : null}

      {/* Labels discrets */}
      {!hideChrome ? (
        <>
          <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-white backdrop-blur-sm sm:left-4 sm:top-4">
            {beforeLabel}
          </span>
          <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-white backdrop-blur-sm sm:right-4 sm:top-4">
            {afterLabel}
          </span>
        </>
      ) : null}
    </div>
  );
}
