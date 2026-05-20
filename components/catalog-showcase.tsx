"use client";

import Image from "next/image";
import { Plus, Sparkles, ArrowRight } from "lucide-react";
import { GlowBorder } from "@/components/ui/glow-border";
import { AuroraText } from "@/components/ui/aurora-text";
import { cn } from "@/lib/utils";

type CatalogItem = {
  src: string;
  name: string;
  category: string;
  ref: string;
};

const CATALOG_ITEMS: CatalogItem[] = [
  {
    src: "/chair.png",
    name: "Lounge Chair",
    category: "Seating",
    ref: "VG-12384",
  },
  {
    src: "/table.png",
    name: "Coffee Table",
    category: "Tables",
    ref: "SO-08217",
  },
  {
    src: "/rug.png",
    name: "Patterned Rug",
    category: "Textiles",
    ref: "TR-44091",
  },
];

/**
 * Showcase de la fonctionnalité "Catalog → Render" :
 *  - Colonne gauche  : header + 3 cartes catalogue (chair, table, rug).
 *  - Colonne droite  : grand rendu (interior-full.png) avec glow border et badge contextuel.
 *  - Sur mobile      : empilé (header → cartes en grille 3 col → rendu en grand).
 */
export function CatalogShowcase() {
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-center md:gap-10 lg:gap-14">
      {/* LEFT — header + catalogue */}
      <div className="md:col-span-5 lg:col-span-5">
        <div className="space-y-3 text-center md:text-left">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-white/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/70 shadow-[0_2px_12px_rgba(0,0,0,0.04)] backdrop-blur-xl sm:text-[11px]">
            <Sparkles className="size-3" strokeWidth={2.5} />
            Furniture Catalog
          </span>

          <h2 className="text-balance text-2xl font-bold tracking-tight text-black sm:text-3xl md:text-4xl lg:text-5xl">
            Furnish from your <AuroraText>catalog</AuroraText>
          </h2>

          <p className="mx-auto max-w-md text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base lg:text-lg md:mx-0">
            Drop your real products into any render. Furniture, textures, décor — photoreal, contextual, ready to sell.
          </p>
        </div>

        {/* Catalog grid 3 cards */}
        <div
          role="list"
          aria-label="Catalog items featured in the render"
          className="mt-6 grid grid-cols-3 gap-2.5 sm:mt-8 sm:gap-3 lg:gap-4"
        >
          {CATALOG_ITEMS.map((item, idx) => (
            <CatalogCard key={item.ref} item={item} index={idx} />
          ))}
        </div>

        {/* Hint sous les cartes */}
        <div className="mt-5 flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:text-[11px] md:justify-start">
          <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]" />
          Selected · Rendering in context
          <ArrowRight className="size-3" strokeWidth={2.5} />
        </div>
      </div>

      {/* RIGHT — rendu final */}
      <div className="md:col-span-7 lg:col-span-7">
        <GlowBorder duration={9} className="rounded-[18px]">
          <div className="relative aspect-[16/10] overflow-hidden rounded-[16px] border border-border/60 bg-white shadow-[0_20px_60px_-30px_rgba(0,0,0,0.25)]">
            <Image
              src="/interior-full.png"
              alt="Interior render with catalog items integrated"
              fill
              sizes="(max-width: 768px) 100vw, 60vw"
              className="object-cover"
            />

            {/* Badge contextuel bas-gauche */}
            <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-black/65 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-white backdrop-blur-md sm:bottom-4 sm:left-4 sm:text-[11px]">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
              </span>
              Generated with 3 catalog items
            </div>

            {/* Watermark photoreal en haut droite */}
            <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/70 backdrop-blur-md sm:right-4 sm:top-4 sm:text-[11px]">
              <span className="size-1 rounded-full bg-foreground/60" />
              Photoreal
            </div>
          </div>
        </GlowBorder>

        {/* Caption sous le rendu */}
        <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground sm:mt-4 sm:text-[11px] md:text-left">
          One prompt · Your products · A staged scene
        </p>
      </div>
    </div>
  );
}

function CatalogCard({ item, index }: { item: CatalogItem; index: number }) {
  return (
    <div
      role="listitem"
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border/60 bg-white",
        "transition-all duration-300 will-change-transform",
        "hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-[0_10px_30px_-12px_rgba(0,0,0,0.18)]"
      )}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted/30">
        <Image
          src={item.src}
          alt={item.name}
          fill
          sizes="(max-width: 768px) 30vw, 160px"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        {/* "+" badge — vert quand "ajouté au rendu" */}
        <div
          aria-hidden
          className="absolute right-1.5 top-1.5 inline-flex size-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_2px_8px_rgba(16,185,129,0.45)] sm:size-6"
        >
          <Plus className="size-3 sm:size-3.5" strokeWidth={2.75} />
        </div>
      </div>

      {/* Meta */}
      <div className="space-y-0.5 px-2 py-2 sm:px-2.5 sm:py-2.5">
        <p className="truncate font-mono text-[8.5px] uppercase tracking-[0.18em] text-muted-foreground sm:text-[10px]">
          {item.category}
        </p>
        <p className="truncate text-xs font-semibold tracking-tight text-foreground sm:text-sm">
          {item.name}
        </p>
        <p className="truncate font-mono text-[8.5px] tracking-wider text-muted-foreground/70 sm:text-[10px]">
          #{String(index + 1).padStart(2, "0")} · {item.ref}
        </p>
      </div>
    </div>
  );
}
