"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

type StepConfig = {
  id: string;
  index: string;
  title: string;
  caption: string;
};

const STEPS: StepConfig[] = [
  {
    id: "upload",
    index: "01",
    title: "Upload any input",
    caption: "Floor plans, 3D models, sketches, or photos",
  },
  {
    id: "describe",
    index: "02",
    title: "Describe",
    caption: "Type the look in any language",
  },
  {
    id: "present",
    index: "03",
    title: "Present",
    caption: "Get a client-ready render in ~30s",
  },
];

const INPUT_STACK = [
  { src: "/Hero image – 1.png", alt: "Floor plan", offset: -14, rotate: -10 },
  { src: "/interior-nothing.png", alt: "3D model", offset: -5, rotate: -4 },
  { src: "/exemple-draw.png", alt: "Sketch", offset: 5, rotate: 4 },
  { src: "/Hero image – 7.png", alt: "Site photo", offset: 14, rotate: 10 },
] as const;

const DESCRIBE_PROMPT = "Warm oak, Calacatta marble, late afternoon light";

function InputStackVisual() {
  return (
    <div className="relative mx-auto flex h-[200px] w-full max-w-[280px] items-center justify-center sm:h-[220px]">
      {INPUT_STACK.map((item, i) => (
        <div
          key={item.src}
          className="absolute top-1/2 h-[168px] w-[108px] overflow-hidden rounded-[6px] border border-border/60 bg-white shadow-[0_12px_40px_-24px_rgba(0,0,0,0.2)]"
          style={{
            left: `calc(50% + ${item.offset}px)`,
            zIndex: i + 1,
            transform: `translate(-50%, -50%) rotate(${item.rotate}deg)`,
          }}
        >
          <Image
            src={item.src}
            alt={item.alt}
            fill
            className="object-cover"
            sizes="120px"
          />
        </div>
      ))}
    </div>
  );
}

function DescribeVisual() {
  return (
    <div
      aria-hidden
      className="pointer-events-none mx-auto flex min-h-[200px] w-full max-w-[300px] select-none items-center sm:min-h-[220px]"
    >
      <div className="relative w-full rounded-[6px] border border-border/60 bg-muted/20 px-4 py-3.5 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.12)] sm:px-5 sm:py-4">
        <p className="text-left text-sm leading-relaxed text-foreground sm:text-[15px]">
          {DESCRIBE_PROMPT}
          <span className="ml-0.5 inline-block h-[1.1em] w-px animate-pulse bg-foreground/70 align-middle" />
        </p>
        <span
          aria-hidden
          className="absolute -bottom-[5px] left-5 size-2.5 rotate-45 border-b border-r border-border/60 bg-muted/20"
        />
      </div>
    </div>
  );
}

function PresentVisual() {
  return (
    <article className="relative mx-auto h-[200px] w-full max-w-[300px] overflow-hidden rounded-[6px] border border-border/60 bg-white shadow-[0_12px_40px_-24px_rgba(0,0,0,0.2)] sm:h-[220px]">
      <Image
        src="/exemple-render.jpeg"
        alt="Photoreal kitchen render"
        fill
        className="object-cover"
        sizes="300px"
      />
      <div className="absolute left-2 top-2 rounded-[2px] border border-white/25 bg-black/55 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-white backdrop-blur-sm sm:left-3 sm:top-3 sm:text-[10px]">
        AI render
      </div>
    </article>
  );
}

const VISUALS: Record<string, () => JSX.Element> = {
  upload: InputStackVisual,
  describe: DescribeVisual,
  present: PresentVisual,
};

function HowItWorksStep({ step, className }: { step: StepConfig; className?: string }) {
  const Visual = VISUALS[step.id];

  return (
    <article
      className={cn(
        "flex min-w-0 flex-col rounded-[6px] border border-border/50 bg-white/50 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-xl sm:p-6",
        className
      )}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/70 sm:text-[11px]">
        {step.index} · {step.title}
      </p>

      <div className="mt-5 flex flex-1 items-center justify-center sm:mt-6">
        <Visual />
      </div>

      <p className="mt-4 text-center text-sm leading-relaxed text-muted-foreground sm:mt-5">
        {step.caption}
      </p>
    </article>
  );
}

/** Three steps: upload → describe → present (landing, below hero). */
export function HowItWorksShowcase({ className }: { className?: string }) {
  return (
    <div className={cn("mx-auto w-full min-w-0 max-w-5xl", className)}>
      <div className="grid gap-6 sm:gap-8 md:grid-cols-3 md:gap-6 lg:gap-8">
        {STEPS.map((step) => (
          <HowItWorksStep key={step.id} step={step} />
        ))}
      </div>
    </div>
  );
}
