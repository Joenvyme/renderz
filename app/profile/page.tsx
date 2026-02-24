"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSession, signOut } from "@/lib/auth-client";
import { StripedPattern } from "@/components/magicui/striped-pattern";
import {
  User,
  Image,
  Download,
  Loader2,
  LogOut,
  Trash2,
  Wand2,
  Eye,
  X,
  Sparkles,
  Calendar,
  Menu,
  Heart,
  FolderInput,
  Inbox,
} from "lucide-react";
import Link from "next/link";
import { RenderGenerator } from "@/components/render-generator";
import { ProjectSidebar, Project } from "@/components/project-sidebar";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";

interface RenderMetadata {
  aspectRatio?: string;
  upscale_error?: string;
  upscale_started_at?: string;
  favorite?: boolean;
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
  const [upscalingIds, setUpscalingIds] = useState<Set<string>>(new Set());
  const [favoritingIds, setFavoritingIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [previewImage, setPreviewImage] = useState<{ url: string; type: string } | null>(null);
  const [showUpscaleToast, setShowUpscaleToast] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [externalReferenceImage, setExternalReferenceImage] = useState<{ token: string; url: string } | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Projects state
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Project for render generator
  const [generatorProjectId, setGeneratorProjectId] = useState<string | null>(null);

  // Move to project menu
  const [moveMenuRenderId, setMoveMenuRenderId] = useState<string | null>(null);
  const [pendingDeleteRenderId, setPendingDeleteRenderId] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (previewImage) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [previewImage]);

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
      setMoveMenuRenderId(null);
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

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleUpscale = async (renderId: string) => {
    const has4KAccess = session?.user?.email === "joey.montani@gmail.com";
    if (!has4KAccess) {
      setShowUpscaleToast(true);
      return;
    }

    setUpscalingIds((prev) => new Set(prev).add(renderId));

    try {
      const res = await fetch("/api/upscale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ renderId, scale: 4 }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Upscaling failed");
      }

      let completed = false;
      let attempts = 0;
      const maxAttempts = 60;

      while (!completed && attempts < maxAttempts) {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const statusRes = await fetch(`/api/render/${renderId}`);
        if (!statusRes.ok) continue;
        const render = await statusRes.json();
        if (render.status === "completed" && render.upscaled_image_url && render.upscaled_image_url !== render.generated_image_url) {
          completed = true;
          setRenders((prev) => prev.map((r) => (r.id === renderId ? render : r)));
        } else if (render.metadata?.upscale_error) {
          throw new Error(render.metadata.upscale_error);
        }
      }
      if (!completed) {
        alert("Upscaling is taking longer than expected. Refresh the page later.");
      }
    } catch (error) {
      console.error("Upscale error:", error);
      alert(error instanceof Error ? error.message : "Upscaling failed");
    } finally {
      setUpscalingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(renderId);
        return newSet;
      });
    }
  };

  const canUpscale = (render: Render) => {
    return render.status === "completed" && render.generated_image_url && (!render.upscaled_image_url || render.upscaled_image_url === render.generated_image_url);
  };

  const isFavorite = (render: Render) => {
    return Boolean(render.metadata?.favorite);
  };

  const isUpscaled = (render: Render) => {
    return render.upscaled_image_url && render.upscaled_image_url !== render.generated_image_url;
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

  const handleMoveRender = async (renderId: string, projectId: string | null) => {
    try {
      const res = await fetch(`/api/render/${renderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to move render");
      }
      // Update local state
      setRenders((prev) =>
        prev.map((r) => (r.id === renderId ? { ...r, project_id: projectId } : r))
      );
      setMoveMenuRenderId(null);
      // Refresh projects to update render counts
      fetchProjects();
      // If we're in a filtered view, re-fetch to remove moved items
      if (selectedProjectId !== null) {
        fetchRenders();
      }
    } catch (error) {
      console.error("Move render error:", error);
      alert(error instanceof Error ? error.message : "Failed to move render");
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

  const handleUseAsReference = (render: Render) => {
    const imageUrl = isUpscaled(render) ? render.upscaled_image_url : render.generated_image_url;
    if (!imageUrl) return;

    setExternalReferenceImage({
      token: `${render.id}-${Date.now()}`,
      url: imageUrl,
    });

    // Bring the fixed generator into user focus after adding the reference.
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

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
                  <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3 sm:gap-4">
                    {renders.map((render) => (
                      <div
                        key={render.id}
                        className="group relative bg-white border border-border overflow-hidden hover:shadow-lg transition-shadow mb-3 sm:mb-4 break-inside-avoid"
                      >
                      {/* Image */}
                      <div className="relative bg-muted">
                        {render.generated_image_url ? (
                          <>
                            <img
                              src={isUpscaled(render) ? render.upscaled_image_url! : render.generated_image_url}
                              alt="Render"
                              className="w-full h-auto block"
                            />
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() =>
                                    setPreviewImage({
                                      url: render.generated_image_url!,
                                      type: "Standard",
                                    })
                                  }
                                  className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                                  title="View"
                                >
                                  <Eye className="w-4 h-4 text-white" />
                                </button>
                                {isUpscaled(render) && (
                                  <button
                                    onClick={() =>
                                      setPreviewImage({
                                        url: render.upscaled_image_url!,
                                        type: "4K Upscaled",
                                      })
                                    }
                                    className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                                    title="View 4K"
                                  >
                                    <Wand2 className="w-4 h-4 text-white" />
                                  </button>
                                )}
                                <button
                                  onClick={() =>
                                    downloadImage(
                                      isUpscaled(render) ? render.upscaled_image_url! : render.generated_image_url!,
                                      `renderz-${render.id}.png`
                                    )
                                  }
                                  className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                                  title="Download"
                                >
                                  <Download className="w-4 h-4 text-white" />
                                </button>
                                <button
                                  onClick={() => handleUseAsReference(render)}
                                  className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                                  title="Use as reference"
                                >
                                  <Image className="w-4 h-4 text-white" />
                                </button>
                              </div>
                              {/* Action buttons row */}
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleToggleFavorite(render)}
                                  disabled={favoritingIds.has(render.id)}
                                  className={`px-2 py-1 text-[10px] font-mono transition-colors ${
                                    isFavorite(render)
                                      ? "bg-pink-500/90 text-white hover:bg-pink-500"
                                      : "bg-white text-black hover:bg-white/90"
                                  }`}
                                  title={isFavorite(render) ? "Remove favorite" : "Add favorite"}
                                >
                                  {favoritingIds.has(render.id) ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Heart className={`w-3 h-3 ${isFavorite(render) ? "fill-current" : ""}`} />
                                  )}
                                </button>
                                {canUpscale(render) && (
                                  <button
                                    onClick={() => handleUpscale(render.id)}
                                    disabled={upscalingIds.has(render.id)}
                                    className="px-2 py-1 text-[10px] font-mono bg-white text-black hover:bg-white/90 transition-colors"
                                  >
                                    {upscalingIds.has(render.id) ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      "4K"
                                    )}
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMoveMenuRenderId(moveMenuRenderId === render.id ? null : render.id);
                                  }}
                                  className="px-2 py-1 text-[10px] font-mono bg-blue-500/80 text-white hover:bg-blue-500 transition-colors"
                                  title="Move to project"
                                >
                                  <FolderInput className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => setPendingDeleteRenderId(render.id)}
                                  disabled={deletingIds.has(render.id)}
                                  className="px-2 py-1 text-[10px] font-mono bg-red-500/80 text-white hover:bg-red-500 transition-colors"
                                >
                                  {deletingIds.has(render.id) ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3 h-3" />
                                  )}
                                </button>
                              </div>

                              {/* Move to project dropdown */}
                              {moveMenuRenderId === render.id && (
                                <div
                                  className="absolute left-1/2 -translate-x-1/2 top-[65%] bg-white border border-border shadow-xl py-1 min-w-[160px] z-30 max-h-[140px] overflow-y-auto"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={() => handleMoveRender(render.id, null)}
                                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs font-mono hover:bg-muted/50 transition-colors text-left ${
                                      !render.project_id ? "text-muted-foreground" : "text-foreground"
                                    }`}
                                    disabled={!render.project_id}
                                  >
                                    <Inbox className="w-3 h-3 flex-shrink-0" />
                                    Unassigned
                                  </button>
                                  {projects.map((p) => (
                                    <button
                                      key={p.id}
                                      onClick={() => handleMoveRender(render.id, p.id)}
                                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs font-mono hover:bg-muted/50 transition-colors text-left ${
                                        render.project_id === p.id ? "text-muted-foreground" : "text-foreground"
                                      }`}
                                      disabled={render.project_id === p.id}
                                    >
                                      <FolderInput className="w-3 h-3 flex-shrink-0" />
                                      <span className="truncate">{p.name}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="w-full aspect-square flex flex-col items-center justify-center gap-2">
                            {render.status === "failed" ? (
                              <>
                                <X className="w-6 h-6 text-red-400" />
                                <p className="text-[10px] font-mono text-muted-foreground">Render failed</p>
                                <button
                                  onClick={() => setPendingDeleteRenderId(render.id)}
                                  disabled={deletingIds.has(render.id)}
                                  className="mt-1 px-3 py-1.5 text-[10px] font-mono bg-red-500/80 text-white hover:bg-red-500 transition-colors flex items-center gap-1"
                                >
                                  {deletingIds.has(render.id) ? (
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

                        {/* Badges */}
                        <div className="absolute top-1.5 left-1.5 flex gap-1">
                          {isUpscaled(render) ? (
                            <div className="px-1.5 py-0.5 text-[9px] font-mono bg-green-500 text-white">4K</div>
                          ) : render.status === "completed" && render.generated_image_url ? (
                            <div className="px-1.5 py-0.5 text-[9px] font-mono bg-yellow-500 text-black">STD</div>
                          ) : null}
                        </div>

                        <div
                          className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 text-[9px] font-mono ${
                            render.status === "completed"
                              ? "bg-green-500/80 text-white"
                              : render.status === "failed"
                              ? "bg-red-500 text-white"
                              : "bg-yellow-500 text-black"
                          }`}
                        >
                          {render.status === "completed" ? "✓" : render.status === "failed" ? "✗" : "⏳"}
                        </div>
                      </div>

                      {/* Info bar */}
                      <div className="px-2 py-1.5 border-t border-border">
                        <p className="text-[10px] font-mono text-muted-foreground truncate">
                          {render.prompt || "No prompt"}
                        </p>
                        <p className="text-[9px] font-mono text-muted-foreground/60 mt-0.5">
                          {formatDate(render.created_at)}
                        </p>
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
                externalReferenceImage={externalReferenceImage}
              />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative w-full h-full flex items-center justify-center px-2 sm:px-4 pt-14" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-black/70 px-2 sm:px-3 py-1 text-xs sm:text-sm font-mono text-white z-10 rounded">
              {previewImage.type}
            </div>
            <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex gap-1.5 sm:gap-2 z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  downloadImage(previewImage.url, `renderz-${previewImage.type.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.png`);
                }}
                className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center rounded"
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </button>
              <button
                onClick={() => setPreviewImage(null)}
                className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center rounded"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </button>
            </div>
            <img src={previewImage.url} alt="Preview" className="max-w-full max-h-full object-contain" />
          </div>
        </div>
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
