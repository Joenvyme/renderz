"use client";

import * as React from "react";
import Image from "next/image";
import { AuroraText } from "@/components/ui/aurora-text";
import { cn } from "@/lib/utils";

const ZOOM = 3;
const MAGNIFIER_SIZE = 176; // px (= size-44)

type MagnifierState = {
  x: number;
  y: number;
  w: number;
  h: number;
  visible: boolean;
};

/**
 * Section showcase "Upgrade to 4K quality" en mode cinématique :
 *  - Fond zinc-950 plein écran, rupture visuelle avec les sections blanches.
 *  - Image 4K qui se scale-in à l'arrivée via IntersectionObserver.
 *  - Loupe (300 %) qui révèle le détail pixel sur desktop ; sur tactile
 *    une animation auto trace lentement un sweep horizontal pour montrer
 *    la valeur ajoutée de la résolution.
 *  - Respecte `prefers-reduced-motion`.
 */
export function FourKShowcase() {
  const sectionRef = React.useRef<HTMLDivElement>(null);
  const imageRef = React.useRef<HTMLDivElement>(null);

  const [active, setActive] = React.useState(false);
  const [isCoarse, setIsCoarse] = React.useState(false);
  const [reduceMotion, setReduceMotion] = React.useState(false);
  const [magnifier, setMagnifier] = React.useState<MagnifierState>({
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    visible: false,
  });

  // Détecter pointeur / motion-reduce
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    setIsCoarse(window.matchMedia("(pointer: coarse)").matches);
    setReduceMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }, []);

  // IntersectionObserver pour déclencher l'animation d'entrée
  React.useEffect(() => {
    if (!sectionRef.current) return;
    const node = sectionRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.intersectionRatio > 0.35),
      { threshold: [0, 0.15, 0.35, 0.6, 0.9] }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Animation auto de la loupe sur tactile (sweep doux gauche → droite)
  React.useEffect(() => {
    if (!isCoarse || !active || reduceMotion) return;
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    if (rect.width === 0) return;

    let raf = 0;
    const start = performance.now();
    const duration = 6000; // 6 s par cycle

    const tick = (t: number) => {
      const elapsed = (t - start) % duration;
      const progress = elapsed / duration; // 0 → 1
      // mouvement sinusoïdal pour aller-retour fluide
      const sweep = 0.5 + 0.4 * Math.sin(progress * Math.PI * 2);
      setMagnifier({
        x: rect.width * sweep,
        y: rect.height * 0.55,
        w: rect.width,
        h: rect.height,
        visible: true,
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isCoarse, active, reduceMotion]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isCoarse || !imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    setMagnifier({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      w: rect.width,
      h: rect.height,
      visible: true,
    });
  };

  const handlePointerEnter = () => {
    if (isCoarse) return;
    setMagnifier((m) => ({ ...m, visible: true }));
  };

  const handlePointerLeave = () => {
    if (isCoarse) return;
    setMagnifier((m) => ({ ...m, visible: false }));
  };

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-zinc-950 text-white"
    >
      {/* Trame de points subtile */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: "radial-gradient(white 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      {/* Halo doux derrière l'image */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at center, rgba(120,140,255,0.08), transparent 70%)",
        }}
      />

      {/* Layout */}
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[1600px] flex-col justify-between px-5 py-8 sm:px-8 sm:py-12 md:px-12 md:py-14 lg:px-16 lg:py-16">
        {/* HEADER — eyebrow + tech meta */}
        <header
          className={cn(
            "flex flex-col items-center justify-between gap-3 transition-all duration-1000 ease-out sm:flex-row",
            "motion-reduce:transition-none motion-reduce:translate-y-0 motion-reduce:opacity-100",
            active ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
          )}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.24em] text-white/85 backdrop-blur-md sm:text-[11px]">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-70 motion-reduce:hidden" />
              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
            </span>
            Resolution
          </span>
          <span
            aria-hidden
            className="font-mono text-xl font-semibold tracking-[0.04em] text-white/25 sm:text-2xl md:text-3xl lg:text-4xl"
          >
            3840 × 2160
          </span>
        </header>

        {/* IMAGE — centrée, scale-in à l'entrée */}
        <div className="flex flex-1 items-center justify-center py-6 sm:py-8 md:py-10">
          <div
            ref={imageRef}
            onPointerMove={handlePointerMove}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
            className={cn(
              "relative aspect-[16/9] w-full max-w-[1400px] overflow-hidden rounded-2xl ring-1 ring-white/15",
              "max-h-[min(62dvh,42rem)]",
              "shadow-[0_40px_120px_-30px_rgba(0,0,0,0.7)]",
              "transition-[transform,opacity,filter] duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform",
              "motion-reduce:transition-none motion-reduce:scale-100 motion-reduce:opacity-100 motion-reduce:blur-0",
              active
                ? "scale-100 opacity-100 blur-0"
                : "scale-[0.88] opacity-60 blur-[2px]",
              !isCoarse && "cursor-zoom-in"
            )}
          >
            <Image
              src="/4K.png"
              alt="Ultra-high resolution render at 4K"
              fill
              sizes="(max-width: 1400px) 100vw, 1400px"
              priority
              className="object-cover"
            />

            {/* Vignette douce pour profondeur */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.25))]"
            />

            {/* Loupe pixel-perfect */}
            {magnifier.visible && magnifier.w > 0 && !reduceMotion && (
              <div
                aria-hidden
                className={cn(
                  "pointer-events-none absolute z-10 rounded-full ring-2 ring-white/90",
                  "shadow-[0_12px_40px_rgba(0,0,0,0.45)]",
                  isCoarse
                    ? "transition-[left,top] duration-[400ms] ease-out"
                    : ""
                )}
                style={{
                  width: MAGNIFIER_SIZE,
                  height: MAGNIFIER_SIZE,
                  left: magnifier.x,
                  top: magnifier.y,
                  transform: "translate(-50%, -50%)",
                  backgroundImage: 'url("/4K.png")',
                  backgroundRepeat: "no-repeat",
                  backgroundSize: `${magnifier.w * ZOOM}px ${
                    magnifier.h * ZOOM
                  }px`,
                  backgroundPosition: `${
                    MAGNIFIER_SIZE / 2 - magnifier.x * ZOOM
                  }px ${MAGNIFIER_SIZE / 2 - magnifier.y * ZOOM}px`,
                }}
              >
                {/* Réticule */}
                <span
                  aria-hidden
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                >
                  <span className="block size-3 rounded-full border border-white/80" />
                </span>
                {/* Badge zoom */}
                <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-900 shadow-md sm:px-2.5 sm:py-1 sm:text-[10px]">
                  +{ZOOM * 100}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER — titre + description */}
        <footer
          className={cn(
            "max-w-3xl space-y-3 transition-all delay-200 duration-1000 ease-out sm:space-y-4",
            "motion-reduce:transition-none motion-reduce:translate-y-0 motion-reduce:opacity-100",
            active ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
          )}
        >
          <h2 className="text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
            Upgrade to <AuroraText>4K</AuroraText> quality
          </h2>
          <p className="max-w-xl text-pretty text-sm leading-relaxed text-white/65 sm:text-base md:text-lg">
            Ultra-high resolution renders that hold every detail, texture and reflection — even when you zoom in.
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40 sm:text-[11px]">
            {isCoarse ? "Watch the lens reveal the detail" : "Move your cursor to inspect →"}
          </p>
        </footer>
      </div>
    </section>
  );
}
