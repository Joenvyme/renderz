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
 * Carrousel de démos avant/après — vignettes + libellés au-dessus du slider.
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

  return (
    <div className="relative flex flex-col gap-4 sm:gap-6">
      {/* Vignettes + titres au-dessus */}
      <div
        role="tablist"
        aria-label="Slide navigation"
        className="mx-auto grid w-full max-w-2xl grid-cols-2 gap-x-2 gap-y-3 sm:max-w-none sm:grid-cols-4 sm:gap-x-3 sm:gap-y-0"
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
                "group flex flex-col items-stretch text-left transition-opacity duration-300 touch-manipulation",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                !isActive && "opacity-70 hover:opacity-100"
              )}
            >
              <span
                className={cn(
                  "relative aspect-[16/9] w-full overflow-hidden rounded-[4px] border transition-all duration-300 ease-out",
                  isActive
                    ? "border-foreground ring-2 ring-foreground ring-offset-1 ring-offset-white"
                    : "border-border/60 group-hover:border-foreground/35"
                )}
              >
                <Image
                  src={pair.afterImage}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 45vw, 180px"
                  className={cn(
                    "object-cover transition-transform duration-500 ease-out",
                    !isActive && "group-hover:scale-[1.03]"
                  )}
                />
              </span>
              <span
                className={cn(
                  "mt-2 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors sm:mt-2.5 sm:text-xs sm:tracking-[0.18em]",
                  isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground/80"
                )}
              >
                {pair.caption}
              </span>
            </button>
          );
        })}
      </div>

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
    </div>
  );
}
