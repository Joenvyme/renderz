"use client";

import { cn } from "@/lib/utils";

interface AuroraTextProps {
  children: React.ReactNode;
  className?: string;
}

export function AuroraText({ children, className }: AuroraTextProps) {
  return (
    <span
      className={cn(
        "relative inline-block bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-400 bg-clip-text text-transparent animate-aurora bg-[length:200%_auto] pb-2",
        className
      )}
    >
      {children}
    </span>
  );
}

