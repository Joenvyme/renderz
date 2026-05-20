"use client";

import { useState } from "react";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
  beforeObjectFit?: "cover" | "contain";
  afterObjectFit?: "cover" | "contain";
  hideLabels?: boolean;
}

export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = "Before",
  afterLabel = "After",
  className = "",
  beforeObjectFit = "cover",
  afterObjectFit = "cover",
  hideLabels = false,
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderPosition(parseInt(e.target.value, 10));
  };

  const updateFromClientX = (clientX: number, rect: DOMRect) => {
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    updateFromClientX(e.clientX, e.currentTarget.getBoundingClientRect());
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0) return;
    updateFromClientX(e.touches[0].clientX, e.currentTarget.getBoundingClientRect());
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0) return;
    updateFromClientX(e.touches[0].clientX, e.currentTarget.getBoundingClientRect());
  };

  // Utilise le même objectFit pour les deux images si l'un est "contain"
  const effectiveFit = beforeObjectFit === "contain" || afterObjectFit === "contain" ? "contain" : "cover";

  return (
    <div className={`relative w-full ${className}`}>
      {/* Container pour les deux images */}
      <div 
        className="relative aspect-[16/9] w-full touch-pan-x overflow-hidden rounded-[4px] border border-border/50 bg-muted/30 shadow-[0_8px_32px_rgba(0,0,0,0.06)]"
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        {/* Image "After" (en arrière-plan, visible à droite) */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("${afterImage}")`,
            backgroundSize: effectiveFit,
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />

        {/* Image "Before" (avec masque, visible à gauche) */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("${beforeImage}")`,
            backgroundSize: effectiveFit,
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
          }}
        />

        {/* Slider control */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10 pointer-events-none"
          style={{ left: `${sliderPosition}%` }}
        >
          {/* Handle circulaire */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-border">
            <div className="flex gap-0.5 sm:gap-1">
              <div className="w-0.5 h-0.5 sm:w-1 sm:h-1 bg-black rounded-full"></div>
              <div className="w-0.5 h-0.5 sm:w-1 sm:h-1 bg-black rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Input range invisible pour le contrôle */}
        <input
          type="range"
          min="0"
          max="100"
          value={sliderPosition}
          onChange={handleSliderChange}
          className="absolute inset-0 z-20 h-full w-full cursor-ew-resize opacity-0 touch-manipulation"
          aria-label="Before/After slider"
        />

        {/* Labels */}
        {!hideLabels && (
          <>
            <div className="absolute left-3 top-3 rounded-[2px] border border-white/20 bg-black/70 px-2 py-1 backdrop-blur-sm sm:left-4 sm:top-4 sm:px-3 sm:py-1.5">
              <span className="text-[10px] sm:text-xs font-mono text-white uppercase tracking-wider">
                {beforeLabel}
              </span>
            </div>
            <div className="absolute right-3 top-3 rounded-[2px] border border-white/20 bg-black/70 px-2 py-1 backdrop-blur-sm sm:right-4 sm:top-4 sm:px-3 sm:py-1.5">
              <span className="text-[10px] sm:text-xs font-mono text-white uppercase tracking-wider">
                {afterLabel}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
