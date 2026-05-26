"use client";

import {
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Upload,
  Sparkles,
  ArrowRight,
  X,
  Plus,
  Sofa,
  FolderOpen,
  ImagePlus,
  SlidersHorizontal,
  Check,
  Trash2,
  Library,
  ChevronRight,
  Home,
  Search,
  Folder,
  Images,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { FurnitureCatalog } from "@/components/furniture-catalog";
import {
  RenderLibraryPicker,
  getRenderPreviewUrl,
  type LibraryRender,
} from "@/components/render-library-picker";
import { useSession } from "@/lib/auth-client";
import {
  ASPECT_RATIOS,
  AspectRatio,
  DEFAULT_IMAGE_OUTPUT_SIZE,
  IMAGE_OUTPUT_SIZES,
  ImageOutputSize,
  ImageRole,
  MAX_INPUT_IMAGES,
  isValidImageOutputSize,
} from "@/lib/api/gemini-image-config";
import { LANDING_RENDER_FORM_STORAGE_KEYS } from "@/lib/landing-render-form-storage";
import {
  type GenerationPipeline,
  type MagnificScaleFactor,
  MAGNIFIC_SCALE_FACTORS,
  clampMagnificStyleValue,
  parseGenerationPipeline,
} from "@/lib/generation-pipeline";
import { cn } from "@/lib/utils";
import { VisibilityChip } from "@/components/visibility-chip";

/** Grille unifiée : uploads, rendus et catalogue dans le sélecteur d’images. */
const IMAGE_PICKER_GRID =
  "grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7";
const IMAGE_PICKER_TILE =
  "relative aspect-square overflow-hidden rounded-[6px] border bg-muted/15 transition-all";
const IMAGE_PICKER_TILE_SELECTED =
  "border-foreground ring-2 ring-foreground/30";
const IMAGE_PICKER_TILE_DEFAULT =
  "border-border/70 hover:border-foreground/40 hover:shadow-sm";

const IMAGE_PICKER_PAGE_SIZE = 24;

interface UploadedImageItem {
  id: string;
  dataUrl: string;
}

function normalizeStoredImages(raw: unknown): UploadedImageItem[] {
  if (!Array.isArray(raw)) return [];
  const out: UploadedImageItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const o = entry as { id?: string; dataUrl?: string; url?: string };
    const dataUrl =
      typeof o.dataUrl === "string"
        ? o.dataUrl
        : typeof o.url === "string"
          ? o.url
          : "";
    if (!dataUrl) continue;
    out.push({
      id:
        typeof o.id === "string" && o.id
          ? o.id
          : `img-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      dataUrl,
    });
  }
  return out;
}

/** Rôle API dérivé uniquement de la position (1 → main, 2 → style, 3+ → reference). */
function apiRoleForImageIndex(index: number): ImageRole {
  if (index === 0) return "main";
  if (index === 1) return "style";
  return "reference";
}

const UPLOAD_PREVIEW_MAX_EDGE = 2048;
const UPLOAD_JPEG_QUALITY = 0.82;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(file);
  });
}

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read preview."));
    reader.readAsDataURL(blob);
  });
}

/**
 * Photos caméra (surtout HEIC iOS) : `new Image(dataUrl)` échoue souvent alors que
 * `createImageBitmap(file)` décode correctement via le pipeline du navigateur.
 */
async function tryCompressFileToJpegBlob(
  file: File,
  maxEdge: number,
  quality: number
): Promise<Blob | null> {
  try {
    const bmp = await createImageBitmap(file);
    const w = bmp.width;
    const h = bmp.height;
    if (!w || !h) {
      bmp.close();
      return null;
    }
    const scale = Math.min(1, maxEdge / Math.max(w, h));
    const tw = Math.max(1, Math.round(w * scale));
    const th = Math.max(1, Math.round(h * scale));
    const canvas = document.createElement("canvas");
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bmp.close();
      return null;
    }
    ctx.drawImage(bmp, 0, 0, tw, th);
    bmp.close();
    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality);
    });
  } catch {
    return null;
  }
}

async function fileToPreviewDataUrl(file: File): Promise<string> {
  const compressed = await tryCompressFileToJpegBlob(
    file,
    UPLOAD_PREVIEW_MAX_EDGE,
    UPLOAD_JPEG_QUALITY
  );
  if (compressed && compressed.size > 0) {
    return readBlobAsDataUrl(compressed);
  }
  return readFileAsDataUrl(file);
}

function isProbablyImageFile(f: File): boolean {
  const t = (f.type || "").toLowerCase();
  if (t.startsWith("image/")) return true;
  if (!t && /\.(jpe?g|png|webp|heic|heif|gif|bmp|tif?f)$/i.test(f.name)) return true;
  return false;
}

/** Réduit poids / côté max avant Supabase (photos galerie > 10 Mo en data URL). */
async function tryCompressDataUrlToJpegBlob(
  dataUrl: string,
  maxEdge: number,
  quality: number
): Promise<Blob | null> {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode"));
      el.src = dataUrl;
    });
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (!w || !h) return null;
    const scale = Math.min(1, maxEdge / Math.max(w, h));
    const tw = Math.max(1, Math.round(w * scale));
    const th = Math.max(1, Math.round(h * scale));
    const canvas = document.createElement("canvas");
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, tw, th);
    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality);
    });
  } catch {
    return null;
  }
}

/** Blob typé + extension cohérente (Safari laisse souvent blob.type vide après fetch(data:…)). */
async function blobFromDataUrlForUpload(
  dataUrl: string,
  index: number
): Promise<{ blob: Blob; filename: string }> {
  const header = /^data:([^;,]*)/i.exec(dataUrl);
  let mime = (header?.[1] ?? "").trim().toLowerCase();
  if (!mime || mime === "application/octet-stream" || !mime.startsWith("image/")) {
    mime = "image/jpeg";
  }
  const ext = mime.includes("png")
    ? "png"
    : mime.includes("webp")
      ? "webp"
      : mime.includes("heic") || mime.includes("heif")
        ? "heic"
        : "jpg";

  const res = await fetch(dataUrl);
  const buf = await res.arrayBuffer();
  const blob = new Blob([buf], { type: mime });
  return { blob, filename: `image-${index + 1}.${ext}` };
}

/** Préfère JPEG redimensionné pour rester sous la limite d’upload ; repli sur le data URL brut. */
async function blobForUploadFromDataUrl(
  dataUrl: string,
  index: number
): Promise<{ blob: Blob; filename: string }> {
  const compressed = await tryCompressDataUrlToJpegBlob(
    dataUrl,
    UPLOAD_PREVIEW_MAX_EDGE,
    UPLOAD_JPEG_QUALITY
  );
  if (compressed && compressed.size > 0) {
    return { blob: compressed, filename: `image-${index + 1}.jpg` };
  }
  return blobFromDataUrlForUpload(dataUrl, index);
}

function Magnific3DControls({
  magnificScale,
  setMagnificScale,
  magnificResemblanceValue,
  setMagnificResemblanceValue,
  magnificCreativityValue,
  setMagnificCreativityValue,
  compact,
}: {
  magnificScale: MagnificScaleFactor;
  setMagnificScale: (v: MagnificScaleFactor) => void;
  magnificResemblanceValue: number;
  setMagnificResemblanceValue: (v: number) => void;
  magnificCreativityValue: number;
  setMagnificCreativityValue: (v: number) => void;
  compact: boolean;
}) {
  const labelCls = compact
    ? "mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
    : "mb-1 block text-xs font-mono uppercase tracking-wider text-muted-foreground";
  const scaleBtn = (v: MagnificScaleFactor) =>
    compact ? (
      <button
        key={v}
        type="button"
        onClick={() => setMagnificScale(v)}
        className={cn(
          "min-w-0 flex-1 rounded-[4px] border py-1 text-[10px] font-semibold tabular-nums transition-colors",
          magnificScale === v
            ? "border-foreground bg-foreground text-background"
            : "border-border/70 bg-white/60 text-muted-foreground hover:text-foreground"
        )}
      >
        {v}×
      </button>
    ) : (
      <button
        key={v}
        type="button"
        onClick={() => setMagnificScale(v)}
        className={cn(
          "border-2 p-2 text-center transition-all duration-200",
          magnificScale === v
            ? "border-primary bg-primary/10"
            : "border-border hover:border-primary/50"
        )}
      >
        <div className="text-[10px] font-mono font-bold sm:text-xs">{v}×</div>
      </button>
    );

  return (
    <div className={compact ? "mb-2.5 space-y-2.5" : "space-y-3 rounded border border-border/60 bg-muted/20 p-3"}>
      <div>
        <span className={labelCls}>Upscale</span>
        <div className={compact ? "flex gap-1" : "grid grid-cols-4 gap-1.5 sm:gap-2"}>
          {MAGNIFIC_SCALE_FACTORS.map(scaleBtn)}
        </div>
      </div>
      <div>
        <span className={labelCls}>Resemblance</span>
        <div
          className={
            compact
              ? "mb-1 flex items-center justify-between text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
              : "flex items-center justify-between text-xs font-mono uppercase tracking-wider"
          }
        >
          <span>Value</span>
          <span className="tabular-nums text-foreground">
            {magnificResemblanceValue > 0 ? `+${magnificResemblanceValue}` : magnificResemblanceValue}
          </span>
        </div>
        <input
          type="range"
          min={-10}
          max={10}
          step={1}
          value={magnificResemblanceValue}
          onChange={(e) => setMagnificResemblanceValue(Number(e.target.value))}
          className="h-2 w-full cursor-pointer accent-black"
        />
        <div
          className={
            compact
              ? "mt-0.5 flex justify-between text-[9px] text-muted-foreground"
              : "mt-0.5 flex justify-between text-[10px] text-muted-foreground font-mono"
          }
        >
          <span>−10</span>
          <span>+10</span>
        </div>
      </div>
      <div>
        <span className={labelCls}>Creativity</span>
        <div
          className={
            compact
              ? "mb-1 flex items-center justify-between text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
              : "flex items-center justify-between text-xs font-mono uppercase tracking-wider"
          }
        >
          <span>Value</span>
          <span className="tabular-nums text-foreground">
            {magnificCreativityValue > 0 ? `+${magnificCreativityValue}` : magnificCreativityValue}
          </span>
        </div>
        <input
          type="range"
          min={-10}
          max={10}
          step={1}
          value={magnificCreativityValue}
          onChange={(e) => setMagnificCreativityValue(Number(e.target.value))}
          className="h-2 w-full cursor-pointer accent-black"
        />
        <div
          className={
            compact
              ? "mt-0.5 flex justify-between text-[9px] text-muted-foreground"
              : "mt-0.5 flex justify-between text-[10px] text-muted-foreground font-mono"
          }
        >
          <span>−10</span>
          <span>+10</span>
        </div>
      </div>
    </div>
  );
}

interface CompactOptionsScrollableInnerProps {
  sourceKind: "plan_photo" | "render_3d";
  setSourceKind: (v: "plan_photo" | "render_3d") => void;
  magnificScale: MagnificScaleFactor;
  setMagnificScale: (v: MagnificScaleFactor) => void;
  magnificResemblanceValue: number;
  setMagnificResemblanceValue: (v: number) => void;
  magnificCreativityValue: number;
  setMagnificCreativityValue: (v: number) => void;
  projects?: ProjectOption[];
  selectedProjectId: string | null | undefined;
  onProjectChange?: (projectId: string | null) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (v: AspectRatio) => void;
  imageSize: ImageOutputSize;
  setImageSize: (v: ImageOutputSize) => void;
  onOpenCatalog: () => void;
  setShowCompactOptions: Dispatch<SetStateAction<boolean>>;
}

function CompactOptionsScrollableInner({
  sourceKind,
  setSourceKind,
  magnificScale,
  setMagnificScale,
  magnificResemblanceValue,
  setMagnificResemblanceValue,
  magnificCreativityValue,
  setMagnificCreativityValue,
  projects,
  selectedProjectId,
  onProjectChange,
  aspectRatio,
  setAspectRatio,
  imageSize,
  setImageSize,
  onOpenCatalog,
  setShowCompactOptions,
}: CompactOptionsScrollableInnerProps) {
  const planFieldsLocked = sourceKind === "render_3d";

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div className="grid grid-cols-1 gap-3 p-3 sm:gap-4 sm:p-4 md:grid-cols-2">
        <section className="rounded-[4px] border border-border/80 bg-muted/10 p-3">
          <div className="mb-4">
            <span className="mb-2 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Source
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setSourceKind("plan_photo")}
                className={cn(
                  "flex-1 rounded-[4px] border py-1.5 text-[11px] font-medium transition-colors",
                  sourceKind === "plan_photo"
                    ? "border-foreground bg-foreground text-background"
                    : "border-border/70 bg-white/60 text-muted-foreground hover:text-foreground"
                )}
              >
                Plan / photo
              </button>
              <button
                type="button"
                onClick={() => setSourceKind("render_3d")}
                className={cn(
                  "flex-1 rounded-[4px] border py-1.5 text-[11px] font-medium transition-colors",
                  sourceKind === "render_3d"
                    ? "border-foreground bg-foreground text-background"
                    : "border-border/70 bg-white/60 text-muted-foreground hover:text-foreground"
                )}
              >
                3D render
              </button>
            </div>
          </div>
          <div className={cn(planFieldsLocked && "pointer-events-none opacity-[0.38]")}>
            <span className="mb-2 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Format
            </span>
            <div className="flex flex-wrap gap-1">
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio.value}
                  type="button"
                  onClick={() => setAspectRatio(ratio.value)}
                  className={cn(
                    "rounded-[4px] border px-2 py-1 text-[11px] font-medium transition-colors",
                    aspectRatio === ratio.value
                      ? "border-foreground bg-foreground text-background"
                      : "border-border/70 bg-white/60 text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  )}
                >
                  {ratio.value}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[4px] border border-border/80 bg-muted/10 p-3">
          <div className={cn("space-y-4", planFieldsLocked && "pointer-events-none opacity-[0.38]")}>
            <div>
              <span className="mb-2 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Resolution
              </span>
              <div className="flex gap-1">
                {IMAGE_OUTPUT_SIZES.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setImageSize(opt.value)}
                    className={cn(
                      "flex-1 rounded-[4px] border py-1.5 text-[11px] font-medium transition-colors",
                      imageSize === opt.value
                        ? "border-foreground bg-foreground text-background"
                        : "border-border/70 bg-white/60 text-muted-foreground hover:text-foreground"
                    )}
                    title={`${opt.label} (${opt.hint})`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {projects && projects.length > 0 && (
              <div>
                <label className="mb-2 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Folder
                </label>
                <select
                  value={selectedProjectId || ""}
                  onChange={(e) => onProjectChange?.(e.target.value || null)}
                  className="h-9 w-full rounded-[4px] border border-border/80 bg-white/80 px-2 text-xs text-foreground"
                >
                  <option value="">No folder</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </section>

        {sourceKind === "render_3d" && (
          <section className="rounded-[4px] border border-border/80 bg-muted/10 p-3 md:col-span-2">
            <Magnific3DControls
              compact
              magnificScale={magnificScale}
              setMagnificScale={setMagnificScale}
              magnificResemblanceValue={magnificResemblanceValue}
              setMagnificResemblanceValue={setMagnificResemblanceValue}
              magnificCreativityValue={magnificCreativityValue}
              setMagnificCreativityValue={setMagnificCreativityValue}
            />
          </section>
        )}

      </div>
    </div>
  );
}

interface ProjectOption {
  id: string;
  name: string;
}

export interface AvailableSourceImage {
  id: string;
  url: string;
  createdAt?: string;
  visibility?: "private" | "organization";
  isMine?: boolean;
}

interface CompactGalleryPanelProps {
  onPickFiles: () => void;
  isDragging: boolean;
  setIsDragging: (v: boolean) => void;
  onDropFiles: (files: File[]) => void;
  galleryImages: AvailableSourceImage[];
  galleryLoading: boolean;
  galleryLoadingMore?: boolean;
  galleryHasMore?: boolean;
  onLoadMoreGallery?: () => void;
  uploadedImages: UploadedImageItem[];
  onPickGalleryImage: (img: AvailableSourceImage) => void;
  onDeleteGalleryImage: (img: AvailableSourceImage) => void;
  onToggleGalleryImageVisibility?: (
    img: AvailableSourceImage,
    next: "private" | "organization"
  ) => void;
  togglingImageIds?: Set<string>;
  deletingImageIds: Set<string>;
  remainingSlots: number;
}

function CompactGalleryPanel({
  onPickFiles,
  isDragging,
  setIsDragging,
  onDropFiles,
  galleryImages,
  galleryLoading,
  galleryLoadingMore = false,
  galleryHasMore = false,
  onLoadMoreGallery,
  uploadedImages,
  onPickGalleryImage,
  onDeleteGalleryImage,
  onToggleGalleryImageVisibility,
  togglingImageIds,
  deletingImageIds,
  remainingSlots,
}: CompactGalleryPanelProps) {
  const selectedUrls = new Set(uploadedImages.map((img) => img.dataUrl));

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <button
        type="button"
        onClick={onPickFiles}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const files = Array.from(e.dataTransfer.files);
          if (files.length) onDropFiles(files);
        }}
        className={cn(
          "group mx-3 mt-3 flex shrink-0 flex-col items-center justify-center gap-1.5 rounded-[6px] border border-dashed bg-white/60 px-3 py-3 text-center text-muted-foreground transition-colors sm:mx-4 sm:mt-4",
          "hover:border-foreground/40 hover:bg-muted/40 hover:text-foreground",
          isDragging ? "border-primary/60 bg-primary/5 text-foreground" : "border-border/80"
        )}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-border/70">
          <Upload className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <span className="text-[11px] font-medium leading-tight text-foreground">
          Upload a file{" "}
          <span className="text-muted-foreground">or drop here</span>
        </span>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground/80">
          JPG · PNG · HEIC · WEBP
        </span>
      </button>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col px-3 pb-3 pt-2 sm:px-4 sm:pb-4">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Your uploads
          </span>
          <span className="text-[10px] tabular-nums text-muted-foreground/80">
            {galleryImages.length}
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain touch-pan-y [-webkit-overflow-scrolling:touch]">
          {galleryLoading && galleryImages.length === 0 ? (
            <div className={IMAGE_PICKER_GRID}>
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square animate-pulse rounded-[6px] bg-muted/40"
                />
              ))}
            </div>
          ) : galleryImages.length === 0 ? (
            <div className="flex min-h-[100px] flex-col items-center justify-center gap-2 rounded-[6px] border border-dashed border-border/70 bg-muted/15 px-4 py-6 text-center">
              <ImagePlus className="h-5 w-5 text-muted-foreground/70" strokeWidth={1.5} />
              <p className="text-xs text-muted-foreground">
                No images uploaded yet.
              </p>
            </div>
          ) : (
            <>
              <div className={IMAGE_PICKER_GRID}>
                {galleryImages.map((img) => {
                  const selected = selectedUrls.has(img.url);
                  const disabledPick = !selected && remainingSlots <= 0;
                  const deleting = deletingImageIds.has(img.id);
                  return (
                    <div
                      key={img.id}
                      className={cn(
                        "group relative",
                        IMAGE_PICKER_TILE,
                        selected ? IMAGE_PICKER_TILE_SELECTED : IMAGE_PICKER_TILE_DEFAULT,
                        deleting && "pointer-events-none opacity-50"
                      )}
                    >
                      <img
                        src={img.url}
                        alt=""
                        className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                      <button
                        type="button"
                        disabled={disabledPick || deleting}
                        onClick={() => onPickGalleryImage(img)}
                        className={cn(
                          "absolute inset-0 z-[1] flex items-center justify-center bg-transparent outline-none transition-colors focus-visible:ring-2 focus-visible:ring-foreground/40",
                          selected && "bg-foreground/55 text-background",
                          disabledPick && "cursor-not-allowed"
                        )}
                        title={selected ? "Already selected" : "Add this image"}
                        aria-label={selected ? "Already selected" : "Add this image"}
                      >
                        {selected && <Check className="h-5 w-5" strokeWidth={2.5} />}
                      </button>
                      {img.isMine !== false && (
                        <button
                          type="button"
                          disabled={deleting}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteGalleryImage(img);
                          }}
                          className={cn(
                            "absolute right-1 top-1 z-[2] flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-white opacity-0 shadow-sm ring-1 ring-white/20 transition-opacity",
                            "hover:bg-red-600 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            "group-hover:opacity-100"
                          )}
                          title="Remove from gallery"
                          aria-label="Remove from gallery"
                        >
                          <Trash2 className="h-3 w-3" strokeWidth={2.25} />
                        </button>
                      )}
                      {img.visibility && (
                        <div className="absolute bottom-1 left-1 z-[2] opacity-0 transition-opacity group-hover:opacity-100">
                          <VisibilityChip
                            visibility={img.visibility}
                            loading={togglingImageIds?.has(img.id) ?? false}
                            canShare
                            compact
                            onToggle={
                              img.isMine !== false && onToggleGalleryImageVisibility
                                ? (next) => onToggleGalleryImageVisibility(img, next)
                                : undefined
                            }
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {galleryHasMore && onLoadMoreGallery && (
                <div className="mt-2 flex justify-center pb-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={galleryLoadingMore}
                    onClick={onLoadMoreGallery}
                    className="h-7 text-[11px]"
                  >
                    {galleryLoadingMore ? (
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
    </div>
  );
}

export interface CatalogFolderEntry {
  id: string;
  parent_id: string | null;
  name: string;
}

export interface CatalogItemEntry {
  id: string;
  folder_id: string | null;
  title: string;
  description: string | null;
  image_url: string | null;
}

interface CompactCatalogPanelProps {
  folders: CatalogFolderEntry[];
  items: CatalogItemEntry[];
  loading: boolean;
  currentFolderId: string | null;
  setCurrentFolderId: (id: string | null) => void;
  query: string;
  setQuery: (q: string) => void;
  uploadedImages: UploadedImageItem[];
  onPickItem: (item: CatalogItemEntry) => void;
  onOpenFullCatalog: () => void;
  remainingSlots: number;
}

function CompactCatalogPanel({
  folders,
  items,
  loading,
  currentFolderId,
  setCurrentFolderId,
  query,
  setQuery,
  uploadedImages,
  onPickItem,
  onOpenFullCatalog,
  remainingSlots,
}: CompactCatalogPanelProps) {
  const selectedUrls = new Set(uploadedImages.map((img) => img.dataUrl));
  const trimmedQuery = query.trim().toLowerCase();

  // Index parent → enfants pour la nav
  const childFolders = folders.filter((f) => f.parent_id === currentFolderId);

  // Items affichés : « All » = tout le catalogue ; dossier = items directs de ce dossier
  let visibleItems: CatalogItemEntry[] = items.filter((it) => {
    if (!trimmedQuery) {
      if (currentFolderId === null) {
        return true;
      }
      return it.folder_id === currentFolderId;
    }
    // Recherche globale : on cherche sur title + description, tous dossiers confondus
    const hay = `${it.title} ${it.description ?? ""}`.toLowerCase();
    return hay.includes(trimmedQuery);
  });

  // Dossiers affichés : filtrés par la recherche si présente, sinon enfants directs
  let visibleFolders: CatalogFolderEntry[] = childFolders;
  if (trimmedQuery) {
    visibleFolders = folders.filter((f) =>
      f.name.toLowerCase().includes(trimmedQuery)
    );
  }

  // Breadcrumbs
  const breadcrumbs: CatalogFolderEntry[] = [];
  {
    let cursor: string | null = currentFolderId;
    const safety = new Set<string>();
    while (cursor) {
      if (safety.has(cursor)) break;
      safety.add(cursor);
      const f = folders.find((x) => x.id === cursor);
      if (!f) break;
      breadcrumbs.unshift(f);
      cursor = f.parent_id;
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Header : breadcrumbs + recherche + accès catalogue complet */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border/60 bg-muted/15 px-3 py-2 sm:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto text-[12px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCurrentFolderId(null);
            }}
            className={cn(
              "flex shrink-0 items-center gap-1 rounded-[4px] px-1.5 py-1 transition-colors",
              currentFolderId === null && !trimmedQuery
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            )}
            title="Catalog root"
          >
            <Home className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span className="hidden sm:inline">All</span>
          </button>
          {breadcrumbs.map((f) => (
            <span key={f.id} className="flex shrink-0 items-center gap-1">
              <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/60" strokeWidth={2} />
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setCurrentFolderId(f.id);
                }}
                className={cn(
                  "shrink-0 rounded-[4px] px-1.5 py-1 transition-colors",
                  currentFolderId === f.id && !trimmedQuery
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                )}
                title={f.name}
              >
                <span className="max-w-[140px] truncate">{f.name}</span>
              </button>
            </span>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/70"
              strokeWidth={1.75}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="h-7 w-[140px] rounded-[4px] border border-border/70 bg-white/70 pl-6 pr-2 text-[12px] text-foreground placeholder:text-muted-foreground/70 focus:border-foreground/40 focus:outline-none focus:ring-0 sm:w-[180px]"
            />
          </div>
          <button
            type="button"
            onClick={onOpenFullCatalog}
            className="flex h-7 shrink-0 items-center gap-1 rounded-[4px] border border-border/70 bg-white/70 px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-muted/40 hover:text-foreground"
            title="Open full catalog"
          >
            <Library className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span className="hidden sm:inline">Manage</span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain touch-pan-y p-3 sm:p-4 [-webkit-overflow-scrolling:touch]">
        {loading && folders.length === 0 && items.length === 0 ? (
          <div className={IMAGE_PICKER_GRID}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square animate-pulse rounded-[6px] bg-muted/40"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {visibleFolders.length > 0 && (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {trimmedQuery ? "Matching folders" : "Subfolders"}
                  </span>
                  <span className="text-[10px] tabular-nums text-muted-foreground/80">
                    {visibleFolders.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {visibleFolders.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setCurrentFolderId(f.id);
                      }}
                      className="group flex items-center gap-2 rounded-[6px] border border-border/70 bg-white/60 px-2.5 py-2 text-left text-[12px] font-medium text-foreground transition-colors hover:border-foreground/40 hover:bg-muted/35"
                      title={`Open ${f.name}`}
                    >
                      <Folder
                        className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                        strokeWidth={1.75}
                      />
                      <span className="min-w-0 flex-1 truncate">{f.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {trimmedQuery ? "Matching items" : "Items"}
                </span>
                <span className="text-[10px] tabular-nums text-muted-foreground/80">
                  {visibleItems.length}
                </span>
              </div>
              {visibleItems.length === 0 ? (
                <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/70 bg-muted/15 px-4 py-8 text-center">
                  <Library className="h-5 w-5 text-muted-foreground/70" strokeWidth={1.5} />
                  <p className="text-xs text-muted-foreground">
                    {trimmedQuery
                      ? "No items match your search."
                      : currentFolderId === null
                        ? "No catalog items yet."
                        : "No items in this folder."}
                  </p>
                  <button
                    type="button"
                    onClick={onOpenFullCatalog}
                    className="mt-1 text-[11px] font-medium text-foreground underline-offset-2 hover:underline"
                  >
                    Open the catalog to add some
                  </button>
                </div>
              ) : (
                <div className={IMAGE_PICKER_GRID}>
                  {visibleItems.map((item) => {
                    const disabledNoImage = !item.image_url;
                    const selected = item.image_url ? selectedUrls.has(item.image_url) : false;
                    const disabledPick = disabledNoImage || (!selected && remainingSlots <= 0);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={disabledPick}
                        onClick={() => onPickItem(item)}
                        className={cn(
                          "group relative text-left",
                          IMAGE_PICKER_TILE,
                          selected ? IMAGE_PICKER_TILE_SELECTED : IMAGE_PICKER_TILE_DEFAULT,
                          disabledPick && "cursor-not-allowed opacity-60"
                        )}
                        title={
                          disabledNoImage
                            ? "No image for this item"
                            : selected
                              ? "Already added to render"
                              : item.title
                        }
                      >
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-muted/30 text-muted-foreground/60">
                            <ImagePlus className="h-5 w-5" strokeWidth={1.5} />
                          </div>
                        )}
                        {selected && (
                          <div className="absolute inset-0 flex items-center justify-center bg-foreground/55 text-background">
                            <Check className="h-5 w-5" strokeWidth={2.5} />
                          </div>
                        )}
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 pb-1 pt-4">
                          <span className="line-clamp-2 text-[10px] font-medium leading-tight text-white">
                            {item.title}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export type ImagePickerTab = "uploads" | "renders" | "catalog";

interface CompactImagePickerPanelProps {
  tab: ImagePickerTab;
  onTabChange: (tab: ImagePickerTab) => void;
  uploads: CompactGalleryPanelProps;
  catalog: CompactCatalogPanelProps;
  onPickRender: (render: LibraryRender) => void | Promise<void>;
  selectingRenderId: string | null;
  pickerDisabled?: boolean;
}

function CompactImagePickerPanel({
  tab,
  onTabChange,
  uploads,
  catalog,
  onPickRender,
  selectingRenderId,
  pickerDisabled = false,
}: CompactImagePickerPanelProps) {
  const selectedUrls = new Set(uploads.uploadedImages.map((img) => img.dataUrl));

  const tabs: { id: ImagePickerTab; label: string; icon: ReactNode }[] = [
    { id: "uploads", label: "Uploads", icon: <Upload className="h-3.5 w-3.5" strokeWidth={1.75} /> },
    { id: "renders", label: "Renders", icon: <Images className="h-3.5 w-3.5" strokeWidth={1.75} /> },
    { id: "catalog", label: "Catalog", icon: <Library className="h-3.5 w-3.5" strokeWidth={1.75} /> },
  ];

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 gap-1 border-b border-border/60 bg-muted/10 px-2 py-2 sm:px-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTabChange(t.id)}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1.5 rounded-[6px] px-2 py-1.5 text-[11px] font-medium transition-colors sm:text-xs",
              tab === t.id
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        {tab === "uploads" && <CompactGalleryPanel {...uploads} />}
        {tab === "renders" && (
          <RenderLibraryPicker
            embedded
            onSelect={onPickRender}
            selectingId={selectingRenderId}
            disabled={pickerDisabled}
            selectedUrls={selectedUrls}
          />
        )}
        {tab === "catalog" && <CompactCatalogPanel {...catalog} />}
      </div>
    </div>
  );
}

interface RenderGeneratorProps {
  onGenerateSuccess?: (payload?: { renderId?: string }) => void;
  projects?: ProjectOption[];
  selectedProjectId?: string | null;
  onProjectChange?: (projectId: string | null) => void;
  compact?: boolean;
  /** Landing : localStorage pré-auth, reprise après connexion, `onUnauthenticated` au lieu de renvoyer à `/`. */
  landingMode?: boolean;
  onUnauthenticated?: () => void;
  /** Classes sur la pilule compacte (ex. `max-w-xl w-full`) */
  compactBarClassName?: string;
  /** Classes sur le conteneur compact (vignettes + barre), ex. `max-w-[1200px] lg:max-w-none` */
  compactOuterClassName?: string;
  /** Profil mobile : panneau d’options au-dessus de la barre (portail). Défaut : sous la barre. */
  compactOptionsPanelBelowBar?: boolean;
  externalReferenceImage?: {
    token: string;
    url: string;
  } | null;
  /** Active la galerie « réutiliser une image » lors du clic sur le bouton + image. */
  enableImageGallery?: boolean;
}

export function RenderGenerator({
  onGenerateSuccess,
  projects,
  selectedProjectId,
  onProjectChange,
  compact,
  landingMode = false,
  onUnauthenticated,
  compactBarClassName,
  compactOuterClassName,
  compactOptionsPanelBelowBar = true,
  externalReferenceImage,
  enableImageGallery = false,
}: RenderGeneratorProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImageItem[]>([]);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [selectedFurniture, setSelectedFurniture] = useState<any[]>([]);
  const [showFurnitureCatalog, setShowFurnitureCatalog] = useState(false);
  const [showCatalogToast, setShowCatalogToast] = useState(false);
  const [imageSize, setImageSize] = useState<ImageOutputSize>(DEFAULT_IMAGE_OUTPUT_SIZE);
  /** Plan/sketch/photo vs 3D render — pilier du pipeline côté API. */
  const [sourceKind, setSourceKind] = useState<"plan_photo" | "render_3d">("plan_photo");
  const [magnificScale, setMagnificScale] = useState<MagnificScaleFactor>(4);
  const [magnificResemblanceValue, setMagnificResemblanceValue] = useState(0);
  const [magnificCreativityValue, setMagnificCreativityValue] = useState(0);
  const [showCompactOptions, setShowCompactOptions] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imagePickerTab, setImagePickerTab] = useState<ImagePickerTab>("uploads");
  const [galleryImages, setGalleryImages] = useState<AvailableSourceImage[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryLoadingMore, setGalleryLoadingMore] = useState(false);
  const [galleryHasMore, setGalleryHasMore] = useState(false);
  const [galleryOffset, setGalleryOffset] = useState(0);
  const [deletingGalleryIds, setDeletingGalleryIds] = useState<Set<string>>(new Set());
  const [togglingGalleryIds, setTogglingGalleryIds] = useState<Set<string>>(new Set());
  const [catalogFolders, setCatalogFolders] = useState<CatalogFolderEntry[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItemEntry[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogCurrentFolderId, setCatalogCurrentFolderId] = useState<string | null>(null);
  const [catalogQuery, setCatalogQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  /** Zone compacte (vignettes + pilule) — clic extérieur / DnD. */
  const compactOuterRef = useRef<HTMLDivElement>(null);
  /** Conteneur relatif : barre + panneau (landing). */
  const compactOptionsRef = useRef<HTMLDivElement>(null);
  /** Pilule prompt — bord bas = ouverture du panneau dessous. */
  const compactPromptBarRef = useRef<HTMLDivElement>(null);
  /** Portail profil : panneau d’options, largeur = zone compacte (au-dessus ou sous la barre selon prop). */
  const compactOptionsPortalRef = useRef<HTMLDivElement>(null);
  /** Évite un double envoi si le bouton n’est plus `disabled` pendant `isGenerating`. */
  const generateInFlightRef = useRef(false);
  const [compactPanelRect, setCompactPanelRect] = useState<{
    left: number;
    width: number;
    maxHeight: number;
    top?: number;
    bottom?: number;
  } | null>(null);
  const landingResumeLockRef = useRef(false);

  // Fermer automatiquement le toast après 4 secondes
  useEffect(() => {
    if (showCatalogToast) {
      const timer = setTimeout(() => {
        setShowCatalogToast(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showCatalogToast]);

  const compactPanelOpen = showCompactOptions || showImagePicker;
  useLayoutEffect(() => {
    if (!compact || !compactPanelOpen) {
      setCompactPanelRect(null);
      return;
    }
    const update = () => {
      const outerEl = compactOuterRef.current;
      if (!outerEl) {
        setCompactPanelRect(null);
        return;
      }
      const or = outerEl.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const gap = 8;
      let left = or.left;
      let width = or.width;
      width = Math.min(width, vw - 16);
      left = Math.max(8, Math.min(left, vw - width - 8));
      if (compactOptionsPanelBelowBar) {
        const top = or.bottom + gap;
        const maxHeight = Math.max(160, Math.min(vh * 0.72, vh - top - 12));
        setCompactPanelRect({ left, width, maxHeight, top });
      } else {
        const bottom = vh - or.top + gap;
        const maxHeight = Math.max(160, Math.min(vh * 0.72, or.top - gap - 8));
        setCompactPanelRect({ left, width, maxHeight, bottom });
      }
    };
    update();
    const outerEl = compactOuterRef.current;
    const ro =
      outerEl && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => update())
        : null;
    ro?.observe(outerEl!);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      setCompactPanelRect(null);
    };
  }, [
    compact,
    compactPanelOpen,
    compactOptionsPanelBelowBar,
    uploadedImages.length,
  ]);

  useEffect(() => {
    if (!compactPanelOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      const wrap = compactOuterRef.current;
      const portal = compactOptionsPortalRef.current;
      if (wrap && !wrap.contains(t) && (!portal || !portal.contains(t))) {
        setShowCompactOptions(false);
        setShowImagePicker(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [compactPanelOpen]);

  const fetchGalleryPage = useCallback(
    async (pageOffset: number, replace: boolean) => {
      if (!session) return;
      if (pageOffset === 0) setGalleryLoading(true);
      else setGalleryLoadingMore(true);
      try {
        const params = new URLSearchParams({
          limit: String(IMAGE_PICKER_PAGE_SIZE),
          offset: String(pageOffset),
        });
        const res = await fetch(`/api/user/source-images?${params}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as {
          images?: AvailableSourceImage[];
          hasMore?: boolean;
          nextOffset?: number;
        };
        const batch = Array.isArray(data.images) ? data.images : [];
        setGalleryImages((prev) => (replace ? batch : [...prev, ...batch]));
        setGalleryHasMore(Boolean(data.hasMore));
        setGalleryOffset(data.nextOffset ?? pageOffset + batch.length);
      } catch (err) {
        console.error("Gallery fetch error:", err);
      } finally {
        setGalleryLoading(false);
        setGalleryLoadingMore(false);
      }
    },
    [session]
  );

  const fetchGalleryImages = useCallback(() => {
    void fetchGalleryPage(0, true);
  }, [fetchGalleryPage]);

  const loadMoreGalleryImages = useCallback(() => {
    void fetchGalleryPage(galleryOffset, false);
  }, [fetchGalleryPage, galleryOffset]);

  useEffect(() => {
    if (!enableImageGallery || !session) return;
    void fetchGalleryImages();
  }, [enableImageGallery, session, fetchGalleryImages]);

  const fetchCatalog = useCallback(async () => {
    if (!session) return;
    setCatalogLoading(true);
    try {
      const [foldersRes, itemsRes] = await Promise.all([
        fetch("/api/catalog/folders"),
        fetch("/api/catalog/items?folder_id=all"),
      ]);
      if (!foldersRes.ok) throw new Error(`folders HTTP ${foldersRes.status}`);
      if (!itemsRes.ok) throw new Error(`items HTTP ${itemsRes.status}`);
      const foldersData = (await foldersRes.json()) as {
        folders?: CatalogFolderEntry[];
      };
      const itemsData = (await itemsRes.json()) as {
        items?: CatalogItemEntry[];
      };
      setCatalogFolders(
        Array.isArray(foldersData.folders) ? foldersData.folders : []
      );
      setCatalogItems(
        Array.isArray(itemsData.items) ? itemsData.items : []
      );
    } catch (err) {
      console.error("Catalog fetch error:", err);
    } finally {
      setCatalogLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (showImagePicker) {
      void fetchGalleryImages();
      void fetchCatalog();
    }
  }, [showImagePicker, fetchGalleryImages, fetchCatalog]);

  // Injecter une image de référence depuis la grille (profile page)
  useEffect(() => {
    if (!externalReferenceImage?.url) return;

    setUploadedImages((prev) => {
      if (prev.length >= MAX_INPUT_IMAGES) return prev;
      if (prev.some((img) => img.dataUrl === externalReferenceImage.url)) return prev;

      return [
        ...prev,
        {
          id: `ext-${externalReferenceImage.token}`,
          dataUrl: externalReferenceImage.url,
        },
      ];
    });
  }, [externalReferenceImage?.token, externalReferenceImage?.url]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeImage = useCallback((imageId: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
  }, []);

  const addMultipleImages = useCallback((dataUrls: string[]) => {
    setUploadedImages((prev) => {
      const availableSlots = MAX_INPUT_IMAGES - prev.length;
      const urlsToAdd = dataUrls.slice(0, availableSlots);

      const newImages: UploadedImageItem[] = urlsToAdd.map((dataUrl, index) => ({
        id: `img-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 11)}`,
        dataUrl,
      }));

      return [...prev, ...newImages];
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(isProbablyImageFile);
    
    void Promise.all(imageFiles.map((file) => fileToPreviewDataUrl(file)))
      .then((dataUrls) => {
        const validUrls = dataUrls.filter(Boolean);
        if (validUrls.length > 0) {
          addMultipleImages(validUrls);
        }
      })
      .catch((err) => {
        console.error(err);
        alert(err instanceof Error ? err.message : "Could not load image.");
      });
  }, [addMultipleImages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";

    void Promise.all(files.map((file) => fileToPreviewDataUrl(file)))
      .then((dataUrls) => {
        const validUrls = dataUrls.filter(Boolean);
        if (validUrls.length > 0) {
          addMultipleImages(validUrls);
        }
      })
      .catch((err) => {
        console.error(err);
        alert(err instanceof Error ? err.message : "Could not load image.");
      });
  };

  const runGenerateWithPayload = useCallback(
    async (
      imagesOverride: UploadedImageItem[],
      promptText: string,
      aspectOverride: AspectRatio,
      imageSizeOverride?: ImageOutputSize,
      opts?: {
        pipeline?: GenerationPipeline;
        magnificScale?: MagnificScaleFactor;
        /** @deprecated brouillon / client ancien : une seule valeur + mode */
        magnificAdjustMode?: "resemblance" | "creativity";
        magnificResemblanceValue?: number;
        magnificCreativityValue?: number;
        /** @deprecated */
        magnificStyleValue?: number;
        /** @deprecated */
        magnificCreativity?: number;
      }
    ) => {
      const pipeline: GenerationPipeline =
        opts?.pipeline ?? (sourceKind === "render_3d" ? "magnific" : "gemini");
      const promptToUse = promptText.trim();

      if (imagesOverride.length === 0) return;
      if (pipeline !== "magnific" && !promptToUse) return;

      let scaleToSend: MagnificScaleFactor = opts?.magnificScale ?? magnificScale;
      let resToSend = clampMagnificStyleValue(opts?.magnificResemblanceValue ?? magnificResemblanceValue);
      let creToSend = clampMagnificStyleValue(opts?.magnificCreativityValue ?? magnificCreativityValue);
      if (
        opts?.magnificCreativity !== undefined &&
        opts?.magnificStyleValue === undefined &&
        opts?.magnificResemblanceValue === undefined &&
        opts?.magnificCreativityValue === undefined
      ) {
        creToSend = clampMagnificStyleValue(opts.magnificCreativity);
        resToSend = 0;
      } else if (
        opts?.magnificStyleValue !== undefined &&
        opts?.magnificResemblanceValue === undefined &&
        opts?.magnificCreativityValue === undefined
      ) {
        const single = clampMagnificStyleValue(opts.magnificStyleValue);
        const legacyMode = opts?.magnificAdjustMode ?? "resemblance";
        if (legacyMode === "creativity") {
          creToSend = single;
          resToSend = 0;
        } else {
          resToSend = single;
          creToSend = 0;
        }
      }

      if (!session) {
        if (landingMode) {
          try {
            const K = LANDING_RENDER_FORM_STORAGE_KEYS;
            localStorage.setItem(K.IMAGES, JSON.stringify(imagesOverride));
            localStorage.setItem(K.PROMPT, promptToUse);
            localStorage.setItem(K.ASPECT_RATIO, aspectOverride);
            localStorage.setItem(K.IMAGE_SIZE, imageSizeOverride ?? imageSize);
            localStorage.setItem(K.PIPELINE, pipeline);
            localStorage.setItem(K.MAGNIFIC_SCALE, String(scaleToSend));
            localStorage.setItem(K.MAGNIFIC_RESEMBLANCE_VALUE, String(resToSend));
            localStorage.setItem(K.MAGNIFIC_CREATIVITY_VALUE, String(creToSend));
            localStorage.removeItem(K.MAGNIFIC_STYLE_VALUE);
            localStorage.removeItem(K.MAGNIFIC_CREATIVITY);
          } catch (e) {
            console.error(e);
          }
          onUnauthenticated?.();
          return;
        }
        router.push("/");
        return;
      }

      if (landingMode) {
        const K = LANDING_RENDER_FORM_STORAGE_KEYS;
        localStorage.removeItem(K.IMAGES);
        localStorage.removeItem(K.PROMPT);
        localStorage.removeItem(K.ASPECT_RATIO);
        localStorage.removeItem(K.IMAGE_SIZE);
        localStorage.removeItem(K.PIPELINE);
        localStorage.removeItem(K.MAGNIFIC_SCALE);
        localStorage.removeItem(K.MAGNIFIC_ADJUST_MODE);
        localStorage.removeItem(K.MAGNIFIC_STYLE_VALUE);
        localStorage.removeItem(K.MAGNIFIC_RESEMBLANCE_VALUE);
        localStorage.removeItem(K.MAGNIFIC_CREATIVITY_VALUE);
        localStorage.removeItem(K.MAGNIFIC_CREATIVITY);
      }

      const imageSizeToUse = imageSizeOverride ?? imageSize;

      if (generateInFlightRef.current) return;
      generateInFlightRef.current = true;
      setIsGenerating(true);

      try {
        const uploadedUrls: { url: string; role: ImageRole }[] = [];

        for (let i = 0; i < imagesOverride.length; i++) {
          const img = imagesOverride[i]!;
          const role = apiRoleForImageIndex(i);
          if (img.dataUrl.startsWith("http://") || img.dataUrl.startsWith("https://")) {
            uploadedUrls.push({ url: img.dataUrl, role });
            continue;
          }

          const { blob, filename } = await blobForUploadFromDataUrl(img.dataUrl, i);
          const formData = new FormData();
          formData.append("file", blob, filename);

          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!uploadRes.ok) {
            const errJson = (await uploadRes.json().catch(() => ({}))) as { error?: string };
            const detail = errJson.error ?? uploadRes.statusText;
            throw new Error(`Upload failed for image ${i + 1} (${detail})`);
          }

          const uploadJson = (await uploadRes.json()) as { url?: string };
          const url = uploadJson.url;
          if (!url || typeof url !== "string") {
            throw new Error(
              `Invalid upload response for image ${i + 1} (missing URL).`
            );
          }
          uploadedUrls.push({ url, role });
        }

        let enhancedPrompt = promptToUse;
        if (pipeline === "gemini" && selectedFurniture.length > 0) {
          const furnitureDescriptions = selectedFurniture
            .map((item: { promptEnhancement: string }) => item.promptEnhancement)
            .join(", ");
          enhancedPrompt = `${promptToUse}. Include these furniture items: ${furnitureDescriptions}`;
        }

        const generateRes = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            images: uploadedUrls,
            prompt: enhancedPrompt,
            aspectRatio: aspectOverride,
            imageSize: imageSizeToUse,
            pipeline,
            magnificScale: scaleToSend,
            magnificResemblanceValue: resToSend,
            magnificCreativityValue: creToSend,
            projectId:
              selectedProjectId && selectedProjectId !== "unassigned" ? selectedProjectId : undefined,
          }),
        });

        const generateData = await generateRes.json().catch(() => ({}));

        if (!generateRes.ok) {
          throw new Error(
            (generateData as { message?: string; error?: string }).message ||
              (generateData as { error?: string }).error ||
              "Generation failed"
          );
        }

        setUploadedImages([]);
        setPrompt("");
        setSelectedFurniture([]);

        if (onGenerateSuccess) {
          onGenerateSuccess(
            generateData?.renderId ? { renderId: String(generateData.renderId) } : undefined
          );
        } else {
          router.refresh();
        }
      } catch (error) {
        console.error("Generation error:", error);
        alert(error instanceof Error ? error.message : "Generation failed");
      } finally {
        generateInFlightRef.current = false;
        setIsGenerating(false);
      }
    },
    [
      session,
      landingMode,
      onUnauthenticated,
      selectedFurniture,
      selectedProjectId,
      router,
      onGenerateSuccess,
      imageSize,
      sourceKind,
      magnificScale,
      magnificResemblanceValue,
      magnificCreativityValue,
    ]
  );

  const handleGenerate = () => {
    void runGenerateWithPayload(uploadedImages, prompt, aspectRatio);
  };

  // Landing : brouillon hors session (localStorage)
  useEffect(() => {
    if (!landingMode) return;
    const K = LANDING_RENDER_FORM_STORAGE_KEYS;
    if (session) return;

    const rawImg = localStorage.getItem(K.IMAGES);
    const pr = localStorage.getItem(K.PROMPT);
    const ar = localStorage.getItem(K.ASPECT_RATIO);
    const sz = localStorage.getItem(K.IMAGE_SIZE);
    const pl = localStorage.getItem(K.PIPELINE);
    const ms = localStorage.getItem(K.MAGNIFIC_SCALE);
    const mam = localStorage.getItem(K.MAGNIFIC_ADJUST_MODE);
    const msv = localStorage.getItem(K.MAGNIFIC_STYLE_VALUE);
    const mrs = localStorage.getItem(K.MAGNIFIC_RESEMBLANCE_VALUE);
    const mcre = localStorage.getItem(K.MAGNIFIC_CREATIVITY_VALUE);
    const mcr = localStorage.getItem(K.MAGNIFIC_CREATIVITY);
    if (rawImg) {
      try {
        const parsed = normalizeStoredImages(JSON.parse(rawImg));
        if (parsed.length > 0) setUploadedImages(parsed);
      } catch {
        /* ignore */
      }
    }
    if (pr) setPrompt(pr);
    if (ar && ASPECT_RATIOS.some((r) => r.value === ar)) setAspectRatio(ar as AspectRatio);
    if (sz && isValidImageOutputSize(sz)) setImageSize(sz);
    if (pl === "magnific") setSourceKind("render_3d");
    else if (pl === "gemini") setSourceKind("plan_photo");
    if (ms != null) {
      const n = Number(ms);
      if (n === 2 || n === 4 || n === 8 || n === 16) setMagnificScale(n);
    }
    const hasPair = mrs != null || mcre != null;
    if (hasPair) {
      if (mrs != null) setMagnificResemblanceValue(clampMagnificStyleValue(Number(mrs)));
      if (mcre != null) setMagnificCreativityValue(clampMagnificStyleValue(Number(mcre)));
    } else if (msv != null) {
      const v = clampMagnificStyleValue(Number(msv));
      if (mam === "creativity") setMagnificCreativityValue(v);
      else setMagnificResemblanceValue(v);
    } else if (mcr != null) {
      setMagnificCreativityValue(clampMagnificStyleValue(Number(mcr)));
    }
  }, [landingMode, session]);

  // Landing : reprise après connexion + redirect si renderId stocké
  useEffect(() => {
    if (!landingMode) return;
    const K = LANDING_RENDER_FORM_STORAGE_KEYS;

    if (!session) {
      landingResumeLockRef.current = false;
      return;
    }

    const rid = localStorage.getItem(K.RENDER_ID);
    if (rid) {
      router.push(`/profile?studio=${encodeURIComponent(rid)}`);
      localStorage.removeItem(K.RENDER_ID);
      return;
    }

    const rawImg = localStorage.getItem(K.IMAGES);
    const pr = localStorage.getItem(K.PROMPT);
    const ar = localStorage.getItem(K.ASPECT_RATIO);
    const sz = localStorage.getItem(K.IMAGE_SIZE);
    const pl = localStorage.getItem(K.PIPELINE);
    const ms = localStorage.getItem(K.MAGNIFIC_SCALE);
    const mam = localStorage.getItem(K.MAGNIFIC_ADJUST_MODE);
    const msv = localStorage.getItem(K.MAGNIFIC_STYLE_VALUE);
    const mrs = localStorage.getItem(K.MAGNIFIC_RESEMBLANCE_VALUE);
    const mcre = localStorage.getItem(K.MAGNIFIC_CREATIVITY_VALUE);
    const mcr = localStorage.getItem(K.MAGNIFIC_CREATIVITY);

    if (!rawImg || !pr || landingResumeLockRef.current) return;

    let parsed: UploadedImageItem[] = [];
    try {
      parsed = normalizeStoredImages(JSON.parse(rawImg));
    } catch {
      return;
    }
    if (parsed.length === 0) return;

    landingResumeLockRef.current = true;
    localStorage.removeItem(K.IMAGES);
    localStorage.removeItem(K.PROMPT);
    localStorage.removeItem(K.ASPECT_RATIO);
    localStorage.removeItem(K.IMAGE_SIZE);
    localStorage.removeItem(K.PIPELINE);
    localStorage.removeItem(K.MAGNIFIC_SCALE);
    localStorage.removeItem(K.MAGNIFIC_ADJUST_MODE);
    localStorage.removeItem(K.MAGNIFIC_STYLE_VALUE);
    localStorage.removeItem(K.MAGNIFIC_RESEMBLANCE_VALUE);
    localStorage.removeItem(K.MAGNIFIC_CREATIVITY_VALUE);
    localStorage.removeItem(K.MAGNIFIC_CREATIVITY);

    const aspectUse =
      ar && ASPECT_RATIOS.some((r) => r.value === ar) ? (ar as AspectRatio) : aspectRatio;
    const sizeUse =
      sz && isValidImageOutputSize(sz) ? sz : DEFAULT_IMAGE_OUTPUT_SIZE;
    const pipelineResume = parseGenerationPipeline(pl);
    let scaleResume: MagnificScaleFactor = 4;
    if (ms != null) {
      const n = Number(ms);
      if (n === 2 || n === 4 || n === 8 || n === 16) scaleResume = n;
    }
    let legacyTab: "resemblance" | "creativity" = "resemblance";
    if (mam === "creativity" || mam === "resemblance") legacyTab = mam;
    let resResume = 0;
    let creResume = 0;
    const hasPairResume = mrs != null || mcre != null;
    if (hasPairResume) {
      if (mrs != null) resResume = clampMagnificStyleValue(Number(mrs));
      if (mcre != null) creResume = clampMagnificStyleValue(Number(mcre));
    } else if (msv != null) {
      const v = clampMagnificStyleValue(Number(msv));
      if (legacyTab === "creativity") creResume = v;
      else resResume = v;
    } else if (mcr != null) {
      creResume = clampMagnificStyleValue(Number(mcr));
    }

    setUploadedImages(parsed);
    setPrompt(pr);
    setAspectRatio(aspectUse);
    setImageSize(sizeUse);
    setSourceKind(pipelineResume === "magnific" ? "render_3d" : "plan_photo");
    setMagnificScale(scaleResume);
    setMagnificResemblanceValue(resResume);
    setMagnificCreativityValue(creResume);

    const t = window.setTimeout(() => {
      void runGenerateWithPayload(parsed, pr, aspectUse, sizeUse, {
        pipeline: pipelineResume,
        magnificScale: scaleResume,
        magnificResemblanceValue: resResume,
        magnificCreativityValue: creResume,
      });
    }, 0);
    return () => window.clearTimeout(t);
  }, [landingMode, session, router, runGenerateWithPayload]);

  const compactOptionsScrollableProps: CompactOptionsScrollableInnerProps = {
    sourceKind,
    setSourceKind,
    magnificScale,
    setMagnificScale,
    magnificResemblanceValue,
    setMagnificResemblanceValue,
    magnificCreativityValue,
    setMagnificCreativityValue,
    projects,
    selectedProjectId,
    onProjectChange,
    aspectRatio,
    setAspectRatio,
    imageSize,
    setImageSize,
    onOpenCatalog: () => {
      setShowCompactOptions(false);
      setImagePickerTab("catalog");
      setShowImagePicker(true);
    },
    setShowCompactOptions,
  };

  const handlePickCatalogItem = useCallback(
    (item: CatalogItemEntry) => {
      if (!item.image_url) return;
      setUploadedImages((prev) => {
        if (prev.some((p) => p.dataUrl === item.image_url)) return prev;
        if (prev.length >= MAX_INPUT_IMAGES) return prev;
        return [
          ...prev,
          {
            id: `cat-${item.id}-${Date.now()}`,
            dataUrl: item.image_url!,
          },
        ];
      });
    },
    []
  );

  const compactCatalogProps: CompactCatalogPanelProps = {
    folders: catalogFolders,
    items: catalogItems,
    loading: catalogLoading,
    currentFolderId: catalogCurrentFolderId,
    setCurrentFolderId: setCatalogCurrentFolderId,
    query: catalogQuery,
    setQuery: setCatalogQuery,
    uploadedImages,
    onPickItem: handlePickCatalogItem,
    onOpenFullCatalog: () => {
      setShowImagePicker(false);
      router.push("/catalog");
    },
    remainingSlots: Math.max(0, MAX_INPUT_IMAGES - uploadedImages.length),
  };

  const uploadFileAndRegisterSource = useCallback(
    async (file: File): Promise<string | null> => {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) {
        const errJson = (await uploadRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(errJson.error ?? uploadRes.statusText);
      }
      const uploadJson = (await uploadRes.json()) as { url?: string };
      const url = uploadJson.url;
      if (!url || typeof url !== "string") return null;

      if (session) {
        const regRes = await fetch("/api/user/source-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        if (!regRes.ok) {
          const errJson = (await regRes.json().catch(() => ({}))) as { error?: string };
          console.warn("source-images register:", errJson.error ?? regRes.status);
        }
      }
      return url;
    },
    [session]
  );

  const handleGalleryDropFiles = useCallback(
    (files: File[]) => {
      const imageFiles = files.filter(isProbablyImageFile);
      if (imageFiles.length === 0) return;

      if (session && enableImageGallery) {
        void (async () => {
          try {
            const urls: string[] = [];
            for (const file of imageFiles) {
              const url = await uploadFileAndRegisterSource(file);
              if (url) urls.push(url);
            }
            if (urls.length > 0) {
              addMultipleImages(urls);
              void fetchGalleryImages();
            }
          } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : "Could not upload image.");
          }
        })();
        return;
      }

      void Promise.all(imageFiles.map((file) => fileToPreviewDataUrl(file)))
        .then((dataUrls) => {
          const validUrls = dataUrls.filter(Boolean);
          if (validUrls.length > 0) {
            addMultipleImages(validUrls);
            setShowImagePicker(false);
          }
        })
        .catch((err) => {
          console.error(err);
          alert(err instanceof Error ? err.message : "Could not load image.");
        });
    },
    [
      session,
      enableImageGallery,
      uploadFileAndRegisterSource,
      addMultipleImages,
      fetchGalleryImages,
    ]
  );

  const handlePickGalleryImage = useCallback(
    (img: AvailableSourceImage) => {
      setUploadedImages((prev) => {
        if (prev.some((p) => p.dataUrl === img.url)) return prev;
        if (prev.length >= MAX_INPUT_IMAGES) return prev;
        return [
          ...prev,
          {
            id: `gal-${img.id}-${Date.now()}`,
            dataUrl: img.url,
          },
        ];
      });
    },
    []
  );

  const handlePickRender = useCallback((render: LibraryRender) => {
    const url = getRenderPreviewUrl(render);
    if (!url) return;
    setUploadedImages((prev) => {
      if (prev.some((p) => p.dataUrl === url)) return prev;
      if (prev.length >= MAX_INPUT_IMAGES) return prev;
      return [
        ...prev,
        {
          id: `render-${render.id}-${Date.now()}`,
          dataUrl: url,
        },
      ];
    });
  }, []);

  const openImagePicker = useCallback((tab: ImagePickerTab = "uploads") => {
    setShowCompactOptions(false);
    setImagePickerTab(tab);
    setShowImagePicker(true);
  }, []);

  const handleDeleteGalleryImage = useCallback(
    async (img: AvailableSourceImage) => {
      if (typeof window !== "undefined") {
        const ok = window.confirm(
          "Remove this image from your gallery? Already-generated renders will be kept."
        );
        if (!ok) return;
      }

      setDeletingGalleryIds((prev) => {
        const next = new Set(prev);
        next.add(img.id);
        return next;
      });

      // Retrait optimiste
      const previousGallery = galleryImages;
      setGalleryImages((prev) => prev.filter((g) => g.id !== img.id));
      setUploadedImages((prev) => prev.filter((p) => p.dataUrl !== img.url));

      try {
        const res = await fetch("/api/user/source-images", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: img.url }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error || `HTTP ${res.status}`);
        }
      } catch (err) {
        console.error("Delete gallery image:", err);
        setGalleryImages(previousGallery);
        alert(
          err instanceof Error
            ? `Delete failed: ${err.message}`
            : "Delete failed."
        );
      } finally {
        setDeletingGalleryIds((prev) => {
          const next = new Set(prev);
          next.delete(img.id);
          return next;
        });
      }
    },
    [galleryImages]
  );

  const handleToggleGalleryImageVisibility = useCallback(
    async (img: AvailableSourceImage, next: "private" | "organization") => {
      // Optimistic update : on bascule visuellement avant la réponse serveur.
      setGalleryImages((prev) =>
        prev.map((g) => (g.id === img.id ? { ...g, visibility: next } : g))
      );
      setTogglingGalleryIds((prev) => {
        const s = new Set(prev);
        s.add(img.id);
        return s;
      });
      try {
        const res = await fetch("/api/user/source-images", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: img.id, visibility: next }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error || `HTTP ${res.status}`);
        }
      } catch (err) {
        console.error("toggle visibility:", err);
        // Rollback
        setGalleryImages((prev) =>
          prev.map((g) =>
            g.id === img.id
              ? { ...g, visibility: next === "private" ? "organization" : "private" }
              : g
          )
        );
        alert(err instanceof Error ? err.message : "Update failed");
      } finally {
        setTogglingGalleryIds((prev) => {
          const s = new Set(prev);
          s.delete(img.id);
          return s;
        });
      }
    },
    []
  );

  const compactGalleryProps: CompactGalleryPanelProps = {
    onPickFiles: () => fileInputRef.current?.click(),
    isDragging,
    setIsDragging,
    onDropFiles: handleGalleryDropFiles,
    galleryImages,
    galleryLoading,
    galleryLoadingMore,
    galleryHasMore,
    onLoadMoreGallery: loadMoreGalleryImages,
    uploadedImages,
    onPickGalleryImage: handlePickGalleryImage,
    onDeleteGalleryImage: handleDeleteGalleryImage,
    onToggleGalleryImageVisibility: handleToggleGalleryImageVisibility,
    togglingImageIds: togglingGalleryIds,
    deletingImageIds: deletingGalleryIds,
    remainingSlots: Math.max(0, MAX_INPUT_IMAGES - uploadedImages.length),
  };

  const compactImagePickerProps: CompactImagePickerPanelProps = {
    tab: imagePickerTab,
    onTabChange: setImagePickerTab,
    uploads: compactGalleryProps,
    catalog: compactCatalogProps,
    onPickRender: handlePickRender,
    selectingRenderId: null,
    pickerDisabled: uploadedImages.length >= MAX_INPUT_IMAGES,
  };

  return (
    <Card
      className={
        compact
          ? "overflow-visible rounded-none border-0 bg-transparent p-0 shadow-none backdrop-blur-none"
          : "space-y-4 border-white/20 bg-white/10 p-4 backdrop-blur-xl sm:p-6 gradient-shadow"
      }
    >
      {/* Compact : barre alignée sur le thème (bordures sidebar, coins 4px) */}
      {compact ? (
        <div
          ref={compactOuterRef}
          className={cn("relative mb-3 w-full sm:mb-4", compactOuterClassName)}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {uploadedImages.length > 0 && (
            <div className="relative z-0 mb-1.5 flex min-h-0 flex-nowrap items-center gap-2.5 overflow-x-auto pb-0.5 pt-0.5 [scrollbar-width:thin] sm:gap-3">
            {uploadedImages.map((img, index) => {
              const n = index + 1;
              return (
                <div
                  key={img.id}
                  className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border/80 bg-muted/15 transition-colors hover:border-foreground/30 sm:h-24 sm:w-24"
                >
                  <span
                    className={cn(
                      "absolute left-1.5 top-1.5 z-[1] flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-400 px-1.5 font-mono text-[10px] font-bold tabular-nums text-emerald-950 shadow-sm ring-1 ring-emerald-600/15 sm:left-2 sm:top-2 sm:h-7 sm:min-w-7 sm:text-[11px]"
                    )}
                  >
                    {n}
                  </span>
                  <img
                    src={img.dataUrl}
                    alt={`Image ${n}`}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className={cn(
                      "absolute right-1.5 top-1.5 z-[2] flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white opacity-0 shadow-sm ring-1 ring-white/25 transition-opacity hover:bg-red-600 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:right-2 sm:top-2"
                    )}
                    aria-label={`Remove image ${n}`}
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                </div>
              );
            })}
            </div>
          )}

        <div
          ref={compactOptionsRef}
          className={cn("relative w-full", showCompactOptions && "z-[140]")}
        >
        <div
          ref={compactPromptBarRef}
          className={cn(
            "flex flex-nowrap items-center gap-2 rounded-xl border border-border/80 bg-muted/15 px-3 py-2 shadow-[0_6px_28px_rgba(0,0,0,0.09)] touch-manipulation sm:gap-2.5 sm:px-3.5 sm:py-2",
            isDragging && "border-primary/40 ring-2 ring-primary/20",
            compactBarClassName
          )}
        >
          {uploadedImages.length < MAX_INPUT_IMAGES && (
            enableImageGallery ? (
              <button
                type="button"
                onClick={() => {
                  if (showImagePicker) {
                    setShowImagePicker(false);
                  } else {
                    openImagePicker("uploads");
                  }
                }}
                className={cn(
                  "relative flex h-9 w-9 shrink-0 items-center justify-center self-center overflow-hidden rounded-xl border-0 bg-transparent text-muted-foreground outline-none ring-0 transition-colors sm:h-9 sm:w-9",
                  "hover:bg-black/[0.07] hover:text-foreground",
                  "active:scale-[0.97]",
                  showImagePicker && "bg-black/[0.07] text-foreground"
                )}
                title="Add image — uploads, renders, or catalog"
                aria-expanded={showImagePicker}
              >
                <ImagePlus className="h-[18px] w-[18px] sm:h-5 sm:w-5" strokeWidth={2} aria-hidden />
              </button>
            ) : (
              <label
                className={cn(
                  "relative flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center self-center overflow-hidden rounded-xl border-0 bg-transparent text-muted-foreground outline-none ring-0 transition-colors sm:h-9 sm:w-9",
                  "hover:bg-black/[0.07] hover:text-foreground",
                  "active:scale-[0.97]",
                  "focus-within:outline-none focus-within:ring-0"
                )}
                title="Add images"
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="absolute inset-0 cursor-pointer opacity-0 outline-none ring-0 focus:outline-none focus:ring-0"
                />
                <ImagePlus className="h-[18px] w-[18px] sm:h-5 sm:w-5" strokeWidth={2} aria-hidden />
              </label>
            )
          )}
          {enableImageGallery && (
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          )}
          <div className="flex min-h-9 min-w-0 flex-1 flex-col justify-center sm:min-h-9">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value.slice(0, 500))}
              placeholder={
                sourceKind === "render_3d"
                  ? "Optional: lighting, materials, detail…"
                  : "What will you create?"
              }
              rows={1}
              className="max-h-[120px] min-h-0 w-full resize-none rounded-none border-0 !border-transparent bg-transparent px-1 py-0 text-base font-medium leading-[1.35rem] text-foreground shadow-none outline-none ring-0 ring-offset-0 placeholder:text-muted-foreground/65 focus-visible:border-transparent focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-50 sm:text-sm sm:leading-[1.4rem]"
            />
          </div>

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <button
              type="button"
              onClick={() =>
                setShowCompactOptions((o) => {
                  const next = !o;
                  if (next) {
                    setShowImagePicker(false);
                  }
                  return next;
                })
              }
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border-0 bg-transparent text-muted-foreground outline-none ring-0 transition-colors hover:bg-black/[0.07] hover:text-foreground focus-visible:outline-none focus-visible:ring-0 sm:h-9 sm:w-9",
                showCompactOptions && "bg-black/[0.07] text-foreground"
              )}
              title="Source, format, resolution, folder…"
              aria-expanded={showCompactOptions}
            >
              <SlidersHorizontal className="h-[18px] w-[18px] sm:h-[20px] sm:w-[20px]" strokeWidth={1.75} />
            </button>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={
                uploadedImages.length === 0 ||
                (sourceKind === "plan_photo" && !prompt.trim())
              }
              aria-busy={isGenerating}
              className={cn(
                "relative z-[120] flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border-0 bg-transparent text-black outline-none ring-0 transition-colors hover:bg-black/[0.07] focus-visible:outline-none focus-visible:ring-0 sm:h-9 sm:w-9",
                "disabled:pointer-events-none disabled:bg-transparent disabled:text-muted-foreground disabled:opacity-55",
                isGenerating && "pointer-events-none cursor-wait opacity-90"
              )}
              aria-label="Generate"
            >
              {isGenerating ? (
                <Sparkles className="h-3.5 w-3.5 animate-spin sm:h-4 sm:w-4" strokeWidth={2} />
              ) : (
                <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2} />
              )}
            </button>
          </div>
        </div>

        </div>
        {showCompactOptions &&
          typeof document !== "undefined" &&
          compactPanelRect &&
          createPortal(
            <div
              ref={compactOptionsPortalRef}
              role="dialog"
              aria-label="Generation options"
              className="flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-white/95 shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur-md"
              style={{
                position: "fixed",
                zIndex: 210,
                left: compactPanelRect.left,
                width: compactPanelRect.width,
                maxHeight: compactPanelRect.maxHeight,
                ...(compactPanelRect.top !== undefined
                  ? { top: compactPanelRect.top }
                  : { bottom: compactPanelRect.bottom! }),
              }}
            >
              <CompactOptionsScrollableInner {...compactOptionsScrollableProps} />
            </div>,
            document.body
          )}
        {showImagePicker &&
          typeof document !== "undefined" &&
          compactPanelRect &&
          createPortal(
            <div
              ref={compactOptionsPortalRef}
              role="dialog"
              aria-label="Add image"
              className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border/80 bg-white/95 shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur-md"
              style={{
                position: "fixed",
                zIndex: 210,
                left: compactPanelRect.left,
                width: compactPanelRect.width,
                height: compactPanelRect.maxHeight,
                maxHeight: compactPanelRect.maxHeight,
                ...(compactPanelRect.top !== undefined
                  ? { top: compactPanelRect.top }
                  : { bottom: compactPanelRect.bottom! }),
              }}
            >
              <CompactImagePickerPanel {...compactImagePickerProps} />
            </div>,
            document.body
          )}
        </div>
      ) : (
        /* Full layout (non-compact) */
        <>
      {/* Upload Zone */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-mono uppercase tracking-wider">
            Images
          </label>
          <span className="text-xs font-mono text-muted-foreground">
            {uploadedImages.length} / {MAX_INPUT_IMAGES}
          </span>
        </div>

        {/* Images uploadées */}
        {uploadedImages.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {uploadedImages.map((img, index) => {
              const n = index + 1;
              return (
                <div key={img.id} className="relative group">
                  <div className="relative aspect-square border border-border overflow-hidden bg-muted/30">
                    <span className="absolute left-1.5 top-1.5 z-[2] flex h-7 min-w-[1.75rem] items-center justify-center rounded-md bg-emerald-400 px-1 font-mono text-xs font-bold tabular-nums text-emerald-950 shadow-sm">
                      {n}
                    </span>
                    <img
                      src={img.dataUrl}
                      alt={`Image ${n}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      className="absolute right-1 top-1 z-[3] flex h-6 w-6 items-center justify-center bg-black/70 opacity-0 transition-colors hover:bg-red-600 group-hover:opacity-100"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Zone d'ajout */}
            {uploadedImages.length < MAX_INPUT_IMAGES && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  relative aspect-square border-2 border-dashed
                  transition-all duration-200 cursor-pointer
                  flex items-center justify-center
                  ${isDragging 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50"
                  }
                `}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-1.5 sm:gap-2 text-muted-foreground">
                  <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="text-[10px] sm:text-xs font-mono">ADD</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Zone d'upload initiale */}
        {uploadedImages.length === 0 && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border border-dashed rounded-lg p-8 sm:p-12
              transition-all duration-200 cursor-pointer
              ${isDragging 
                ? "border-primary bg-primary/5" 
                : "border-border/90 hover:border-primary/50 bg-muted/20 hover:bg-muted/60"
              }
            `}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-5 text-center">
              <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-background/60 backdrop-blur-sm border border-border/50">
                <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
              </div>
              
              <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
                Add sketch, draw, pictures anything you want to start working with
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Reste du formulaire */}
      {uploadedImages.length > 0 && (
        <>
          {/* Project Selector */}
          {projects && projects.length > 0 && (
            <div className="space-y-2 sm:space-y-3">
              <label className="text-xs sm:text-sm font-mono uppercase tracking-wider flex items-center gap-1.5">
                <FolderOpen className="w-3 h-3" />
                Project
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => onProjectChange?.(null)}
                  className={`
                    p-1.5 sm:p-2 border-2 transition-all duration-200 text-center
                    ${!selectedProjectId || selectedProjectId === "unassigned"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                    }
                  `}
                >
                  <div className="text-[9px] sm:text-[10px] lg:text-xs font-mono">No project</div>
                </button>
                {projects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => onProjectChange?.(project.id)}
                    className={`
                      p-1.5 sm:p-2 border-2 transition-all duration-200 text-center
                      ${selectedProjectId === project.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                      }
                    `}
                  >
                    <div className="text-[9px] sm:text-[10px] lg:text-xs font-mono truncate">{project.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2 sm:space-y-3">
            <label className="text-xs sm:text-sm font-mono uppercase tracking-wider">
              Generation source
            </label>
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setSourceKind("plan_photo")}
                className={cn(
                  "p-2 sm:p-3 border-2 text-center transition-all duration-200",
                  sourceKind === "plan_photo"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="text-[10px] sm:text-xs font-mono font-bold">Plan / sketch / photo</div>
              </button>
              <button
                type="button"
                onClick={() => setSourceKind("render_3d")}
                className={cn(
                  "p-2 sm:p-3 border-2 text-center transition-all duration-200",
                  sourceKind === "render_3d"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="text-[10px] sm:text-xs font-mono font-bold">3D render</div>
              </button>
            </div>
            {sourceKind === "render_3d" && (
              <Magnific3DControls
                compact={false}
                magnificScale={magnificScale}
                setMagnificScale={setMagnificScale}
                magnificResemblanceValue={magnificResemblanceValue}
                setMagnificResemblanceValue={setMagnificResemblanceValue}
                magnificCreativityValue={magnificCreativityValue}
                setMagnificCreativityValue={setMagnificCreativityValue}
              />
            )}
          </div>

          {/* Prompt Input */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-mono uppercase tracking-wider">
                Generation instructions
              </label>
              <span className="text-[10px] sm:text-xs font-mono text-muted-foreground">
                {prompt.length} / 500
              </span>
            </div>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value.slice(0, 500))}
              placeholder={
                sourceKind === "render_3d"
                  ? "Describe lighting, materials, and detail you want to improve…"
                  : "Describe the style, mood, and details you want in your photorealistic render..."
              }
              className="min-h-[100px] sm:min-h-[120px] resize-none rounded-none font-mono text-xs sm:text-sm"
            />
          </div>

          <div
            className={cn(
              "space-y-4 sm:space-y-6",
              sourceKind === "render_3d" && "pointer-events-none opacity-40"
            )}
          >
          {/* Aspect Ratio Selector */}
          <div className="space-y-2 sm:space-y-3">
            <label className="text-xs sm:text-sm font-mono uppercase tracking-wider">
              Aspect ratio
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-2">
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio.value}
                  type="button"
                  onClick={() => setAspectRatio(ratio.value)}
                  className={`
                    p-1.5 sm:p-2 lg:p-3 border-2 transition-all duration-200 text-center
                    ${aspectRatio === ratio.value 
                      ? "border-primary bg-primary/10" 
                      : "border-border hover:border-primary/50"
                    }
                  `}
                >
                  <div className="text-[9px] sm:text-[10px] lg:text-xs font-mono font-bold">{ratio.label}</div>
                  <div className="text-[8px] sm:text-[9px] lg:text-[10px] text-muted-foreground font-mono mt-0.5 sm:mt-1">
                    {ratio.value}
                  </div>
                  <div className="text-[7px] sm:text-[8px] text-muted-foreground/80 font-mono mt-0.5">
                    {ratio.resolution1K} @1K
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <label className="text-xs sm:text-sm font-mono uppercase tracking-wider">
              Output resolution
            </label>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {IMAGE_OUTPUT_SIZES.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setImageSize(opt.value)}
                  className={`
                    p-2 sm:p-3 border-2 transition-all duration-200 text-center
                    ${imageSize === opt.value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                    }
                  `}
                >
                  <div className="text-[10px] sm:text-xs font-mono font-bold">{opt.label}</div>
                  <div className="text-[8px] sm:text-[9px] text-muted-foreground font-mono mt-0.5">
                    {opt.hint}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Furniture Catalog */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-mono uppercase tracking-wider">
                Furniture Catalog
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Afficher le toast "bientôt disponible" au lieu d'ouvrir le catalogue
                  setShowCatalogToast(true);
                  // Ne pas ouvrir le catalogue
                  // setShowFurnitureCatalog(!showFurnitureCatalog);
                }}
                className="font-mono text-[10px] sm:text-xs h-7 sm:h-8 lg:h-9"
              >
                <Sofa className="w-2.5 h-2.5 sm:w-3 sm:h-3 sm:mr-1.5 lg:mr-2" />
                <span className="hidden sm:inline">
                  {showFurnitureCatalog ? "HIDE" : "BROWSE"}
                </span>
                <span className="sm:hidden">{showFurnitureCatalog ? "HIDE" : "CATALOG"}</span>
                {selectedFurniture.length > 0 && (
                  <span className="ml-1 sm:ml-1.5 lg:ml-2 px-1 sm:px-1.5 py-0.5 bg-primary text-primary-foreground text-[8px] sm:text-[9px] lg:text-[10px] rounded">
                    {selectedFurniture.length}
                  </span>
                )}
              </Button>
            </div>
            {showFurnitureCatalog && (
              <div className="border border-border bg-white/5 p-3 sm:p-4 max-h-[300px] sm:max-h-[400px] overflow-y-auto">
                <FurnitureCatalog
                  selectedItems={selectedFurniture}
                  onSelectionChange={setSelectedFurniture}
                />
              </div>
            )}
            {selectedFurniture.length > 0 && !showFurnitureCatalog && (
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {selectedFurniture.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-muted/50 border border-border text-[10px] sm:text-xs font-mono"
                  >
                    <span className="line-clamp-1">{item.name}</span>
                    <button
                      onClick={() => setSelectedFurniture(selectedFurniture.filter(f => f.id !== item.id))}
                      className="hover:text-red-500 flex-shrink-0"
                    >
                      <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={
              uploadedImages.length === 0 ||
              (sourceKind === "plan_photo" && !prompt.trim()) ||
              isGenerating
            }
            className="w-full h-12 sm:h-14 font-mono text-xs sm:text-sm tracking-wider !bg-[#000000] hover:!bg-[#1a1a1a] !opacity-100 transition-all"
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>GENERATING...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1.5 sm:gap-2">
                <span className="hidden sm:inline">GENERATE RENDER</span>
                <span className="sm:hidden">GENERATE</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </span>
            )}
          </Button>
        </>
      )}
        </>
      )}

      {/* Toast "Bientôt disponible" pour le catalogue */}
      {showCatalogToast && (
        <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-[100] animate-in slide-in-from-bottom-2 fade-in duration-300">
          <div className="bg-black/90 backdrop-blur-sm border border-white/20 px-4 py-3 rounded-none shadow-lg">
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse flex-shrink-0" />
              <p className="text-xs sm:text-sm font-mono text-white">
                Coming soon
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
