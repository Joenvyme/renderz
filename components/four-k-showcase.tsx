"use client";

import * as React from "react";
import Image from "next/image";
import { AuroraText } from "@/components/ui/aurora-text";
import { cn } from "@/lib/utils";

const ZOOM = 3;
const MAGNIFIER_SIZE_DESKTOP = 176;
const MAGNIFIER_SIZE_MOBILE = 120;

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
  const [magnifierSize, setMagnifierSize] = React.useState(MAGNIFIER_SIZE_DESKTOP);
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
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const narrow = window.matchMedia("(max-width: 639px)").matches;
    setIsCoarse(coarse);
    setMagnifierSize(narrow ? MAGNIFIER_SIZE_MOBILE : MAGNIFIER_SIZE_DESKTOP);
    setReduceMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
    const onResize = () => {
      setMagnifierSize(
        window.matchMedia("(max-width: 639px)").matches
          ? MAGNIFIER_SIZE_MOBILE
          : MAGNIFIER_SIZE_DESKTOP
      );
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
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

      {/* Layout — même colonne que les sections landing (container + max-w-5xl) */}
      <div className="container relative mx-auto w-full min-w-0 px-3 sm:px-6">
        <div className="mx-auto flex w-full max-w-5xl flex-col justify-center gap-8 py-12 sm:gap-10 sm:py-16 md:min-h-[min(85dvh,48rem)] md:gap-12 md:py-20 lg:py-24">
          {/* IMAGE — pleine largeur de la colonne contenu */}
          <div
            ref={imageRef}
            onPointerMove={handlePointerMove}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
            className={cn(
              "relative aspect-[16/9] w-full overflow-hidden rounded-[6px] border border-white/15",
              "max-h-[min(50dvh,20rem)] sm:max-h-[min(58dvh,36rem)] md:max-h-[min(62dvh,42rem)]",
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
              sizes="(max-width: 1024px) 100vw, 1024px"
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
                  width: magnifierSize,
                  height: magnifierSize,
                  left: magnifier.x,
                  top: magnifier.y,
                  transform: "translate(-50%, -50%)",
                  backgroundImage: 'url("/4K.png")',
                  backgroundRepeat: "no-repeat",
                  backgroundSize: `${magnifier.w * ZOOM}px ${
                    magnifier.h * ZOOM
                  }px`,
                  backgroundPosition: `${
                    magnifierSize / 2 - magnifier.x * ZOOM
                  }px ${magnifierSize / 2 - magnifier.y * ZOOM}px`,
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

          {/* FOOTER — titre + description, aligné sur la même colonne */}
          <footer
            className={cn(
              "w-full space-y-3 transition-all delay-200 duration-1000 ease-out sm:space-y-4",
              "motion-reduce:transition-none motion-reduce:translate-y-0 motion-reduce:opacity-100",
              active ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
            )}
          >
          <h2 className="text-balance text-xl font-bold tracking-tight text-white sm:text-2xl md:text-4xl lg:text-5xl xl:text-6xl">
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
      </div>
    </section>
  );
}
