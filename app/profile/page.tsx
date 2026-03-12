"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "@/lib/auth-client";
import { StripedPattern } from "@/components/magicui/striped-pattern";
import {
  User,
  Image,
  Download,
  Loader2,
  LogOut,
  Trash2,
  Eye,
  X,
  Sparkles,
  Menu,
  Heart,
} from "lucide-react";
import Link from "next/link";
import { RenderGenerator } from "@/components/render-generator";
import { ProjectSidebar, Project } from "@/components/project-sidebar";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { RenderStudio } from "@/components/render-studio";

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

export default function ProfilePage() {
  const PAGE_SIZE = 24;
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [renders, setRenders] = useState<Render[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreRenders, setHasMoreRenders] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const [favoritingIds, setFavoritingIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [studioRender, setStudioRender] = useState<Render | null>(null);
  const [showUpscaleToast, setShowUpscaleToast] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Projects state
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Project for render generator
  const [generatorProjectId, setGeneratorProjectId] = useState<string | null>(null);

  const [pendingDeleteRenderId, setPendingDeleteRenderId] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (studioRender) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [studioRender]);

  useEffect(() => {
    if (showUpscaleToast) {
      const timer = setTimeout(() => setShowUpscaleToast(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showUpscaleToast]);

  const fetchProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (data.projects) {
        setProjects(data.projects);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const fetchRenders = useCallback(async (offset = 0, replace = true) => {
    if (replace) {
      setIsLoading(true);
      setLoadedImages(new Set());
    } else {
      setIsLoadingMore(true);
    }

    try {
      const params = new URLSearchParams();
      if (selectedProjectId && selectedProjectId !== "favorites") {
        params.set("project_id", selectedProjectId);
      }
      if (selectedProjectId === "favorites" || favoritesOnly) {
        params.set("favorites", "true");
      }
      params.set("limit", PAGE_SIZE.toString());
      params.set("offset", offset.toString());
      const url = `/api/user/renders${params.toString() ? `?${params}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.renders) {
        setRenders((prev) => (replace ? data.renders : [...prev, ...data.renders]));
        setHasMoreRenders(Boolean(data.hasMore));
        setNextOffset(data.nextOffset ?? offset + data.renders.length);
      }
    } catch (error) {
      console.error("Error fetching renders:", error);
    } finally {
      if (replace) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  }, [selectedProjectId, favoritesOnly]);

  const loadMoreRenders = useCallback(() => {
    if (isLoading || isLoadingMore || !hasMoreRenders) return;
    fetchRenders(nextOffset, false);
  }, [fetchRenders, hasMoreRenders, isLoading, isLoadingMore, nextOffset]);

  useEffect(() => {
    if (session) {
      fetchProjects();
    }
  }, [session]);

  // Refetch renders when project filter changes
  useEffect(() => {
    if (session) {
      fetchRenders(0, true);
    }
  }, [selectedProjectId, session, fetchRenders]);

  useEffect(() => {
    if (!loadMoreRef.current || !hasMoreRenders) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          loadMoreRenders();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMoreRenders, loadMoreRenders]);

  const handleCreateProject = async (name: string) => {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error("Failed to create project");
    await fetchProjects();
  };

  const handleDeleteProject = async (projectId: string) => {
    const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete project");
    await fetchProjects();
    await fetchRenders();
  };

  const downloadImage = async (url: string, filename: string) => {
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
      // Fallback: open in new tab if fetch fails (CORS)
      window.open(url, "_blank");
    }
  };

  const isFavorite = (render: Render) => {
    return Boolean(render.metadata?.favorite);
  };

  const handleDeleteRender = async (renderId: string) => {
    setDeletingIds((prev) => new Set(prev).add(renderId));
    try {
      const res = await fetch(`/api/render/${renderId}`, { method: "DELETE" });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Delete failed");
      }
      setRenders((prev) => prev.filter((r) => r.id !== renderId));
    } catch (error) {
      console.error("Delete error:", error);
      alert(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setDeletingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(renderId);
        return newSet;
      });
    }
  };

  const handleToggleFavorite = async (render: Render) => {
    setFavoritingIds((prev) => new Set(prev).add(render.id));
    const nextFavorite = !isFavorite(render);

    try {
      const res = await fetch(`/api/render/${render.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: nextFavorite }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update favorite");
      }

      setRenders((prev) =>
        prev.map((r) =>
          r.id === render.id
            ? {
                ...r,
                metadata: {
                  ...(r.metadata || {}),
                  favorite: nextFavorite,
                },
              }
            : r
        )
      );

      if (selectedProjectId === "favorites" && !nextFavorite) {
        setRenders((prev) => prev.filter((r) => r.id !== render.id));
      }
    } catch (error) {
      console.error("Favorite toggle error:", error);
      alert(error instanceof Error ? error.message : "Failed to update favorite");
    } finally {
      setFavoritingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(render.id);
        return newSet;
      });
    }
  };

  const getAspectRatio = (render: Render): string => {
    const ratio = render.metadata?.aspectRatio;
    if (!ratio || !ratio.includes(":")) return "1/1";
    return ratio.replace(":", "/");
  };

  const handleImageLoaded = useCallback((renderId: string) => {
    setLoadedImages((prev) => new Set(prev).add(renderId));
  }, []);

  interface GridItem {
    render: Render;
    variant: "standard" | "4k";
    imageUrl: string;
    key: string;
  }

  const gridItems: GridItem[] = renders.flatMap((render) => {
    const items: GridItem[] = [];
    if (render.generated_image_url) {
      items.push({
        render,
        variant: "standard",
        imageUrl: render.generated_image_url,
        key: `${render.id}-std`,
      });
    }
    if (
      render.upscaled_image_url &&
      render.upscaled_image_url !== render.generated_image_url
    ) {
      items.push({
        render,
        variant: "4k",
        imageUrl: render.upscaled_image_url,
        key: `${render.id}-4k`,
      });
    }
    if (!render.generated_image_url) {
      items.push({
        render,
        variant: "standard",
        imageUrl: "",
        key: render.id,
      });
    }
    return items;
  });

  const isFavoritesView = favoritesOnly || selectedProjectId === "favorites";

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      <StripedPattern className="absolute inset-0 [mask-image:radial-gradient(800px_circle_at_center,white,transparent)]" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-border">
        <div className="px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="lg:hidden p-1.5 hover:bg-muted rounded transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/">
              <span
                className="text-xl sm:text-2xl font-bold tracking-tighter cursor-pointer hover:opacity-80 transition-opacity"
                style={{ fontFamily: "system-ui, -apple-system, sans-serif", letterSpacing: "-0.05em" }}
              >
                RENDERZ
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {/* User avatar */}
            <Link href="/settings">
              <div className="w-8 h-8 rounded-full bg-muted border border-border overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                {session.user.image ? (
                  <img src={session.user.image} alt={session.user.name || ""} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="font-mono text-[10px] sm:text-xs px-2 sm:px-3"
              onClick={async () => {
                await signOut();
                window.location.href = "/";
              }}
            >
              <LogOut className="w-3 h-3 sm:mr-1" />
              <span className="hidden sm:inline">SIGN OUT</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Layout with Sidebar */}
      <div className="relative z-10 pt-14 sm:pt-16" style={{ minHeight: "100vh" }}>
        {/* Mobile sidebar overlay */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMobileSidebarOpen(false)}>
            <div className="absolute inset-0 bg-black/30" />
          </div>
        )}

        {/* Sidebar - always fixed */}
        <div
          className={`
            fixed top-14 sm:top-16 bottom-0 z-40 transition-all duration-300
            w-[260px] bg-white
            ${mobileSidebarOpen ? "left-0" : "-left-[280px]"}
            ${sidebarOpen ? "lg:left-0" : "lg:-left-[280px]"}
          `}
        >
          <ProjectSidebar
            projects={projects}
            selectedProjectId={selectedProjectId}
            onSelectProject={(id) => {
              setSelectedProjectId(id);
              setMobileSidebarOpen(false);
            }}
            onCreateProject={handleCreateProject}
            onDeleteProject={handleDeleteProject}
            isLoading={isLoadingProjects}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
        </div>

        {/* Desktop sidebar reopen button when collapsed */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="hidden lg:flex fixed top-[72px] left-3 z-40 p-2 bg-white border border-border rounded-sm shadow-sm hover:bg-white transition-colors"
            title="Show sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Main content */}
        <main
          className="flex flex-col min-w-0 min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] transition-all duration-300"
          style={{ marginLeft: sidebarOpen ? "260px" : "0" }}
        >
          {/* Content area */}
          <div className="pb-[240px]">
            {/* Renders Grid */}
            <div className="p-4 sm:p-8">
              <div className="mb-4 flex items-center gap-2">
                <button
                  onClick={() => {
                    setFavoritesOnly(false);
                    if (selectedProjectId === "favorites") {
                      setSelectedProjectId(null);
                    }
                  }}
                  className={`px-3 py-1.5 text-xs font-mono border transition-colors ${
                    !isFavoritesView
                      ? "bg-black text-white border-black"
                      : "bg-white text-foreground border-border hover:bg-muted/50"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFavoritesOnly(true)}
                  className={`px-3 py-1.5 text-xs font-mono border transition-colors flex items-center gap-1.5 ${
                    isFavoritesView
                      ? "bg-black text-white border-black"
                      : "bg-white text-foreground border-border hover:bg-muted/50"
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isFavoritesView ? "fill-current" : ""}`} />
                  Favorites
                </button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : renders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Image className="w-12 h-12 mb-4 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground font-mono">No renders in this view</p>
                  <p className="text-xs text-muted-foreground/60 font-mono mt-1">
                    Use the generator below to create your first render
                  </p>
                </div>
              ) : (
                <>
                  <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-1 sm:gap-1.5">
                    {gridItems.map((item) => (
                      <div
                        key={item.key}
                        className="group relative overflow-hidden mb-1 sm:mb-1.5 break-inside-avoid cursor-pointer"
                        onClick={() => item.imageUrl && setStudioRender(item.render)}
                      >
                        <div
                          className="relative bg-muted overflow-hidden"
                          style={{ aspectRatio: getAspectRatio(item.render) }}
                        >
                          {item.imageUrl ? (
                            <>
                              {!loadedImages.has(item.key) && (
                                <div className="absolute inset-0 bg-muted animate-pulse" />
                              )}
                              <img
                                src={item.imageUrl}
                                alt="Render"
                                className={`w-full h-full object-cover block transition-opacity duration-300 ${
                                  loadedImages.has(item.key) ? "opacity-100" : "opacity-0"
                                }`}
                                onLoad={() => handleImageLoaded(item.key)}
                              />
                              {/* Hover overlay */}
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setStudioRender(item.render);
                                  }}
                                  className="px-4 py-2 bg-white text-black font-mono text-xs tracking-wider hover:bg-white/90 transition-colors rounded"
                                >
                                  <Eye className="w-4 h-4 inline mr-1.5" />
                                  STUDIO
                                </button>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleFavorite(item.render);
                                    }}
                                    disabled={favoritingIds.has(item.render.id)}
                                    className={`px-2 py-1 text-[10px] font-mono transition-colors rounded-sm ${
                                      isFavorite(item.render)
                                        ? "bg-pink-500/90 text-white hover:bg-pink-500"
                                        : "bg-white/90 text-black hover:bg-white"
                                    }`}
                                  >
                                    {favoritingIds.has(item.render.id) ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Heart className={`w-3 h-3 ${isFavorite(item.render) ? "fill-current" : ""}`} />
                                    )}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      downloadImage(item.imageUrl, `renderz-${item.render.id}${item.variant === "4k" ? "-4k" : ""}.png`);
                                    }}
                                    className="px-2 py-1 text-[10px] font-mono bg-white/90 text-black hover:bg-white transition-colors rounded-sm"
                                  >
                                    <Download className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPendingDeleteRenderId(item.render.id);
                                    }}
                                    disabled={deletingIds.has(item.render.id)}
                                    className="px-2 py-1 text-[10px] font-mono bg-red-500/80 text-white hover:bg-red-500 transition-colors rounded-sm"
                                  >
                                    {deletingIds.has(item.render.id) ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="w-full aspect-square flex flex-col items-center justify-center gap-2">
                              {item.render.status === "failed" ? (
                                <>
                                  <X className="w-6 h-6 text-red-400" />
                                  <p className="text-[10px] font-mono text-muted-foreground">Render failed</p>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPendingDeleteRenderId(item.render.id);
                                    }}
                                    disabled={deletingIds.has(item.render.id)}
                                    className="mt-1 px-3 py-1.5 text-[10px] font-mono bg-red-500/80 text-white hover:bg-red-500 transition-colors flex items-center gap-1"
                                  >
                                    {deletingIds.has(item.render.id) ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <>
                                        <Trash2 className="w-3 h-3" />
                                        DELETE
                                      </>
                                    )}
                                  </button>
                                </>
                              ) : (
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {(hasMoreRenders || isLoadingMore) && (
                    <div ref={loadMoreRef} className="h-14 flex items-center justify-center">
                      {isLoadingMore ? (
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      ) : (
                        <span className="text-[10px] font-mono text-muted-foreground">Loading more renders...</span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

          </div>

          {/* Fixed Render Generator at bottom */}
          <div className="fixed bottom-0 z-30 transition-all duration-300"
            style={{ left: sidebarOpen ? "260px" : "0", right: "0" }}
          >
            <div className="flex justify-center w-full">
              <div className="p-4 sm:p-6 m-4 sm:m-6 w-full max-w-[1200px] bg-white/60 backdrop-blur-xl border border-border/50 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
              <RenderGenerator
                onGenerateSuccess={() => {
                  fetchRenders();
                  fetchProjects();
                }}
                projects={projects.map((p) => ({ id: p.id, name: p.name }))}
                selectedProjectId={
                  generatorProjectId ||
                  (selectedProjectId && !["unassigned", "favorites"].includes(selectedProjectId)
                    ? selectedProjectId
                    : null)
                }
                onProjectChange={setGeneratorProjectId}
                compact
              />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Render Studio */}
      {studioRender && (
        <RenderStudio
          render={studioRender}
          projects={projects.map((p) => ({ id: p.id, name: p.name }))}
          onClose={() => setStudioRender(null)}
          onRenderUpdate={(updated) => {
            setRenders((prev) =>
              prev.map((r) => (r.id === updated.id ? updated : r))
            );
            setStudioRender(updated);
          }}
          onRenderDelete={(renderId) => {
            setRenders((prev) => prev.filter((r) => r.id !== renderId));
          }}
          onNewRenderCreated={() => {
            fetchRenders();
            fetchProjects();
          }}
        />
      )}

      <ConfirmActionDialog
        open={pendingDeleteRenderId !== null}
        title="Delete render?"
        description="This render will be permanently deleted."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        isLoading={pendingDeleteRenderId ? deletingIds.has(pendingDeleteRenderId) : false}
        onCancel={() => setPendingDeleteRenderId(null)}
        onConfirm={async () => {
          if (!pendingDeleteRenderId) return;
          const renderId = pendingDeleteRenderId;
          await handleDeleteRender(renderId);
          setPendingDeleteRenderId(null);
        }}
      />

      {/* Toast */}
      {showUpscaleToast && (
        <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-[100] animate-in slide-in-from-bottom-2 fade-in duration-300">
          <div className="bg-black/90 backdrop-blur-sm border border-white/20 px-4 py-3 rounded-none shadow-lg">
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse flex-shrink-0" />
              <p className="text-xs sm:text-sm font-mono text-white">Bientôt disponible</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
