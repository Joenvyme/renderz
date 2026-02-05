"use client";

import React, { forwardRef, useRef } from "react";
import { FileCode, Code2, Database, Webhook, FileJson, FileText } from "lucide-react";

import { cn } from "@/lib/utils";
import { AnimatedBeam } from "@/components/magicui/animated-beam";

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-20 flex size-12 sm:size-14 lg:size-16 items-center justify-center rounded-full border-2 bg-white p-2 sm:p-2.5 lg:p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
        className
      )}
    >
      {children}
    </div>
  );
});

Circle.displayName = "Circle";

export function AnimatedBeamDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const div1Ref = useRef<HTMLDivElement>(null);
  const div2Ref = useRef<HTMLDivElement>(null);
  const div3Ref = useRef<HTMLDivElement>(null);
  const div4Ref = useRef<HTMLDivElement>(null);
  const div5Ref = useRef<HTMLDivElement>(null);
  const div6Ref = useRef<HTMLDivElement>(null);
  const div7Ref = useRef<HTMLDivElement>(null);

  return (
    <div
      className="relative flex w-full aspect-[16/6] sm:aspect-[16/5] items-center justify-center overflow-hidden py-2 sm:py-3 px-10"
      ref={containerRef}
    >
      <div className="flex size-full max-w-4xl flex-col items-stretch justify-between gap-0.5 sm:gap-1 lg:gap-1.5">
        <div className="flex flex-row items-center justify-between">
          <Circle ref={div1Ref}>
            <FileJson className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" />
          </Circle>
          <Circle ref={div5Ref}>
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-orange-600" />
          </Circle>
        </div>
        <div className="flex flex-row items-center justify-between">
          <Circle ref={div2Ref}>
            <Code2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-purple-600" />
          </Circle>
          <Circle ref={div4Ref} className="size-20 sm:size-24 lg:size-28">
            <div className="flex items-center justify-center w-full h-full">
              <span className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tighter" style={{ fontFamily: "'Funnel Display', system-ui, sans-serif", letterSpacing: '-0.05em' }}>
                RDZ
              </span>
            </div>
          </Circle>
          <Circle ref={div6Ref}>
            <Webhook className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-600" />
          </Circle>
        </div>
        <div className="flex flex-row items-center justify-between">
          <Circle ref={div3Ref}>
            <Database className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-cyan-600" />
          </Circle>
          <Circle ref={div7Ref}>
            <FileCode className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-pink-600" />
          </Circle>
        </div>
      </div>

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div1Ref}
        toRef={div4Ref}
        curvature={-75}
        endYOffset={-10}
        gradientStartColor="#ffaa40"
        gradientStopColor="#9c40ff"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div2Ref}
        toRef={div4Ref}
        gradientStartColor="#ffaa40"
        gradientStopColor="#9c40ff"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div3Ref}
        toRef={div4Ref}
        curvature={75}
        endYOffset={10}
        gradientStartColor="#ffaa40"
        gradientStopColor="#9c40ff"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div5Ref}
        toRef={div4Ref}
        curvature={-75}
        endYOffset={-10}
        reverse
        gradientStartColor="#ffaa40"
        gradientStopColor="#9c40ff"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div6Ref}
        toRef={div4Ref}
        reverse
        gradientStartColor="#ffaa40"
        gradientStopColor="#9c40ff"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div7Ref}
        toRef={div4Ref}
        curvature={75}
        endYOffset={10}
        reverse
        gradientStartColor="#ffaa40"
        gradientStopColor="#9c40ff"
      />
    </div>
  );
}
