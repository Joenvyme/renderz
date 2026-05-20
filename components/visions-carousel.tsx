"use client";

import * as React from "react";
import Image from "next/image";
import { BeforeAfterSlider } from "@/components/before-after-slider";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

type Pair = {
  id: string;
  beforeImage: string;
  afterImage: string;
  beforeLabel: string;
  afterLabel: string;
  caption: string;
};

const PAIRS: Pair[] = [
  {
    id: "plan-render",
    beforeImage: "/Hero image – 1.png",
    afterImage: "/Hero image – 2.png",
    beforeLabel: "Plan",
    afterLabel: "Render",
    caption: "Plan → Render",
  },
  {
    id: "photo-render",
    beforeImage: "/Hero image – 7.png",
    afterImage: "/Hero image – 8.png",
    beforeLabel: "Photo",
    afterLabel: "Render",
    caption: "Photo → Render",
  },
  {
    id: "empty-furnished",
    beforeImage: "/render-empty.png",
    afterImage: "/render-fourniture.png",
    beforeLabel: "Empty",
    afterLabel: "Furnished",
    caption: "Empty → Furnished",
  },
  {
    id: "render-augmented",
    beforeImage: "/augmented-render.png",
    afterImage: "/augmented-renderz.jpeg",
    beforeLabel: "Render",
    afterLabel: "Augmented",
    caption: "Render → Augmented",
  },
];

/**
 * Carrousel de démos avant/après — navigation par vignettes en dessous.
 *  - Chaque slide héberge un `<BeforeAfterSlider>` totalement interactif.
 *  - Embla : `watchDrag: false` pour ne pas entrer en conflit avec la
 *    poignée du slider interne.
 *  - Pas de flèches : navigation purement via les vignettes (cohérent
 *    avec le branding éditorial du reste de la landing).
 */
export function VisionsCarousel() {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  const total = PAIRS.length;
  const currentPair = PAIRS[current];

  return (
    <div className="relative">
      <Carousel
        setApi={setApi}
        opts={{
          loop: true,
          watchDrag: false,
          align: "center",
        }}
        className="w-full"
      >
        <CarouselContent>
          {PAIRS.map((pair) => (
            <CarouselItem key={pair.id} className="basis-full">
              <BeforeAfterSlider
                beforeImage={pair.beforeImage}
                afterImage={pair.afterImage}
                beforeLabel={pair.beforeLabel}
                afterLabel={pair.afterLabel}
                className="w-full"
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Caption — pagination + slide title */}
      <p
        key={currentPair?.id}
        className="mt-5 animate-in fade-in-50 text-center font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground duration-500 sm:mt-6 sm:text-xs"
      >
        <span className="text-foreground">
          {String(current + 1).padStart(2, "0")}
        </span>
        <span className="mx-2 text-foreground/30">/</span>
        <span>{String(total).padStart(2, "0")}</span>
        <span className="mx-3 text-foreground/30">·</span>
        <span>{currentPair?.caption}</span>
      </p>

      {/* Thumbnails — navigation principale */}
      <div
        role="tablist"
        aria-label="Slide navigation"
        className="mx-auto mt-4 grid max-w-2xl grid-cols-4 gap-2 sm:mt-6 sm:gap-3"
      >
        {PAIRS.map((pair, i) => {
          const isActive = current === i;
          return (
            <button
              key={pair.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`vision-slide-${pair.id}`}
              aria-label={`Show ${pair.caption}`}
              onClick={() => api?.scrollTo(i)}
              className={cn(
                "group relative aspect-[16/9] overflow-hidden rounded-md transition-all duration-300 ease-out",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                isActive
                  ? "ring-2 ring-foreground ring-offset-2 ring-offset-white"
                  : "opacity-55 ring-1 ring-border/50 hover:opacity-100 hover:ring-foreground/40"
              )}
            >
              <Image
                src={pair.afterImage}
                alt={`Slide ${i + 1}: ${pair.caption}`}
                fill
                sizes="(max-width: 768px) 25vw, 160px"
                className={cn(
                  "object-cover transition-transform duration-500 ease-out",
                  !isActive && "group-hover:scale-[1.04]"
                )}
              />

              {/* Indicateur numérique en haut-gauche, plus marqué quand actif */}
              <span
                aria-hidden
                className={cn(
                  "absolute left-1 top-1 rounded-[2px] px-1 py-0.5 font-mono text-[8.5px] uppercase tracking-wider backdrop-blur-sm transition-colors sm:left-1.5 sm:top-1.5 sm:px-1.5 sm:text-[9px]",
                  isActive
                    ? "bg-foreground text-white"
                    : "bg-black/45 text-white/90"
                )}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
