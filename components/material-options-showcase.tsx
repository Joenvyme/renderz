"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

const MATERIAL_TILES = [
  { label: "Oak", src: "/compare-wood.png", alt: "Oak material variant" },
  { label: "Bright", src: "/compare-white.png", alt: "Bright material variant" },
  { label: "Scandi", src: "/compare-scandinave.png", alt: "Scandinavian material variant" },
  { label: "Walnut", src: "/compare-dark.png", alt: "Walnut material variant" },
] as const;

export function MaterialOptionsShowcase() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {MATERIAL_TILES.map((tile) => (
        <figure
          key={tile.src}
          className="group relative aspect-[3/4] overflow-hidden rounded-[6px]"
        >
          <Image
            src={tile.src}
            alt={tile.alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px"
            className={cn(
              "object-cover transition-transform duration-[400ms] ease-out motion-reduce:transition-none",
              "group-hover:scale-[1.04] motion-reduce:group-hover:scale-100"
            )}
          />
          <figcaption className="absolute bottom-3 left-3 rounded-[2px] bg-black/50 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-white backdrop-blur-sm">
            {tile.label}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
