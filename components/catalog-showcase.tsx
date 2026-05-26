"use client";

import Image from "next/image";
import { Plus, ArrowRight } from "lucide-react";
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
    <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-12 md:items-center md:gap-10 lg:gap-14">
      {/* Rendu — premier sur mobile, colonne droite sur desktop */}
      <div className="order-1 md:order-2 md:col-span-7 lg:col-span-7">
        <GlowBorder duration={9} className="w-full max-w-full rounded-[12px] sm:rounded-[18px]">
          <div className="relative aspect-[16/10] overflow-hidden rounded-[10px] border border-border/60 bg-white shadow-[0_20px_60px_-30px_rgba(0,0,0,0.25)] sm:rounded-[16px]">
            <Image
              src="/interior-full.png"
              alt="Interior render with catalog items integrated"
              fill
              sizes="(max-width: 768px) 100vw, 60vw"
              className="object-cover"
            />

            <div className="absolute bottom-2 left-2 inline-flex max-w-[calc(100%-1rem)] items-center gap-1.5 rounded-full bg-black/65 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-white backdrop-blur-md sm:bottom-4 sm:left-4 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-[11px] sm:tracking-[0.18em]">
              <span className="relative flex size-1.5 shrink-0">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
              </span>
              <span className="truncate sm:hidden">3 catalog items</span>
              <span className="hidden truncate sm:inline">Generated with 3 catalog items</span>
            </div>

            <div className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/85 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-foreground/70 backdrop-blur-md sm:right-4 sm:top-4 sm:px-2.5 sm:py-1 sm:text-[11px] sm:tracking-[0.18em]">
              <span className="size-1 rounded-full bg-foreground/60" />
              Photoreal
            </div>
          </div>
        </GlowBorder>

        <p className="mt-2 text-center font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground sm:mt-4 sm:text-[11px] sm:tracking-[0.22em] md:text-left">
          One prompt · Your products · A staged scene
        </p>
      </div>

      {/* Texte + cartes — sous le rendu sur mobile, colonne gauche sur desktop */}
      <div className="order-2 md:order-1 md:col-span-5 lg:col-span-5">
        <div className="space-y-3 text-center md:text-left">
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
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground sm:mt-5 sm:text-[11px] sm:tracking-[0.18em] md:justify-start">
          <span className="inline-flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]" />
            Selected · Rendering in context
          </span>
          <ArrowRight className="size-3 shrink-0" strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
}

function CatalogCard({ item, index }: { item: CatalogItem; index: number }) {
  return (
    <div
      role="listitem"
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[4px] border border-border/60 bg-white sm:rounded-[6px]",
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
        <p className="hidden truncate font-mono text-[8.5px] tracking-wider text-muted-foreground/70 sm:block sm:text-[10px]">
          #{String(index + 1).padStart(2, "0")} · {item.ref}
        </p>
      </div>
    </div>
  );
}
