"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  X,
  Download,
  Heart,
  Trash2,
  Wand2,
  Clapperboard,
  Play,
  FolderInput,
  Inbox,
  Loader2,
  Sparkles,
  Copy,
  Check,
  Ratio,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Info,
  Calendar,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ASPECT_RATIOS,
  AspectRatio,
  DEFAULT_IMAGE_OUTPUT_SIZE,
  IMAGE_OUTPUT_SIZES,
  ImageOutputSize,
  isValidImageOutputSize,
} from "@/lib/api/gemini-image-config";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { Render4KBadge, renderShows4KBadge } from "@/components/render-4k-badge";
import { cn } from "@/lib/utils";

interface RenderMetadata {
  aspectRatio?: string;
  imageSize?: string;
  pipeline?: string;
  magnificCreativity?: number;
  magnificScale?: number;
  magnificAdjustMode?: "resemblance" | "creativity";
  magnificStyleValue?: number;
  magnificResemblanceValue?: number;
  magnificCreativityValue?: number;
  upscale_error?: string;
  upscale_started_at?: string;
  favorite?: boolean;
  video_status?: "processing" | "completed" | "failed";
  video_url?: string;
  video_error?: string;
  video_prompt?: string;
  [key: string]: unknown;
}

interface Render {
  id: string;
  original_image_url: string | null;
  generated_image_url: string | null;
  upscaled_image_url: string | null;
  prompt: string | null;
  status: string;
  created_at: string;
  project_id: string | null;
  metadata?: RenderMetadata;
}

interface Project {
  id: string;
  name: string;
}

export type StudioPreviewVariant = "standard" | "4k" | "video";

interface RenderStudioProps {
  render: Render;
  projects: Project[];
  /** Renders in the current gallery order (same filter as profile). Used for prev/next and thumbnails. */
  galleryRenders?: Render[];
  /** When opening from a gallery tile, match preview to that tile (photo / 4K / video). */
  previewVariant?: StudioPreviewVariant;
  onClose: () => void;
  onRenderUpdate: (updated: Render) => void;
  onRenderDelete: (renderId: string) => void;
  onNewRenderCreated: () => void;
  onRenderQueued?: (renderId: string) => void;
  /** Switch studio to another render (keyboard, arrows, carousel). */
  onNavigateToRender?: (render: Render) => void;
  /** Compte sans quotas (ex. créateur) : nouveau 4K même si un upscale existe déjà. */
  billingUnlimited?: boolean;
  /** Mobile (max-lg) : ouverture depuis l’aperçu galerie — panneau outils plein écran, aperçu image masqué. */
  mobileLaunchToolsFullscreen?: boolean;
  /** Mobile (max-lg) : carte centrée + fond assombri (aperçu galerie visible derrière). */
  mobileFloatingSheet?: boolean;
}

function thumbUrlForRender(r: Render): string | null {
  return (
    r.upscaled_image_url ||
    r.generated_image_url ||
    r.original_image_url ||
    null
  );
}

export function RenderStudio({
  render,
  projects,
  galleryRenders,
  previewVariant,
  onClose,
  onRenderUpdate,
  onRenderDelete,
  onNewRenderCreated,
  onRenderQueued,
  onNavigateToRender,
  billingUnlimited = false,
  mobileLaunchToolsFullscreen = false,
  mobileFloatingSheet = false,
}: RenderStudioProps) {
  const [currentRender, setCurrentRender] = useState<Render>(render);
  const [modifyPrompt, setModifyPrompt] = useState("");
  const [modifyRatio, setModifyRatio] = useState<AspectRatio>(
    (render.metadata?.aspectRatio as AspectRatio) || "1:1"
  );
  const [modifyImageSize, setModifyImageSize] = useState<ImageOutputSize>(() => {
    const m = render.metadata?.imageSize;
    return typeof m === "string" && isValidImageOutputSize(m) ? m : DEFAULT_IMAGE_OUTPUT_SIZE;
  });
  /** True only while the /api/generate request is in flight (not the whole pipeline). */
  const [isSubmittingModify, setIsSubmittingModify] = useState(false);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  /** Render id for which we are polling video generation — overlay only when it matches the current view. */
  const [videoGeneratingForRenderId, setVideoGeneratingForRenderId] = useState<string | null>(null);
  const [isFavoriting, setIsFavoriting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [showRatioMenu, setShowRatioMenu] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showUpscaleToast, setShowUpscaleToast] = useState(false);
  const [viewingUpscaled, setViewingUpscaled] = useState(false);
  const [mobilePanelCollapsed, setMobilePanelCollapsed] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const touchDeltaY = useRef(0);
  const isDragging = useRef(false);

  const handlePanelTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchDeltaY.current = 0;
    isDragging.current = false;
  }, []);

  const handlePanelTouchMove = useCallback((e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - touchStartY.current;
    touchDeltaY.current = delta;
    if (Math.abs(delta) > 10) isDragging.current = true;
  }, []);

  const handlePanelTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    const threshold = 60;
    if (mobilePanelCollapsed) {
      if (touchDeltaY.current < -threshold) setMobilePanelCollapsed(false);
    } else {
      if (touchDeltaY.current > threshold) setMobilePanelCollapsed(true);
    }
    isDragging.current = false;
  }, [mobilePanelCollapsed]);

  const isProcessing = currentRender.status === "processing" || currentRender.status === "pending";
  const shouldPollRenderStatus =
    isProcessing || currentRender.status === "upscaling";

  const navigableRenders = useMemo(() => {
    const list = galleryRenders ?? [];
    const merged = list.map((r) => (r.id === currentRender.id ? currentRender : r));
    if (!merged.length) return currentRender ? [currentRender] : [];
    if (merged.some((r) => r.id === currentRender.id)) return merged;
    return [currentRender, ...merged];
  }, [galleryRenders, currentRender]);

  const currentNavIndex = useMemo(
    () => navigableRenders.findIndex((r) => r.id === currentRender.id),
    [navigableRenders, currentRender.id]
  );

  const canNavigate = Boolean(onNavigateToRender) && navigableRenders.length > 1;
  const canGoPrev = canNavigate && currentNavIndex > 0;
  const canGoNext = canNavigate && currentNavIndex >= 0 && currentNavIndex < navigableRenders.length - 1;

  const goPrev = useCallback(() => {
    if (!canGoPrev || !onNavigateToRender) return;
    onNavigateToRender(navigableRenders[currentNavIndex - 1]);
  }, [canGoPrev, currentNavIndex, navigableRenders, onNavigateToRender]);

  const goNext = useCallback(() => {
    if (!canGoNext || !onNavigateToRender) return;
    onNavigateToRender(navigableRenders[currentNavIndex + 1]);
  }, [canGoNext, currentNavIndex, navigableRenders, onNavigateToRender]);

  const thumbStripRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setCurrentRender(render);
  }, [render]);

  useEffect(() => {
    if (mobileLaunchToolsFullscreen) setMobilePanelCollapsed(false);
  }, [mobileLaunchToolsFullscreen, render.id]);

  useEffect(() => {
    setModifyPrompt("");
    setShowMoveMenu(false);
    setShowRatioMenu(false);
    setCopiedPrompt(false);
    setMobilePanelCollapsed(false);

    const hasVid = Boolean(render.metadata?.video_url);
    const hasUp =
      Boolean(render.upscaled_image_url) &&
      render.upscaled_image_url !== render.generated_image_url;

    if (previewVariant === "video" && hasVid) {
      setShowVideo(true);
      setViewingUpscaled(false);
    } else if (previewVariant === "4k" && hasUp) {
      setShowVideo(false);
      setViewingUpscaled(true);
    } else {
      setShowVideo(false);
      setViewingUpscaled(false);
    }
    const ar = render.metadata?.aspectRatio;
    if (typeof ar === "string" && ASPECT_RATIOS.some((r) => r.value === ar)) {
      setModifyRatio(ar as AspectRatio);
    } else {
      setModifyRatio("1:1");
    }
    const sz = render.metadata?.imageSize;
    setModifyImageSize(
      typeof sz === "string" && isValidImageOutputSize(sz) ? sz : DEFAULT_IMAGE_OUTPUT_SIZE
    );
  }, [
    render.id,
    previewVariant,
    render.metadata?.video_url,
    render.metadata?.aspectRatio,
    render.metadata?.imageSize,
    render.upscaled_image_url,
    render.generated_image_url,
  ]);

  // Poll génération HD, pending, ou upscale 4K en cours
  useEffect(() => {
    if (!shouldPollRenderStatus) return;
    let cancelled = false;
    const poll = async () => {
      while (!cancelled) {
        await new Promise((r) => setTimeout(r, 2000));
        if (cancelled) return;
        try {
          const res = await fetch(`/api/render/${currentRender.id}`);
          if (!res.ok) continue;
          const data = await res.json();
          const updated = data.render ?? data;
          if (updated && updated.id) {
            setCurrentRender(updated);
            onRenderUpdate(updated);
            const busy =
              updated.status === "processing" ||
              updated.status === "pending" ||
              updated.status === "upscaling";
            if (!busy) {
              if (updated.status === "completed") onNewRenderCreated();
              return;
            }
          }
        } catch {
          /* continue polling */
        }
      }
    };
    poll();
    return () => {
      cancelled = true;
    };
  }, [currentRender.id, shouldPollRenderStatus, onNewRenderCreated, onRenderUpdate]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      const target = e.target as HTMLElement | null;
      if (
        target?.closest("textarea, input, select, [contenteditable=true]")
      ) {
        return;
      }
      if (e.key === "ArrowLeft" && canGoPrev) {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight" && canGoNext) {
        e.preventDefault();
        goNext();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, canGoPrev, canGoNext, goPrev, goNext]);

  useEffect(() => {
    if (!thumbStripRef.current || currentNavIndex < 0) return;
    const el = thumbStripRef.current.querySelector(
      `[data-thumb-index="${currentNavIndex}"]`
    );
    el?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [currentNavIndex, currentRender.id]);

  useEffect(() => {
    if (showUpscaleToast) {
      const timer = setTimeout(() => setShowUpscaleToast(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showUpscaleToast]);

  const isUpscaled =
    currentRender.upscaled_image_url &&
    currentRender.upscaled_image_url !== currentRender.generated_image_url;
  const isFavorite = Boolean(currentRender.metadata?.favorite);
  const hasVideo = Boolean(currentRender.metadata?.video_url);
  const videoProcessing = currentRender.metadata?.video_status === "processing";
  const isVideoBusyForCurrentView =
    videoProcessing ||
    (isGeneratingVideo && videoGeneratingForRenderId === currentRender.id);
  const canUpscale =
    currentRender.status === "completed" &&
    currentRender.generated_image_url &&
    (!isUpscaled || billingUnlimited) &&
    !showVideo;

  const displayImageUrl = viewingUpscaled && isUpscaled
    ? currentRender.upscaled_image_url!
    : currentRender.generated_image_url;

  const downloadMedia = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, "_blank");
    }
  };

  const copyPrompt = () => {
    if (currentRender.prompt) {
      navigator.clipboard.writeText(currentRender.prompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    }
  };

  const handleModify = async () => {
    if (!modifyPrompt.trim() || !currentRender.generated_image_url) return;
    setIsSubmittingModify(true);

    try {
      const images = [{ url: currentRender.generated_image_url, role: "main" }];

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images,
          prompt: modifyPrompt.trim(),
          aspectRatio: modifyRatio,
          imageSize: modifyImageSize,
          projectId: currentRender.project_id || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || "Generation failed");
      }

      const { renderId } = await res.json();
      onRenderQueued?.(renderId);

      const statusRes = await fetch(`/api/render/${renderId}`);
      if (!statusRes.ok) throw new Error("Could not load new render");
      const data = await statusRes.json();
      const newRender = (data as { render?: Render }).render ?? (data as Render);
      if (!newRender?.id) throw new Error("Invalid render response");

      onRenderUpdate(newRender);
      setModifyPrompt("");
      onNavigateToRender?.(newRender);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Modification failed");
    } finally {
      setIsSubmittingModify(false);
    }
  };

  const handleUpscale = async () => {
    if (!canUpscale || isUpscaling) return;
    setIsUpscaling(true);
    try {
      const m = currentRender.metadata;
      const rawScale = m?.magnificScale;
      const scale =
        typeof rawScale === "number" && [2, 4, 8, 16].includes(rawScale) ? rawScale : 4;
      const body: Record<string, unknown> = { renderId: currentRender.id, scale };
      if (typeof m?.magnificResemblanceValue === "number") {
        body.magnificResemblanceValue = m.magnificResemblanceValue;
      }
      if (typeof m?.magnificCreativityValue === "number") {
        body.magnificCreativityValue = m.magnificCreativityValue;
      }
      const res = await fetch("/api/upscale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Upscale failed");
      }
      const snap = await fetch(`/api/render/${currentRender.id}`);
      if (snap.ok) {
        const j = await snap.json();
        const u = j.render ?? j;
        if (u?.id) {
          setCurrentRender(u);
          onRenderUpdate(u);
        }
      }
      setShowUpscaleToast(true);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upscale failed");
    } finally {
      setIsUpscaling(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (isGeneratingVideo || videoProcessing) return;
    const targetRenderId = currentRender.id;
    setVideoGeneratingForRenderId(targetRenderId);
    setIsGeneratingVideo(true);

    try {
      const res = await fetch("/api/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          renderId: targetRenderId,
          prompt: currentRender.prompt || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Video generation failed");
      }

      let attempts = 0;
      const maxAttempts = 80;
      while (attempts < maxAttempts) {
        attempts++;
        await new Promise((r) => setTimeout(r, 3000));
        if (!isMountedRef.current) break;
        const statusRes = await fetch(`/api/render/${targetRenderId}`);
        if (!statusRes.ok) continue;
        const updated = await statusRes.json();
        onRenderUpdate(updated);
        if (isMountedRef.current) {
          setCurrentRender((prev) => (prev.id === targetRenderId ? updated : prev));
        }

        if (updated.metadata?.video_status === "completed" && updated.metadata?.video_url) {
          break;
        }
        if (updated.metadata?.video_status === "failed") {
          throw new Error(updated.metadata?.video_error || "Video generation failed");
        }
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Video generation failed");
    } finally {
      setIsGeneratingVideo(false);
      setVideoGeneratingForRenderId(null);
    }
  };

  const handleToggleFavorite = async () => {
    setIsFavoriting(true);
    const nextFav = !isFavorite;
    try {
      const res = await fetch(`/api/render/${currentRender.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: nextFav }),
      });
      if (!res.ok) throw new Error("Failed to update favorite");

      const updated = {
        ...currentRender,
        metadata: { ...(currentRender.metadata || {}), favorite: nextFav },
      };
      setCurrentRender(updated);
      onRenderUpdate(updated);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed");
    } finally {
      setIsFavoriting(false);
    }
  };

  const handleMoveToProject = async (projectId: string | null) => {
    try {
      const res = await fetch(`/api/render/${currentRender.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId }),
      });
      if (!res.ok) throw new Error("Failed to move");
      const updated = { ...currentRender, project_id: projectId };
      setCurrentRender(updated);
      onRenderUpdate(updated);
      setShowMoveMenu(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed");
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/render/${currentRender.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      const deletedId = currentRender.id;
      const idx = navigableRenders.findIndex((r) => r.id === deletedId);
      const remaining = navigableRenders.filter((r) => r.id !== deletedId);
      onRenderDelete(deletedId);
      if (remaining.length > 0 && onNavigateToRender) {
        const nextIdx = Math.min(Math.max(idx, 0), remaining.length - 1);
        onNavigateToRender(remaining[nextIdx]);
      } else {
        onClose();
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const currentProjectName =
    projects.find((p) => p.id === currentRender.project_id)?.name || null;

  const toolsPanelMobileSlim =
    !mobileLaunchToolsFullscreen && mobilePanelCollapsed;

  const studioZ = mobileFloatingSheet
    ? "z-[250]"
    : mobileLaunchToolsFullscreen
      ? "z-[220]"
      : "z-[120]";

  return (
    <div
      className={cn(
        "fixed inset-0 flex min-h-0 flex-col overflow-hidden lg:flex-row",
        studioZ,
        mobileFloatingSheet
          ? "max-lg:items-center max-lg:justify-center max-lg:bg-transparent max-lg:p-2 lg:bg-background"
          : "bg-background"
      )}
    >
      {mobileFloatingSheet && (
        <button
          type="button"
          className="absolute inset-0 z-0 hidden max-lg:block bg-black/45 backdrop-blur-[2px]"
          aria-label="Fermer le studio"
          onClick={onClose}
        />
      )}
      <div
        className={cn(
          "relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row",
          mobileFloatingSheet &&
            "max-lg:max-h-[min(92dvh,calc(100dvh-1rem))] max-lg:w-full max-lg:max-w-lg max-lg:overflow-hidden max-lg:rounded-2xl max-lg:border max-lg:border-border max-lg:bg-card max-lg:shadow-2xl lg:max-h-none lg:max-w-none lg:rounded-none lg:border-0 lg:shadow-none lg:bg-background"
        )}
      >
      {/* Top bar (mobile) */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-card/95 px-3 py-2 backdrop-blur-sm lg:hidden">
        <span className="max-w-[180px] truncate font-mono text-xs text-muted-foreground">
          Render Studio
        </span>
        <div className="flex items-center gap-1">
          {!isProcessing && displayImageUrl && (
            <button
              onClick={() => {
                const url = isUpscaled
                  ? currentRender.upscaled_image_url!
                  : currentRender.generated_image_url!;
                if (url) downloadMedia(url, `renderz-${currentRender.id}.png`);
              }}
              className="rounded p-1.5 transition-colors hover:bg-muted"
            >
              <Download className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
          <button onClick={onClose} className="rounded p-1.5 transition-colors hover:bg-muted">
            <X className="h-4 w-4 text-foreground" />
          </button>
        </div>
      </div>

      {/* Main area: preview (left) + tools (right). On mobile, preview must not use flex-1 alone or the tools panel is pushed off-screen (overflow-hidden). */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:min-h-0 lg:flex-row">
      {/* Left: Image viewer + carousel */}
      <div
        className={`flex min-h-0 flex-col overflow-hidden lg:min-h-0 lg:flex-1 ${
          mobileLaunchToolsFullscreen ? "max-lg:hidden" : ""
        } ${
          mobilePanelCollapsed
            ? "min-h-0 flex-1"
            : "max-h-[min(62vh,100%)] shrink-0 lg:max-h-none lg:min-h-0 lg:flex-1"
        }`}
      >
        <div
          className={`relative flex min-h-0 flex-1 items-center justify-center bg-gradient-to-b from-muted/70 via-muted/40 to-background p-2 transition-all duration-300 sm:p-4 lg:p-8 ${
            mobilePanelCollapsed
              ? "max-h-none"
              : canNavigate
                ? "max-h-[calc(62vh-6rem)]"
                : "max-h-[min(50vh,52dvh)]"
          } lg:max-h-none lg:min-h-0`}
        >
          {/* Desktop close button */}
          <button
            onClick={onClose}
            className="absolute left-4 top-4 z-10 hidden rounded-md border border-border bg-card/90 p-2 shadow-sm transition-colors hover:bg-muted lg:flex"
          >
            <X className="h-5 w-5 text-foreground" />
          </button>

          {canGoPrev && (
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-1 top-1/2 z-20 -translate-y-1/2 rounded-full border border-border bg-card/95 p-2 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-muted sm:left-2 lg:left-3"
              aria-label="Previous render"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          )}
          {canGoNext && (
            <button
              type="button"
              onClick={goNext}
              className="absolute right-1 top-1/2 z-20 -translate-y-1/2 rounded-full border border-border bg-card/95 p-2 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-muted sm:right-2 lg:right-3"
              aria-label="Next render"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          )}

        {showVideo && hasVideo ? (
          <div className="animate-in fade-in zoom-in-95 relative flex max-h-full max-w-full flex-col items-center justify-center duration-300">
            <div className="relative max-h-[min(78dvh,88vh)] max-w-full overflow-hidden rounded-lg border border-border bg-card shadow-lg ring-1 ring-border/60 lg:max-h-[min(calc(100vh-8rem),92vh)]">
              <video
                src={currentRender.metadata?.video_url as string}
                controls
                autoPlay
                loop
                className="max-h-[min(78dvh,88vh)] w-auto max-w-full object-contain lg:max-h-[min(calc(100vh-8rem),92vh)]"
              />
            </div>
          </div>
        ) : displayImageUrl ? (
          <div className="animate-in fade-in zoom-in-95 relative flex max-h-full max-w-full flex-col items-center justify-center duration-300">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_45%,hsl(var(--foreground)/0.04)_0%,transparent_65%)]" />
            <div className="relative max-h-[min(78dvh,88vh)] max-w-full overflow-hidden rounded-lg border border-border bg-card shadow-lg ring-1 ring-border/60 lg:max-h-[min(calc(100vh-8rem),92vh)]">
              <img
                src={displayImageUrl}
                alt="Render"
                className="block max-h-[min(78dvh,88vh)] w-auto max-w-full object-contain lg:max-h-[min(calc(100vh-8rem),92vh)]"
                draggable={false}
              />
            </div>
          </div>
        ) : isProcessing ? (
          <div className="flex flex-col items-center gap-5">
            <div className="relative">
              <div className="h-20 w-20 rounded-full border-4 border-muted" />
              <div className="absolute inset-0 h-20 w-20 animate-spin rounded-full border-4 border-t-foreground border-r-transparent border-b-transparent border-l-transparent" />
              <Sparkles className="absolute inset-0 m-auto h-6 w-6 animate-pulse text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-mono text-sm text-muted-foreground">Generating render...</p>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground/70">This may take a few minutes</p>
            </div>
          </div>
        ) : (
          <div className="font-mono text-sm text-muted-foreground">No image available</div>
        )}

        {/* Image/Video toggle & quality badge */}
        <div className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2">
          {isUpscaled && (
            <button
              onClick={() => setViewingUpscaled(!viewingUpscaled)}
              className={`rounded px-3 py-1.5 font-mono text-[10px] transition-colors ${
                viewingUpscaled
                  ? "bg-green-600 text-white shadow-sm"
                  : "border border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {viewingUpscaled ? "4K" : "STD"}
            </button>
          )}
          {hasVideo && (
            <button
              onClick={() => setShowVideo(!showVideo)}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 font-mono text-[10px] transition-colors ${
                showVideo
                  ? "bg-purple-600 text-white shadow-sm"
                  : "border border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              <Play className="w-3 h-3" />
              {showVideo ? "VIDEO" : "PHOTO"}
            </button>
          )}
        </div>

        {/* Video generation in progress — only on the render being animated (navigate away = no overlay) */}
        {isGeneratingVideo &&
          videoGeneratingForRenderId === currentRender.id && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-muted" />
                <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent" />
                <Clapperboard className="absolute inset-0 m-auto h-6 w-6 text-purple-600" />
              </div>
              <p className="font-mono text-sm text-foreground">Generating video…</p>
            </div>
          )}
        </div>

        {/* Thumbnail strip — jump to any render in the current gallery */}
        {canNavigate && (
          <div className="flex-shrink-0 border-t border-border bg-muted/30 px-1.5 py-2">
            <div
              ref={thumbStripRef}
              className="flex max-w-full gap-1.5 overflow-x-auto overflow-y-hidden pb-0.5 [scrollbar-width:thin]"
            >
              {navigableRenders.map((r, i) => {
                const thumb = thumbUrlForRender(r);
                const active = r.id === currentRender.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    data-thumb-index={i}
                    onClick={() => onNavigateToRender?.(r)}
                    className={`relative h-12 w-12 shrink-0 overflow-hidden rounded border-2 transition-colors sm:h-14 sm:w-14 ${
                      active
                        ? "border-foreground ring-1 ring-ring/40"
                        : "border-border opacity-80 hover:border-foreground/40 hover:opacity-100"
                    }`}
                  >
                    {thumb ? (
                      <img src={thumb} alt="" className="h-full w-full object-cover" draggable={false} />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted/50">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    {renderShows4KBadge(r) && (
                      <Render4KBadge compact className="absolute left-0.5 top-0.5 z-[1]" />
                    )}
                    {r.metadata?.video_url && (
                      <span className="absolute bottom-0.5 right-0.5 rounded bg-foreground/85 p-0.5">
                        <Play className="h-2 w-2 text-background" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Right: Studio panel */}
      <div
        ref={panelRef}
        className={`w-full border-t border-border bg-card backdrop-blur-sm transition-all duration-300 ease-out lg:w-[380px] xl:w-[420px] lg:shrink-0 lg:border-l ${
          mobileLaunchToolsFullscreen
            ? "flex min-h-0 flex-1 flex-col overflow-y-auto pb-[max(0.75rem,env(safe-area-inset-bottom))] max-lg:border-t-0 lg:h-auto lg:max-h-none lg:flex-none"
            : toolsPanelMobileSlim
            ? "h-12 max-h-12 shrink-0 overflow-hidden lg:h-auto lg:max-h-none lg:overflow-y-auto"
            : "flex min-h-0 flex-1 flex-col overflow-y-auto lg:h-auto lg:max-h-none lg:flex-none lg:overflow-y-auto"
        }`}
      >
        {/* Mobile drag handle */}
        {!mobileLaunchToolsFullscreen && (
        <div
          className="lg:hidden flex flex-col items-center pt-2 pb-1 cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={handlePanelTouchStart}
          onTouchMove={handlePanelTouchMove}
          onTouchEnd={handlePanelTouchEnd}
          onClick={() => setMobilePanelCollapsed(!mobilePanelCollapsed)}
        >
          <div className="mb-1 h-1 w-10 rounded-full bg-muted-foreground/25" />
          <div className="flex items-center gap-1.5">
            <ChevronUp className={`h-3 w-3 text-muted-foreground transition-transform duration-300 ${mobilePanelCollapsed ? "rotate-180" : ""}`} />
            <span className="font-mono text-[10px] text-muted-foreground">
              {mobilePanelCollapsed ? "Show tools" : "Hide tools"}
            </span>
          </div>
        </div>
        )}
        <div className="p-3 sm:p-4 lg:p-5 pb-8 lg:pb-5 space-y-4 lg:space-y-6 pt-0 lg:pt-5">
          {/* Header with close (desktop) */}
          <div className="hidden items-center justify-between lg:flex">
            <h2 className="font-mono text-sm uppercase tracking-wider text-foreground">
              Render Studio
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const url = isUpscaled
                    ? currentRender.upscaled_image_url!
                    : currentRender.generated_image_url!;
                  if (url) downloadMedia(url, `renderz-${currentRender.id}.png`);
                }}
                className="rounded p-2 transition-colors hover:bg-muted"
                title="Download"
                disabled={isProcessing}
              >
                <Download className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Processing state message */}
          {isProcessing && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <div>
                <p className="font-mono text-xs text-muted-foreground">Your render is being generated</p>
                <p className="mt-1 font-mono text-[10px] text-muted-foreground/80">Tools will be available once the render is ready</p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                className="mt-1 px-3 py-2 rounded font-mono text-[10px] bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25 transition-colors flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
                DELETE RENDER
              </button>
            </div>
          )}

          {/* All tools hidden during processing */}
          {!isProcessing && currentRender.prompt && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                  Prompt
                </span>
                <button
                  onClick={copyPrompt}
                  className="p-1 hover:bg-muted rounded transition-colors"
                  title="Copy prompt"
                >
                  {copiedPrompt ? (
                    <Check className="w-3 h-3 text-green-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-muted-foreground" />
                  )}
                </button>
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed font-mono bg-muted/50 p-2 sm:p-3 rounded border border-border line-clamp-3 lg:line-clamp-none">
                {currentRender.prompt}
              </p>
            </div>
          )}

          {/* All tool sections - disabled during processing */}
          {!isProcessing && (<>
          {/* Modify section */}
          <div className="space-y-2 lg:space-y-3">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              Modify this render
            </span>
            <Textarea
              value={modifyPrompt}
              onChange={(e) => setModifyPrompt(e.target.value.slice(0, 500))}
              placeholder="Describe what you want to change..."
              className="min-h-[60px] resize-none rounded border border-border bg-background font-mono text-xs text-foreground placeholder:text-muted-foreground focus:border-ring lg:min-h-[80px]"
              disabled={isSubmittingModify}
            />
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
              {/* Aspect ratio selector */}
              <div className="relative">
                <button
                  onClick={() => setShowRatioMenu(!showRatioMenu)}
                  className="h-9 px-3 flex items-center gap-1.5 text-[10px] font-mono border border-border rounded bg-muted/50 text-muted-foreground hover:bg-muted transition-colors"
                  disabled={isSubmittingModify}
                >
                  <Ratio className="w-3 h-3" />
                  <span>{modifyRatio}</span>
                  <ChevronDown className="w-2.5 h-2.5" />
                </button>
                {showRatioMenu && (
                  <div className="absolute bottom-full left-0 z-50 mb-1.5 min-w-[160px] max-h-[min(50vh,220px)] overflow-y-auto rounded border border-border bg-popover p-1 text-popover-foreground shadow-2xl">
                    {ASPECT_RATIOS.map((ratio) => (
                      <button
                        key={ratio.value}
                        onClick={() => {
                          setModifyRatio(ratio.value);
                          setShowRatioMenu(false);
                        }}
                        className={`flex w-full items-center justify-between rounded px-3 py-1.5 text-left font-mono text-[10px] transition-all ${
                          modifyRatio === ratio.value
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <span>{ratio.label}</span>
                        <span className="text-[9px] opacity-60">{ratio.value}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={handleModify}
                disabled={!modifyPrompt.trim() || isSubmittingModify}
                className="h-9 flex-1 font-mono text-xs tracking-wider"
              >
                {isSubmittingModify ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    GENERATE
                  </>
                )}
              </Button>
              </div>
              <div className="flex gap-1">
                {IMAGE_OUTPUT_SIZES.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={isSubmittingModify}
                    onClick={() => setModifyImageSize(opt.value)}
                    className={`flex-1 rounded border py-1.5 font-mono text-[9px] transition-colors ${
                      modifyImageSize === opt.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-border" />

          {/* Enhance section */}
          <div className="space-y-2 lg:space-y-3">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              Enhance
            </span>
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              {/* Upscale 4K */}
              <button
                onClick={handleUpscale}
                disabled={isUpscaling || !canUpscale}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded font-mono text-[10px] sm:text-xs transition-all ${
                  isUpscaled && !billingUnlimited
                    ? "bg-green-500/15 text-green-400 border border-green-500/20"
                    : canUpscale
                      ? "bg-muted/50 text-muted-foreground border border-border hover:bg-muted"
                      : "bg-muted/50 text-muted-foreground/40 border border-border cursor-not-allowed"
                }`}
              >
                {isUpscaling ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Wand2 className="w-3.5 h-3.5" />
                )}
                {isUpscaled
                  ? billingUnlimited
                    ? "REFAIRE 4K"
                    : "4K DONE"
                  : "UPSCALE 4K"}
              </button>

              {/* Generate Video */}
              <button
                onClick={handleGenerateVideo}
                disabled={isVideoBusyForCurrentView}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded font-mono text-[10px] sm:text-xs transition-all ${
                  hasVideo
                    ? "bg-purple-500/15 text-purple-400 border border-purple-500/20"
                    : "bg-muted/50 text-muted-foreground border border-border hover:bg-muted"
                }`}
              >
                {isVideoBusyForCurrentView ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Clapperboard className="w-3.5 h-3.5" />
                )}
                {hasVideo ? "VIDEO DONE" : isVideoBusyForCurrentView ? "PROCESSING..." : "ANIMATE"}
              </button>
            </div>

            {/* Video actions if video exists */}
            {hasVideo && (
              <div className="flex gap-1.5 sm:gap-2">
                <button
                  onClick={() => setShowVideo(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded font-mono text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
                >
                  <Play className="w-3 h-3" />
                  PLAY VIDEO
                </button>
                <button
                  onClick={() =>
                    downloadMedia(
                      currentRender.metadata?.video_url as string,
                      `renderz-video-${currentRender.id}.mp4`
                    )
                  }
                  className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded font-mono text-[10px] bg-muted/50 text-muted-foreground border border-border hover:bg-muted transition-colors"
                >
                  <Download className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Separator */}
          <div className="border-t border-border" />

          {/* Actions section */}
          <div className="space-y-2 lg:space-y-3">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              Actions
            </span>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {/* Favorite */}
              <button
                onClick={handleToggleFavorite}
                disabled={isFavoriting}
                className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded font-mono text-[10px] transition-all ${
                  isFavorite
                    ? "bg-pink-500/15 text-pink-400 border border-pink-500/20"
                    : "bg-muted/50 text-muted-foreground border border-border hover:bg-muted"
                }`}
              >
                {isFavoriting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Heart className={`w-3 h-3 ${isFavorite ? "fill-current" : ""}`} />
                )}
                {isFavorite ? "FAVORITED" : "FAVORITE"}
              </button>

              {/* Move to project */}
              <div className="relative">
                <button
                  onClick={() => setShowMoveMenu(!showMoveMenu)}
                  className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded font-mono text-[10px] bg-muted/50 text-muted-foreground border border-border hover:bg-muted transition-all"
                >
                  <FolderInput className="w-3 h-3" />
                  MOVE
                </button>
                {showMoveMenu && (
                  <div className="absolute bottom-full left-0 z-30 mb-1.5 min-w-[180px] max-h-[200px] overflow-y-auto rounded border border-border bg-popover py-1 text-popover-foreground shadow-2xl">
                    <button
                      onClick={() => handleMoveToProject(null)}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs font-mono hover:bg-muted transition-colors text-left ${
                        !currentRender.project_id ? "text-muted-foreground/70" : "text-muted-foreground"
                      }`}
                      disabled={!currentRender.project_id}
                    >
                      <Inbox className="w-3 h-3 flex-shrink-0" />
                      Unassigned
                    </button>
                    {projects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleMoveToProject(p.id)}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs font-mono hover:bg-muted transition-colors text-left ${
                          currentRender.project_id === p.id
                            ? "text-muted-foreground/70"
                            : "text-muted-foreground"
                        }`}
                        disabled={currentRender.project_id === p.id}
                      >
                        <FolderInput className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{p.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Download */}
              <button
                onClick={() => {
                  if (displayImageUrl)
                    downloadMedia(displayImageUrl, `renderz-${currentRender.id}.png`);
                }}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded font-mono text-[10px] bg-muted/50 text-muted-foreground border border-border hover:bg-muted transition-all"
              >
                <Download className="w-3 h-3" />
                DOWNLOAD
              </button>

              {/* Delete */}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded font-mono text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
              >
                <Trash2 className="w-3 h-3" />
                DELETE
              </button>
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-border" />

          {/* Info section */}
          <div className="space-y-2 lg:space-y-3">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              Details
            </span>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(currentRender.created_at)}</span>
              </div>
              {currentRender.metadata?.aspectRatio && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Ratio className="w-3 h-3" />
                  <span>
                    {currentRender.metadata.pipeline === "magnific"
                      ? "3D · "
                      : currentRender.metadata.pipeline === "gemini"
                        ? "Plan/photo · "
                        : ""}
                    {currentRender.metadata.aspectRatio}
                    {currentRender.metadata?.imageSize &&
                    isValidImageOutputSize(String(currentRender.metadata.imageSize))
                      ? ` · ${currentRender.metadata.imageSize}`
                      : ""}
                    {typeof currentRender.metadata.magnificScale === "number"
                      ? ` · ${currentRender.metadata.magnificScale}×`
                      : ""}
                    {typeof currentRender.metadata.magnificCreativity === "number" &&
                    currentRender.metadata.magnificResemblanceValue === undefined &&
                    currentRender.metadata.magnificCreativityValue === undefined
                      ? ` · creativity ${
                          currentRender.metadata.magnificCreativity > 0 ? "+" : ""
                        }${currentRender.metadata.magnificCreativity}`
                      : ""}
                    {(() => {
                      const r = currentRender.metadata.magnificResemblanceValue;
                      const c = currentRender.metadata.magnificCreativityValue;
                      if (typeof r === "number" || typeof c === "number") {
                        const rr = typeof r === "number" ? r : 0;
                        const cc = typeof c === "number" ? c : 0;
                        return ` · fid ${rr > 0 ? "+" : ""}${rr} · expr ${cc > 0 ? "+" : ""}${cc}`;
                      }
                      if (typeof currentRender.metadata.magnificStyleValue === "number") {
                        const v = currentRender.metadata.magnificStyleValue;
                        return ` · ${v > 0 ? "+" : ""}${v}`;
                      }
                      return "";
                    })()}
                  </span>
                </div>
              )}
              {currentProjectName && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Tag className="w-3 h-3" />
                  <span>{currentProjectName}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Info className="w-3 h-3" />
                <div className="flex gap-1.5">
                  <span
                    className={`px-1.5 py-0.5 text-[9px] ${
                      currentRender.status === "completed"
                        ? "bg-green-500/20 text-green-400"
                        : currentRender.status === "failed"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    } rounded`}
                  >
                    {currentRender.status.toUpperCase()}
                  </span>
                  {isUpscaled && (
                    <span className="px-1.5 py-0.5 text-[9px] bg-green-500/20 text-green-400 rounded">
                      4K
                    </span>
                  )}
                  {hasVideo && (
                    <span className="px-1.5 py-0.5 text-[9px] bg-purple-500/20 text-purple-400 rounded">
                      VIDEO
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          </>)}
        </div>
      </div>
      </div>
      </div>

      {/* Delete confirmation */}
      <ConfirmActionDialog
        open={showDeleteConfirm}
        title="Delete render?"
        description="This render will be permanently deleted."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        isLoading={isDeleting}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
      />

      {/* Upscale toast */}
      {showUpscaleToast && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[100] animate-in slide-in-from-bottom-2 fade-in duration-300">
          <div className="rounded border border-border bg-card px-3 py-2 shadow-lg backdrop-blur-sm sm:px-4 sm:py-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <Sparkles className="h-3.5 w-3.5 flex-shrink-0 animate-pulse text-amber-500 sm:h-4 sm:w-4" />
              <p className="font-mono text-[11px] text-foreground sm:text-xs">Coming soon</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
