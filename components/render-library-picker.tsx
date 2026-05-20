"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, ArrowLeft, Images, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const IMAGE_PICKER_GRID =
  "grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7";
const IMAGE_PICKER_TILE =
  "relative aspect-square overflow-hidden rounded-[6px] border bg-muted/15 transition-all";
const IMAGE_PICKER_TILE_SELECTED =
  "border-foreground ring-2 ring-foreground/30";
const IMAGE_PICKER_TILE_DEFAULT =
  "border-border/70 hover:border-foreground/40 hover:shadow-sm";

export interface LibraryRender {
  id: string;
  generated_image_url: string | null;
  upscaled_image_url: string | null;
  status: string;
  created_at: string;
  prompt: string | null;
}

export function getRenderPreviewUrl(render: {
  generated_image_url: string | null;
  upscaled_image_url: string | null;
}): string | null {
  if (
    render.upscaled_image_url &&
    render.upscaled_image_url !== render.generated_image_url
  ) {
    return render.upscaled_image_url;
  }
  return render.generated_image_url;
}

interface RenderLibraryPickerProps {
  onBack?: () => void;
  onSelect: (render: LibraryRender) => void | Promise<void>;
  selectingId: string | null;
  disabled?: boolean;
  /** Intégré dans un panneau à onglets : pas de bouton retour. */
  embedded?: boolean;
  selectedUrls?: Set<string>;
}

export function RenderLibraryPicker({
  onBack,
  onSelect,
  selectingId,
  disabled = false,
  embedded = false,
  selectedUrls,
}: RenderLibraryPickerProps) {
  const [renders, setRenders] = useState<LibraryRender[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const fetchPage = useCallback(async (pageOffset: number, replace: boolean) => {
    if (pageOffset === 0) setLoading(true);
    else setLoadingMore(true);
    try {
      const params = new URLSearchParams({
        limit: "24",
        offset: String(pageOffset),
        status: "completed",
      });
      const res = await fetch(`/api/user/renders?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as {
        renders?: LibraryRender[];
        hasMore?: boolean;
        nextOffset?: number;
      };
      const batch = (data.renders ?? []).filter(
        (r) => r.status === "completed" && getRenderPreviewUrl(r)
      );
      setRenders((prev) => (replace ? batch : [...prev, ...batch]));
      setHasMore(Boolean(data.hasMore));
      setOffset(data.nextOffset ?? pageOffset + batch.length);
    } catch (err) {
      console.error("render library fetch:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void fetchPage(0, true);
  }, [fetchPage]);

  return (
    <div className={cn("flex flex-col", embedded ? "h-full min-h-0 flex-1" : "h-full min-h-[240px]")}>
      {!embedded && onBack && (
        <div className="mb-2 flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            disabled={disabled || Boolean(selectingId)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            aria-label="Retour"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          </button>
          <span className="text-xs font-medium text-foreground">Ma bibliothèque</span>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain touch-pan-y p-3 sm:p-4 [-webkit-overflow-scrolling:touch]">
        {loading && renders.length === 0 ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : renders.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 px-3 text-center">
            <Images className="h-6 w-6 text-muted-foreground/60" strokeWidth={1.5} />
            <p className="text-xs text-muted-foreground">
              Aucun rendu avec image disponible.
            </p>
          </div>
        ) : (
          <>
            <div className={IMAGE_PICKER_GRID}>
              {renders.map((render) => {
                const url = getRenderPreviewUrl(render)!;
                const isSelecting = selectingId === render.id;
                const selected = selectedUrls?.has(url) ?? false;
                return (
                  <button
                    key={render.id}
                    type="button"
                    disabled={disabled || Boolean(selectingId) || selected}
                    onClick={() => void onSelect(render)}
                    className={cn(
                      IMAGE_PICKER_TILE,
                      selected ? IMAGE_PICKER_TILE_SELECTED : IMAGE_PICKER_TILE_DEFAULT,
                      isSelecting && "ring-2 ring-black"
                    )}
                    title={render.prompt?.slice(0, 80) ?? "Rendu"}
                  >
                    <img
                      src={url}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    {selected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-foreground/55 text-background">
                        <Check className="h-5 w-5" strokeWidth={2.5} />
                      </div>
                    )}
                    {isSelecting && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {hasMore && (
              <div className="mt-2 flex justify-center pb-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={loadingMore || disabled || Boolean(selectingId)}
                  onClick={() => void fetchPage(offset, false)}
                  className="h-7 text-[11px]"
                >
                  {loadingMore ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Load more"
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
