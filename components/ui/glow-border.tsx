"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface GlowBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Durée d'un tour complet en secondes. Par défaut 5 s. */
  duration?: number;
  /** Désactive l'effet (rendu inerte). */
  disabled?: boolean;
}

/**
 * Wrapper qui ajoute autour de son contenu :
 *  - un halo lumineux flou en arrière-plan
 *  - un anneau coloré plus net qui tourne autour de la bordure
 *
 * Les deux partagent la même variable `--glow-angle` animée via @property,
 * pour un effet "light qui parcourt la bordure" parfaitement synchronisé.
 */
export function GlowBorder({
  children,
  className,
  duration = 5,
  disabled = false,
  style,
  ...rest
}: GlowBorderProps) {
  const cssVars = {
    "--glow-duration": `${duration}s`,
    ...style,
  } as React.CSSProperties;

  // Conic gradients : ~120° de zone lumineuse, le reste transparent.
  // En faisant tourner `--glow-angle`, le segment coloré parcourt la bordure.
  const haloGradient =
    "conic-gradient(from var(--glow-angle, 0deg), transparent 0deg, transparent 30deg, hsl(280 92% 65%) 70deg, hsl(217 95% 65%) 100deg, hsl(190 95% 60%) 130deg, transparent 165deg, transparent 360deg)";

  const ringGradient =
    "conic-gradient(from var(--glow-angle, 0deg), transparent 0deg, transparent 40deg, hsl(280 95% 72%) 75deg, hsl(217 100% 72%) 100deg, hsl(190 100% 68%) 125deg, transparent 155deg, transparent 360deg)";

  return (
    <div
      {...rest}
      className={cn(
        "relative",
        !disabled && "animate-glow-spin motion-reduce:[animation:none]",
        className
      )}
      style={cssVars}
    >
      {/* Halo flou — derrière le contenu, sans isolate qui coupe l'effet */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-1.5 rounded-2xl opacity-90 sm:-inset-4 sm:rounded-[28px]"
        style={{
          background: haloGradient,
          filter: "blur(22px)",
          zIndex: 0,
        }}
      />
      {/* Anneau coloré — aligné sur rounded-xl du générateur compact */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-px rounded-xl opacity-85"
        style={{
          background: ringGradient,
          filter: "blur(2.5px)",
          zIndex: 1,
        }}
      />
      <div className="relative z-[2]">{children}</div>
    </div>
  );
}
