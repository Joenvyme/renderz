"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
  Info,
  Calendar,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ASPECT_RATIOS, AspectRatio } from "@/lib/api/nano-banana";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";

interface RenderMetadata {
  aspectRatio?: string;
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

interface RenderStudioProps {
  render: Render;
  projects: Project[];
  onClose: () => void;
  onRenderUpdate: (updated: Render) => void;
  onRenderDelete: (renderId: string) => void;
  onNewRenderCreated: () => void;
  onRenderQueued?: (renderId: string) => void;
}

export function RenderStudio({
  render,
  projects,
  onClose,
  onRenderUpdate,
  onRenderDelete,
  onNewRenderCreated,
  onRenderQueued,
}: RenderStudioProps) {
  const [currentRender, setCurrentRender] = useState<Render>(render);
  const [modifyPrompt, setModifyPrompt] = useState("");
  const [modifyRatio, setModifyRatio] = useState<AspectRatio>(
    (render.metadata?.aspectRatio as AspectRatio) || "1:1"
  );
  const [isModifying, setIsModifying] = useState(false);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
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

  useEffect(() => {
    setCurrentRender(render);
  }, [render]);

  // Poll for processing renders until they complete
  useEffect(() => {
    if (!isProcessing) return;
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
            if (updated.status === "completed" || updated.status === "failed") {
              if (updated.status === "completed") onNewRenderCreated();
              return;
            }
          }
        } catch { /* continue polling */ }
      }
    };
    poll();
    return () => { cancelled = true; };
  }, [currentRender.id, isProcessing]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

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
  const canUpscale =
    currentRender.status === "completed" &&
    currentRender.generated_image_url &&
    !isUpscaled &&
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
    setIsModifying(true);

    try {
      const images = [{ url: currentRender.generated_image_url, role: "main" }];

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images,
          prompt: modifyPrompt.trim(),
          aspectRatio: modifyRatio,
          projectId: currentRender.project_id || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || "Generation failed");
      }

      const { renderId } = await res.json();
      onRenderQueued?.(renderId);

      let attempts = 0;
      const maxAttempts = 120;
      while (attempts < maxAttempts) {
        attempts++;
        await new Promise((r) => setTimeout(r, 2000));
        const statusRes = await fetch(`/api/render/${renderId}`);
        if (!statusRes.ok) continue;
        const updated = await statusRes.json();

        if (updated.generated_image_url) {
          setCurrentRender(updated);
          setModifyPrompt("");
          onNewRenderCreated();
          break;
        }
        if (updated.status === "failed") {
          throw new Error("Generation failed");
        }
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Modification failed");
    } finally {
      setIsModifying(false);
    }
  };

  const handleUpscale = async () => {
    setShowUpscaleToast(true);
    return;
    // Real upscale logic (currently disabled, same as profile page)
  };

  const handleGenerateVideo = async () => {
    if (isGeneratingVideo || videoProcessing) return;
    setIsGeneratingVideo(true);

    try {
      const res = await fetch("/api/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          renderId: currentRender.id,
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
        const statusRes = await fetch(`/api/render/${currentRender.id}`);
        if (!statusRes.ok) continue;
        const updated = await statusRes.json();
        setCurrentRender(updated);
        onRenderUpdate(updated);

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
      onRenderDelete(currentRender.id);
      onClose();
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

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col lg:flex-row overflow-hidden">
      {/* Top bar (mobile) */}
      <div className="flex items-center justify-between px-3 py-2 lg:hidden border-b border-white/10 flex-shrink-0">
        <span className="text-xs font-mono text-white/70 truncate max-w-[180px]">
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
              className="p-1.5 hover:bg-white/10 rounded transition-colors"
            >
              <Download className="w-4 h-4 text-white/70" />
            </button>
          )}
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Left: Image viewer */}
      <div className={`flex-1 relative flex items-center justify-center p-2 sm:p-4 lg:p-8 min-h-0 transition-all duration-300 ${mobilePanelCollapsed ? "max-h-none" : "max-h-[45vh]"} lg:max-h-none`}>
        {/* Desktop close button */}
        <button
          onClick={onClose}
          className="hidden lg:flex absolute top-4 left-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {showVideo && hasVideo ? (
          <video
            src={currentRender.metadata?.video_url as string}
            controls
            autoPlay
            loop
            className="max-w-full max-h-full object-contain rounded"
          />
        ) : displayImageUrl ? (
          <img
            src={displayImageUrl}
            alt="Render"
            className="max-w-full max-h-full object-contain"
          />
        ) : isProcessing ? (
          <div className="flex flex-col items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-white/10 rounded-full" />
              <div className="absolute inset-0 w-20 h-20 border-4 border-t-white border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
              <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-white animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-white/70 font-mono text-sm">Generating render...</p>
              <p className="text-white/30 font-mono text-[10px] mt-1">This may take a few minutes</p>
            </div>
          </div>
        ) : (
          <div className="text-white/40 font-mono text-sm">No image available</div>
        )}

        {/* Image/Video toggle & quality badge */}
        <div className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2">
          {isUpscaled && (
            <button
              onClick={() => setViewingUpscaled(!viewingUpscaled)}
              className={`px-3 py-1.5 text-[10px] font-mono rounded transition-colors ${
                viewingUpscaled
                  ? "bg-green-500 text-white"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              {viewingUpscaled ? "4K" : "STD"}
            </button>
          )}
          {hasVideo && (
            <button
              onClick={() => setShowVideo(!showVideo)}
              className={`px-3 py-1.5 text-[10px] font-mono rounded transition-colors flex items-center gap-1.5 ${
                showVideo
                  ? "bg-purple-500 text-white"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              <Play className="w-3 h-3" />
              {showVideo ? "VIDEO" : "PHOTO"}
            </button>
          )}
        </div>

        {/* Loading overlay for modify */}
        {isModifying && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-4 z-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-white/20 rounded-full" />
              <div className="absolute inset-0 w-16 h-16 border-4 border-t-white border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
              <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-white animate-pulse" />
            </div>
            <p className="text-white font-mono text-sm">Generating modification...</p>
          </div>
        )}
      </div>

      {/* Right: Studio panel */}
      <div
        ref={panelRef}
        className={`w-full lg:w-[380px] xl:w-[420px] border-t lg:border-t-0 lg:border-l border-white/10 bg-black/80 lg:bg-black/40 backdrop-blur-sm flex-shrink-0 transition-all duration-300 ease-out ${
          mobilePanelCollapsed
            ? "max-h-[48px] overflow-hidden"
            : "overflow-y-auto"
        } lg:max-h-none lg:overflow-y-auto`}
      >
        {/* Mobile drag handle */}
        <div
          className="lg:hidden flex flex-col items-center pt-2 pb-1 cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={handlePanelTouchStart}
          onTouchMove={handlePanelTouchMove}
          onTouchEnd={handlePanelTouchEnd}
          onClick={() => setMobilePanelCollapsed(!mobilePanelCollapsed)}
        >
          <div className="w-10 h-1 rounded-full bg-white/30 mb-1" />
          <div className="flex items-center gap-1.5">
            <ChevronUp className={`w-3 h-3 text-white/40 transition-transform duration-300 ${mobilePanelCollapsed ? "rotate-180" : ""}`} />
            <span className="text-[10px] font-mono text-white/40">
              {mobilePanelCollapsed ? "Show tools" : "Hide tools"}
            </span>
          </div>
        </div>
        <div className="p-3 sm:p-4 lg:p-5 pb-8 lg:pb-5 space-y-4 lg:space-y-6 pt-0 lg:pt-5">
          {/* Header with close (desktop) */}
          <div className="hidden lg:flex items-center justify-between">
            <h2 className="text-sm font-mono text-white/90 uppercase tracking-wider">
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
                className="p-2 hover:bg-white/10 rounded transition-colors"
                title="Download"
                disabled={isProcessing}
              >
                <Download className="w-4 h-4 text-white/70" />
              </button>
            </div>
          </div>

          {/* Processing state message */}
          {isProcessing && (
            <div className="py-8 flex flex-col items-center gap-4 text-center">
              <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
              <div>
                <p className="text-xs font-mono text-white/50">Your render is being generated</p>
                <p className="text-[10px] font-mono text-white/30 mt-1">Tools will be available once the render is ready</p>
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
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
                  Prompt
                </span>
                <button
                  onClick={copyPrompt}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  title="Copy prompt"
                >
                  {copiedPrompt ? (
                    <Check className="w-3 h-3 text-green-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-white/40" />
                  )}
                </button>
              </div>
              <p className="text-[11px] sm:text-xs text-white/60 leading-relaxed font-mono bg-white/5 p-2 sm:p-3 rounded border border-white/5 line-clamp-3 lg:line-clamp-none">
                {currentRender.prompt}
              </p>
            </div>
          )}

          {/* All tool sections - disabled during processing */}
          {!isProcessing && (<>
          {/* Modify section */}
          <div className="space-y-2 lg:space-y-3">
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
              Modify this render
            </span>
            <Textarea
              value={modifyPrompt}
              onChange={(e) => setModifyPrompt(e.target.value.slice(0, 500))}
              placeholder="Describe what you want to change..."
              className="min-h-[60px] lg:min-h-[80px] resize-none rounded font-mono text-xs bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-white/30"
              disabled={isModifying}
            />
            <div className="flex items-center gap-2">
              {/* Aspect ratio selector */}
              <div className="relative">
                <button
                  onClick={() => setShowRatioMenu(!showRatioMenu)}
                  className="h-9 px-3 flex items-center gap-1.5 text-[10px] font-mono border border-white/10 rounded bg-white/5 text-white/60 hover:bg-white/10 transition-colors"
                >
                  <Ratio className="w-3 h-3" />
                  <span>{modifyRatio}</span>
                  <ChevronDown className="w-2.5 h-2.5" />
                </button>
                {showRatioMenu && (
                  <div className="absolute bottom-full left-0 mb-1.5 bg-black border border-white/15 shadow-2xl p-1 z-50 min-w-[140px] rounded">
                    {ASPECT_RATIOS.map((ratio) => (
                      <button
                        key={ratio.value}
                        onClick={() => {
                          setModifyRatio(ratio.value);
                          setShowRatioMenu(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left text-[10px] font-mono flex items-center justify-between rounded transition-all ${
                          modifyRatio === ratio.value
                            ? "bg-white text-black"
                            : "text-white/70 hover:bg-white/10"
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
                disabled={!modifyPrompt.trim() || isModifying}
                className="flex-1 h-9 font-mono text-xs tracking-wider !bg-white !text-black hover:!bg-white/90"
              >
                {isModifying ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    GENERATE
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-white/8" />

          {/* Enhance section */}
          <div className="space-y-2 lg:space-y-3">
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
              Enhance
            </span>
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              {/* Upscale 4K */}
              <button
                onClick={handleUpscale}
                disabled={isUpscaling || !canUpscale}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded font-mono text-[10px] sm:text-xs transition-all ${
                  isUpscaled
                    ? "bg-green-500/15 text-green-400 border border-green-500/20"
                    : canUpscale
                    ? "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
                    : "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed"
                }`}
              >
                {isUpscaling ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Wand2 className="w-3.5 h-3.5" />
                )}
                {isUpscaled ? "4K DONE" : "UPSCALE 4K"}
              </button>

              {/* Generate Video */}
              <button
                onClick={handleGenerateVideo}
                disabled={isGeneratingVideo || videoProcessing}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded font-mono text-[10px] sm:text-xs transition-all ${
                  hasVideo
                    ? "bg-purple-500/15 text-purple-400 border border-purple-500/20"
                    : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
                }`}
              >
                {isGeneratingVideo || videoProcessing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Clapperboard className="w-3.5 h-3.5" />
                )}
                {hasVideo ? "VIDEO DONE" : videoProcessing ? "PROCESSING..." : "ANIMATE"}
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
                  className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded font-mono text-[10px] bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <Download className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Separator */}
          <div className="border-t border-white/8" />

          {/* Actions section */}
          <div className="space-y-2 lg:space-y-3">
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
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
                    : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
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
                  className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded font-mono text-[10px] bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 transition-all"
                >
                  <FolderInput className="w-3 h-3" />
                  MOVE
                </button>
                {showMoveMenu && (
                  <div className="absolute bottom-full left-0 mb-1.5 bg-black border border-white/15 shadow-2xl py-1 min-w-[180px] z-30 max-h-[200px] overflow-y-auto rounded">
                    <button
                      onClick={() => handleMoveToProject(null)}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs font-mono hover:bg-white/10 transition-colors text-left ${
                        !currentRender.project_id ? "text-white/30" : "text-white/70"
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
                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs font-mono hover:bg-white/10 transition-colors text-left ${
                          currentRender.project_id === p.id
                            ? "text-white/30"
                            : "text-white/70"
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
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded font-mono text-[10px] bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 transition-all"
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
          <div className="border-t border-white/8" />

          {/* Info section */}
          <div className="space-y-2 lg:space-y-3">
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
              Details
            </span>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center gap-2 text-white/40">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(currentRender.created_at)}</span>
              </div>
              {currentRender.metadata?.aspectRatio && (
                <div className="flex items-center gap-2 text-white/40">
                  <Ratio className="w-3 h-3" />
                  <span>{currentRender.metadata.aspectRatio}</span>
                </div>
              )}
              {currentProjectName && (
                <div className="flex items-center gap-2 text-white/40">
                  <Tag className="w-3 h-3" />
                  <span>{currentProjectName}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-white/40">
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
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-2 sm:px-4 sm:py-3 rounded shadow-lg">
            <div className="flex items-center gap-2 sm:gap-3">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 animate-pulse flex-shrink-0" />
              <p className="text-[11px] sm:text-xs font-mono text-white">Coming soon</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
