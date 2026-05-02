"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Inbox,
  Clapperboard,
  Check,
  PanelLeft,
  PanelLeftClose,
  ArrowUpRightIcon,
} from "lucide-react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { RenderGenerator } from "@/components/render-generator";
import { ProjectSidebar, Project, RENDER_DRAG_MIME } from "@/components/project-sidebar";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { Render4KBadge, galleryItemShows4KBadge } from "@/components/render-4k-badge";
import { RenderStudio } from "@/components/render-studio";
import type { BillingPayload } from "@/lib/billing/billing-types";

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

/** Masonry (colonnes) + ratios metadata ; grands rayons sur coins haut mesurés. */
type GalleryTopCorners = { tl: string | null; tr: string | null };

function galleryTileRadiusClasses(
  itemKey: string,
  corners: GalleryTopCorners
): { card: string; inner: string; img: string; pulse: string } {
  const sm = "rounded-[4px]";
  if (
    corners.tl &&
    corners.tr &&
    corners.tl === corners.tr &&
    itemKey === corners.tl
  ) {
    const one = "rounded-t-[14px] rounded-b-[4px]";
    return { card: one, inner: one, img: one, pulse: one };
  }
  if (itemKey === corners.tl) {
    const c =
      "rounded-tl-[14px] rounded-tr-[4px] rounded-br-[4px] rounded-bl-[4px]";
    return { card: c, inner: c, img: c, pulse: c };
  }
  if (itemKey === corners.tr) {
    const c =
      "rounded-tr-[14px] rounded-tl-[4px] rounded-br-[4px] rounded-bl-[4px]";
    return { card: c, inner: c, img: c, pulse: c };
  }
  return { card: sm, inner: sm, img: sm, pulse: sm };
}

/**
 * Masonry `columns-*` : le navigateur empile les cartes dans l’ordre du DOM, colonne par colonne
 * (haut → bas, puis colonne suivante). Un tri **récent → ancien** sur `created_at` met donc les
 * derniers rendus en haut du flux ; ce n’est pas une grille « ligne par ligne », mais l’ordre
 * temporel reste cohérent et le scroll infini reste aligné avec l’API.
 */
function sortRendersNewestFirst(list: Render[]): Render[] {
  return [...list].sort((a, b) => {
    const tb = new Date(b.created_at).getTime();
    const ta = new Date(a.created_at).getTime();
    if (Number.isFinite(tb) && Number.isFinite(ta) && tb !== ta) return tb - ta;
    if (!Number.isFinite(tb) && Number.isFinite(ta)) return 1;
    if (Number.isFinite(tb) && !Number.isFinite(ta)) return -1;
    return b.id.localeCompare(a.id);
  });
}

export default function ProfilePageWrapper() {
  return (
    <Suspense>
      <ProfilePage />
    </Suspense>
  );
}

function ProfilePage() {
  const PAGE_SIZE = 24;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();
  const [renders, setRenders] = useState<Render[]>([]);
  const rendersGalleryOrdered = useMemo(() => sortRendersNewestFirst(renders), [renders]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreRenders, setHasMoreRenders] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const [favoritingIds, setFavoritingIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [studioRender, setStudioRender] = useState<Render | null>(null);
  /** Which gallery tile opened the studio (standard / 4k / video) — drives initial preview mode */
  const [studioPreviewVariant, setStudioPreviewVariant] = useState<
    "standard" | "4k" | "video" | undefined
  >(undefined);
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
  const [pendingStudioRenderIds, setPendingStudioRenderIds] = useState<Set<string>>(new Set());
  const [readyRenderToast, setReadyRenderToast] = useState<Render | null>(null);
  const [draggingRenderIds, setDraggingRenderIds] = useState<Set<string>>(new Set());
  const [selectedRenderIds, setSelectedRenderIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  /** Gallery strip: still images vs video tiles only (Midjourney-style) */
  const [galleryMediaMode, setGalleryMediaMode] = useState<"images" | "videos">("images");
  const [galleryTopCorners, setGalleryTopCorners] = useState<GalleryTopCorners>({
    tl: null,
    tr: null,
  });
  const galleryMasonryRef = useRef<HTMLDivElement | null>(null);

  const [billing, setBilling] = useState<BillingPayload | null>(null);
  const [billingLoading, setBillingLoading] = useState(true);

  const fetchBilling = useCallback(async () => {
    setBillingLoading(true);
    try {
      const res = await fetch("/api/user/billing");
      const data = await res.json();
      if (res.ok) setBilling(data);
    } catch (e) {
      console.error("billing fetch", e);
    } finally {
      setBillingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session) fetchBilling();
  }, [session, fetchBilling]);

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

  // Handle ?studio=renderId from landing page redirect
  useEffect(() => {
    const studioRenderId = searchParams.get("studio");
    if (!studioRenderId || !session) return;

    // Clear the query param from URL
    router.replace("/profile", { scroll: false });

    let cancelled = false;
    const pollForRender = async () => {
      const maxAttempts = 180; // 6 min max
      for (let i = 0; i < maxAttempts; i++) {
        if (cancelled) return;
        try {
          const res = await fetch(`/api/render/${studioRenderId}`);
          if (!res.ok) break;
          const data = await res.json();
          const render = data.render ?? data;
          if (render && render.id) {
            setStudioRender(render);
            if (render.status === "completed" || render.status === "failed") return;
            if (render.status === "completed") {
              fetchRenders(0, true);
              return;
            }
          }
        } catch { /* continue polling */ }
        await new Promise((r) => setTimeout(r, 2000));
      }
    };

    // Set a placeholder render immediately so the studio opens in loading mode
    setStudioRender({
      id: studioRenderId,
      original_image_url: null,
      generated_image_url: null,
      upscaled_image_url: null,
      prompt: null,
      status: "processing",
      created_at: new Date().toISOString(),
      project_id: null,
    });

    pollForRender();
    return () => { cancelled = true; };
  }, [searchParams, session]);

  const fetchProjects = useCallback(async () => {
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
  }, []);

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
    if (!pendingStudioRenderIds.size) return;
    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      const ids = Array.from(pendingStudioRenderIds);
      for (const id of ids) {
        try {
          const res = await fetch(`/api/render/${id}`);
          if (!res.ok) continue;
          const render = await res.json();
          if (render?.status === "completed") {
            setPendingStudioRenderIds((prev) => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
            setReadyRenderToast(render);
            fetchRenders(0, true);
          } else if (render?.status === "failed") {
            setPendingStudioRenderIds((prev) => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
          }
        } catch {
          // keep polling
        }
      }
    };

    tick();
    const interval = setInterval(tick, 2500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pendingStudioRenderIds, fetchRenders]);

  useEffect(() => {
    if (session) {
      fetchProjects();
    }
  }, [session, fetchProjects]);

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

  const handleRenameProject = async (projectId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Le nom ne peut pas être vide");
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        typeof err.error === "string" ? err.error : "Échec du renommage"
      );
    }
    await fetchProjects();
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

  const toggleRenderSelection = useCallback((renderId: string) => {
    setSelectedRenderIds((prev) => {
      const next = new Set(prev);
      if (next.has(renderId)) next.delete(renderId);
      else next.add(renderId);
      return next;
    });
  }, []);

  const clearRenderSelection = useCallback(() => {
    setSelectedRenderIds(new Set());
  }, []);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedRenderIds(new Set());
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (studioRender) return;
      if (selectionMode) exitSelectionMode();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [exitSelectionMode, selectionMode, studioRender]);

  useEffect(() => {
    setSelectedRenderIds(new Set());
    setSelectionMode(false);
  }, [selectedProjectId, favoritesOnly]);

  const handleMoveRendersToProject = useCallback(
    async (renderIds: string[], projectId: string | null) => {
      const unique = Array.from(new Set(renderIds));
      const toMove = unique.filter((id) => {
        const r = renders.find((x) => x.id === id);
        return r && r.project_id !== projectId;
      });
      if (toMove.length === 0) return;
      try {
        await Promise.all(
          toMove.map(async (id) => {
            const res = await fetch(`/api/render/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ project_id: projectId }),
            });
            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              throw new Error(
                typeof err.error === "string" ? err.error : "Failed to move render"
              );
            }
          })
        );
        setSelectedRenderIds(new Set());
        await fetchRenders(0, true);
        await fetchProjects();
      } catch (e) {
        alert(e instanceof Error ? e.message : "Failed to move renders");
      }
    },
    [renders, fetchRenders, fetchProjects]
  );

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
    variant: "standard" | "4k" | "video";
    imageUrl: string;
    key: string;
  }

  const gridItems: GridItem[] = rendersGalleryOrdered.flatMap((render) => {
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
    if (render.metadata?.video_url) {
      items.push({
        render,
        variant: "video",
        imageUrl: render.upscaled_image_url || render.generated_image_url || "",
        key: `${render.id}-video`,
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

  const filteredGalleryItems =
    galleryMediaMode === "videos"
      ? gridItems.filter((item) => item.variant === "video")
      : gridItems.filter((item) => item.variant !== "video");

  const remeasureGalleryTopCorners = useCallback(() => {
    const root = galleryMasonryRef.current;
    if (!root) return;
    requestAnimationFrame(() => {
      const nodes = Array.from(root.children).filter(
        (n): n is HTMLElement =>
          n instanceof HTMLElement &&
          typeof n.dataset.itemKey === "string" &&
          n.dataset.itemKey.length > 0
      );
      if (nodes.length === 0) {
        setGalleryTopCorners({ tl: null, tr: null });
        return;
      }
      const TOP_EPS = 6;
      let minTop = Infinity;
      const measured: { key: string; r: DOMRect }[] = [];
      for (const n of nodes) {
        const r = n.getBoundingClientRect();
        measured.push({ key: n.dataset.itemKey!, r });
        minTop = Math.min(minTop, r.top);
      }
      const topBand = measured.filter((x) => Math.abs(x.r.top - minTop) < TOP_EPS);
      if (topBand.length === 0) {
        setGalleryTopCorners({ tl: null, tr: null });
        return;
      }
      topBand.sort((a, b) => a.r.left - b.r.left);
      setGalleryTopCorners({
        tl: topBand[0].key,
        tr: topBand[topBand.length - 1].key,
      });
    });
  }, []);

  useLayoutEffect(() => {
    remeasureGalleryTopCorners();
  }, [filteredGalleryItems, galleryMediaMode, remeasureGalleryTopCorners, sidebarOpen]);

  useEffect(() => {
    const root = galleryMasonryRef.current;
    if (!root) return;
    const ro = new ResizeObserver(() => remeasureGalleryTopCorners());
    ro.observe(root);
    window.addEventListener("resize", remeasureGalleryTopCorners);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", remeasureGalleryTopCorners);
    };
  }, [remeasureGalleryTopCorners]);

  useEffect(() => {
    remeasureGalleryTopCorners();
  }, [loadedImages.size, remeasureGalleryTopCorners]);

  const isFavoritesView = favoritesOnly || selectedProjectId === "favorites";
  const galleryAllActive = !isFavoritesView && selectedProjectId === null;
  const galleryUnassignedActive =
    !isFavoritesView && selectedProjectId === "unassigned";

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  const tierBadgeText = billingLoading
    ? null
    : billing
      ? billing.unlimited
        ? "Illimité"
        : billing.tier === "free"
          ? "Free"
          : billing.tier === "pro"
            ? "Pro"
            : billing.tier === "enterprise"
              ? "Enterprise"
              : billing.tier
      : "—";

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      <StripedPattern className="absolute inset-0 [mask-image:radial-gradient(800px_circle_at_center,white,transparent)]" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-sm border-b border-border">
        <div className="px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="p-1.5 hover:bg-muted rounded-md transition-colors lg:hidden"
              aria-label="Ouvrir le menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <BrandLogo className="hover:opacity-90 transition-opacity" />
          </div>
          <div className="flex items-center gap-2">
            <Badge
              asChild
              variant="outline"
              className="cursor-pointer gap-1 sm:gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] sm:text-[11px] uppercase tracking-wide hover:bg-muted/80"
            >
              <Link
                href="/settings#billing"
                title="Palier d’abonnement — offres et quotas (paramètres)"
                className="inline-flex items-center gap-1 sm:gap-1.5"
              >
                {billingLoading ? (
                  <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <span className="min-w-[2.75rem] text-center tabular-nums">{tierBadgeText}</span>
                    <ArrowUpRightIcon
                      className="size-3.5 shrink-0 text-muted-foreground"
                      data-icon="inline-end"
                    />
                  </>
                )}
              </Link>
            </Badge>
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
          id="profile-project-sidebar"
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
            favoritesOnly={favoritesOnly}
            onSelectProject={(id) => {
              setFavoritesOnly(false);
              setSelectedProjectId(id);
              setMobileSidebarOpen(false);
            }}
            onCreateProject={handleCreateProject}
            onDeleteProject={handleDeleteProject}
            onRenameProject={handleRenameProject}
            isLoading={isLoadingProjects}
            onDropRender={handleMoveRendersToProject}
          />
        </div>

        {/* Main content */}
        <main
          className={`flex flex-col min-w-0 min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] transition-all duration-300 ${
            sidebarOpen ? "lg:ml-[260px]" : "lg:ml-0"
          }`}
        >
          {/* Content area */}
          <div className="pb-[140px] sm:pb-[200px] lg:pb-[240px]">
            {/* Renders Grid */}
            <div className="p-2 sm:p-4 lg:px-8 lg:pb-8 lg:pt-3">
              {/* Barre outils : trigger sidebar (lg) au-dessus ; filtres + Images/Videos — sticky, sans bordure bas */}
              <div className="mb-2 max-lg:sticky max-lg:top-14 max-lg:z-[85] max-lg:bg-white/95 max-lg:py-2 max-lg:shadow-sm max-lg:backdrop-blur-md supports-[backdrop-filter]:max-lg:bg-white/88 lg:sticky lg:top-14 lg:z-[90] lg:-mx-8 lg:mb-2 lg:rounded-none lg:border-0 lg:bg-white/95 lg:px-8 lg:py-1 lg:shadow-none lg:backdrop-blur-sm supports-[backdrop-filter]:lg:bg-white/90 sm:top-16">
                <div className="hidden lg:block lg:pb-0">
                  <button
                    type="button"
                    onClick={() => setSidebarOpen((o) => !o)}
                    className="inline-flex h-8 shrink-0 items-center justify-start rounded-md p-0 text-foreground transition-opacity hover:opacity-70 [&_svg]:!size-[18px]"
                    title={sidebarOpen ? "Replier la barre latérale" : "Afficher la barre latérale"}
                    aria-expanded={sidebarOpen}
                    aria-controls="profile-project-sidebar"
                  >
                    {sidebarOpen ? (
                      <PanelLeftClose strokeWidth={1.5} />
                    ) : (
                      <PanelLeft strokeWidth={1.5} />
                    )}
                  </button>
                </div>
                <div className="flex w-full flex-col gap-2.5 sm:gap-3 lg:gap-4">
                  <div className="grid w-full shrink-0 grid-cols-2 gap-1.5 self-start rounded-full border border-border/60 bg-muted/25 p-0.5 shadow-sm max-lg:touch-manipulation sm:inline-flex sm:w-auto sm:grid-cols-none sm:gap-0">
                  <button
                    type="button"
                    onClick={() => setGalleryMediaMode("images")}
                    className={`inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-medium transition-all sm:min-h-0 sm:px-3.5 sm:py-1.5 sm:text-xs ${
                      galleryMediaMode === "images"
                        ? "bg-[#ffe8e0] text-[#7c2d12] shadow-sm ring-1 ring-[#f5cbb8]/80"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Image className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                    Images
                  </button>
                  <button
                    type="button"
                    onClick={() => setGalleryMediaMode("videos")}
                    className={`inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-medium transition-all sm:min-h-0 sm:px-3.5 sm:py-1.5 sm:text-xs ${
                      galleryMediaMode === "videos"
                        ? "bg-[#ffe8e0] text-[#7c2d12] shadow-sm ring-1 ring-[#f5cbb8]/80"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Clapperboard className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                    Videos
                  </button>
                  </div>
                  <div className="min-w-0 w-full">
                    <div
                      className="flex max-lg:snap-x max-lg:snap-mandatory max-lg:flex-nowrap max-lg:gap-2 max-lg:overflow-x-auto max-lg:pb-1 max-lg:[-webkit-overflow-scrolling:touch] max-lg:[scrollbar-width:none] max-lg:[&::-webkit-scrollbar]:hidden sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1.5 sm:overflow-visible sm:pb-0 sm:[scrollbar-width:thin] sm:[&::-webkit-scrollbar]:h-1.5 items-center text-[13px] sm:text-sm"
                      role="toolbar"
                      aria-label="Filtres de la galerie"
                    >
                  <button
                    type="button"
                    onClick={() => {
                      setFavoritesOnly(false);
                      setSelectedProjectId(null);
                    }}
                    className={`max-lg:snap-start max-lg:snap-always max-lg:touch-manipulation shrink-0 border-b-2 border-transparent py-2.5 sm:py-0.5 transition-colors ${
                      galleryAllActive
                        ? "font-semibold text-foreground border-foreground"
                        : "font-normal text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFavoritesOnly(false);
                      setSelectedProjectId("unassigned");
                    }}
                    className={`max-lg:snap-start max-lg:snap-always max-lg:touch-manipulation shrink-0 inline-flex items-center gap-1.5 border-b-2 border-transparent py-2.5 sm:py-0.5 transition-colors ${
                      galleryUnassignedActive
                        ? "font-semibold text-foreground border-foreground"
                        : "font-normal text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Inbox className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Unassigned
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFavoritesOnly(true);
                      setSelectedProjectId(null);
                    }}
                    className={`max-lg:snap-start max-lg:snap-always max-lg:touch-manipulation shrink-0 inline-flex items-center gap-1.5 border-b-2 border-transparent py-2.5 sm:py-0.5 transition-colors ${
                      isFavoritesView
                        ? "font-semibold text-foreground border-foreground"
                        : "font-normal text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isFavoritesView ? "fill-current" : ""}`} />
                    Favorites
                  </button>
                  {renders.length > 0 && !isLoading && (
                    <>
                      <span className="hidden h-4 w-px shrink-0 bg-border sm:inline" aria-hidden />
                      <button
                        type="button"
                        onClick={() => {
                          if (selectionMode) exitSelectionMode();
                          else setSelectionMode(true);
                        }}
                        className={`max-lg:snap-start max-lg:snap-always max-lg:touch-manipulation shrink-0 border-b-2 border-transparent py-2.5 sm:py-0.5 transition-colors ${
                          selectionMode
                            ? "font-semibold text-foreground border-foreground"
                            : "font-normal text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {selectionMode ? "Done" : "Multi-select"}
                      </button>
                      {selectionMode && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedRenderIds(
                                new Set(filteredGalleryItems.map((item) => item.render.id))
                              )
                            }
                            className="max-lg:snap-start max-lg:snap-always max-lg:touch-manipulation shrink-0 rounded-full border border-border/70 bg-white px-3 py-2 text-[11px] font-medium text-foreground transition-colors hover:bg-muted/40 sm:px-2.5 sm:py-1 sm:text-xs"
                          >
                            Select all
                          </button>
                          {selectedRenderIds.size > 0 && (
                            <>
                              <button
                                type="button"
                                onClick={clearRenderSelection}
                                className="max-lg:snap-start max-lg:snap-always max-lg:touch-manipulation shrink-0 rounded-full border border-border/70 bg-white px-3 py-2 text-[11px] font-medium text-foreground transition-colors hover:bg-muted/40 sm:px-2.5 sm:py-1 sm:text-xs"
                              >
                                Clear ({selectedRenderIds.size})
                              </button>
                              <span className="max-lg:max-w-[min(100%,12rem)] max-lg:shrink-0 max-lg:truncate max-lg:text-[11px] sm:max-w-none sm:text-xs text-muted-foreground">
                                {selectedRenderIds.size} selected — drag to a folder
                              </span>
                            </>
                          )}
                        </>
                      )}
                    </>
                  )}
                    </div>
                  </div>
                </div>
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
              ) : filteredGalleryItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  {galleryMediaMode === "videos" ? (
                    <Clapperboard className="mx-auto mb-4 h-12 w-12 text-muted-foreground/35" />
                  ) : (
                    <Image className="mx-auto mb-4 h-12 w-12 text-muted-foreground/35" />
                  )}
                  <p className="text-sm text-muted-foreground">
                    {galleryMediaMode === "videos"
                      ? "Aucune vidéo dans cette vue."
                      : "Aucune image à afficher pour cette vue."}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setGalleryMediaMode(galleryMediaMode === "videos" ? "images" : "videos")
                    }
                    className="mt-4 text-xs font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {galleryMediaMode === "videos" ? "Voir les images" : "Voir les vidéos"}
                  </button>
                </div>
              ) : (
                <>
                  <div className="overflow-hidden rounded-[4px]">
                    <div
                      ref={galleryMasonryRef}
                      className="columns-2 gap-px sm:columns-3 lg:columns-4"
                    >
                    {filteredGalleryItems.map((item, index) => {
                      const rad = galleryTileRadiusClasses(item.key, galleryTopCorners);
                      const isSelected =
                        selectionMode && selectedRenderIds.has(item.render.id);
                      const idsToDrag =
                        selectionMode &&
                        selectedRenderIds.size > 0 &&
                        selectedRenderIds.has(item.render.id)
                          ? Array.from(selectedRenderIds)
                          : [item.render.id];
                      return (
                      <div
                        key={item.key}
                        data-item-key={item.key}
                        draggable
                        title={
                          selectionMode &&
                          selectedRenderIds.size > 1 &&
                          selectedRenderIds.has(item.render.id)
                            ? `Drag ${selectedRenderIds.size} renders to a folder`
                            : "Drag into a folder in the sidebar"
                        }
                        onDragStart={(e) => {
                          const payload = JSON.stringify({ ids: idsToDrag });
                          e.dataTransfer.setData(RENDER_DRAG_MIME, payload);
                          e.dataTransfer.setData("text/plain", idsToDrag.join(","));
                          e.dataTransfer.effectAllowed = "move";
                          setDraggingRenderIds(new Set(idsToDrag));
                        }}
                        onDragEnd={() => setDraggingRenderIds(new Set())}
                        className={`group relative mb-px w-full min-w-0 break-inside-avoid select-none overflow-hidden border transition-[box-shadow,border-color] ${rad.card} ${
                          selectionMode ? "cursor-pointer" : "cursor-pointer lg:cursor-grab lg:active:cursor-grabbing"
                        } ${
                          draggingRenderIds.has(item.render.id) ? "opacity-60" : ""
                        } ${
                          isSelected
                            ? "border-primary shadow-[0_0_0_1px_hsl(var(--primary)),0_0_16px_-4px_hsl(var(--primary)/0.4)]"
                            : "border-transparent"
                        }`}
                        onClick={() => {
                          if (selectionMode) {
                            toggleRenderSelection(item.render.id);
                            return;
                          }
                          if (!item.imageUrl && item.variant !== "video") return;
                          setStudioRender(item.render);
                          setStudioPreviewVariant(item.variant);
                        }}
                      >
                        <div
                          className={`relative w-full overflow-hidden bg-muted ${rad.inner}`}
                          style={{ aspectRatio: getAspectRatio(item.render) }}
                        >
                          {item.imageUrl ? (
                            <>
                              {!loadedImages.has(item.key) && (
                                <div
                                  className={`absolute inset-0 bg-muted animate-pulse ${rad.pulse}`}
                                />
                              )}
                              <img
                                src={item.imageUrl}
                                alt="Render"
                                loading={index < 16 ? "eager" : "lazy"}
                                decoding="async"
                                className={`h-full w-full object-cover transition-opacity duration-300 ${rad.img} ${
                                  loadedImages.has(item.key) ? "opacity-100" : "opacity-0"
                                }`}
                                onLoad={() => {
                                  handleImageLoaded(item.key);
                                  remeasureGalleryTopCorners();
                                }}
                              />
                              {item.variant === "video" && (
                                <div className="absolute top-1 right-1 z-[7] sm:top-2 sm:right-2 rounded-[4px] border border-white/20 bg-black/70 p-0.5 text-white sm:p-1">
                                  <Clapperboard className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                </div>
                              )}
                              {galleryItemShows4KBadge(item.variant, item.render.metadata) && (
                                <Render4KBadge className="absolute left-1 top-1 z-[7] sm:left-2 sm:top-2" />
                              )}
                              {isSelected && (
                                <>
                                  <div
                                    className="absolute inset-0 z-[5] bg-primary/35 pointer-events-none"
                                    aria-hidden
                                  />
                                  <div
                                    className="absolute top-1.5 left-1.5 z-[6] flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-md pointer-events-none"
                                    aria-hidden
                                  >
                                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                                  </div>
                                </>
                              )}
                              {/* Hover overlay — Midjourney-like: STUDIO centré, actions fines en bas à droite */}
                              <div
                                className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100"
                                draggable={false}
                                onDragStart={(e) => e.preventDefault()}
                              >
                                <div
                                  className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent"
                                  aria-hidden
                                />
                                <div className="absolute inset-0 flex items-center justify-center p-4">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setStudioRender(item.render);
                                      setStudioPreviewVariant(item.variant);
                                    }}
                                    className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/35 px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white shadow-[0_1px_12px_rgba(0,0,0,0.45)] backdrop-blur-[1px] transition-colors hover:border-white/55 hover:bg-white/10"
                                  >
                                    <Eye className="h-4 w-4 shrink-0" strokeWidth={2} />
                                    Studio
                                  </button>
                                </div>
                                <div className="absolute bottom-2.5 right-2.5 flex items-center gap-0.5 sm:bottom-3 sm:right-3 sm:gap-0.5">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleFavorite(item.render);
                                    }}
                                    disabled={favoritingIds.has(item.render.id)}
                                    title={isFavorite(item.render) ? "Retirer des favoris" : "Favori"}
                                    className="pointer-events-auto inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 disabled:opacity-40"
                                  >
                                    {favoritingIds.has(item.render.id) ? (
                                      <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2} />
                                    ) : (
                                      <Heart
                                        className={`h-5 w-5 ${isFavorite(item.render) ? "fill-white" : ""}`}
                                        strokeWidth={2}
                                      />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (item.variant === "video" && item.render.metadata?.video_url) {
                                        downloadImage(
                                          item.render.metadata.video_url,
                                          `renderz-${item.render.id}-video.mp4`
                                        );
                                        return;
                                      }
                                      downloadImage(
                                        item.imageUrl,
                                        `renderz-${item.render.id}${item.variant === "4k" ? "-4k" : ""}.png`
                                      );
                                    }}
                                    title="Télécharger"
                                    className="pointer-events-auto inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15"
                                  >
                                    <Download className="h-5 w-5" strokeWidth={2} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPendingDeleteRenderId(item.render.id);
                                    }}
                                    disabled={deletingIds.has(item.render.id)}
                                    title="Supprimer"
                                    className="pointer-events-auto inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 hover:text-red-200 disabled:opacity-40"
                                  >
                                    {deletingIds.has(item.render.id) ? (
                                      <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2} />
                                    ) : (
                                      <Trash2 className="h-5 w-5" strokeWidth={2} />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div
                              className={`relative flex w-full flex-col items-center justify-center gap-2 overflow-hidden ${rad.inner}`}
                              style={{ aspectRatio: getAspectRatio(item.render) }}
                            >
                              {isSelected && (
                                <>
                                  <div
                                    className="absolute inset-0 z-[5] bg-primary/35 pointer-events-none"
                                    aria-hidden
                                  />
                                  <div
                                    className="absolute top-1.5 left-1.5 z-[6] flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-md pointer-events-none"
                                    aria-hidden
                                  >
                                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                                  </div>
                                </>
                              )}
                              {item.render.status === "failed" ? (
                                <>
                                  <X className="w-6 h-6 text-red-400" />
                                  <p className="text-[10px] font-mono text-muted-foreground">Render failed</p>
                                </>
                              ) : (
                                <>
                                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                  <p className="text-[10px] font-mono text-muted-foreground/80">Generating...</p>
                                </>
                              )}
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
                            </div>
                          )}
                        </div>
                      </div>
                    );
                    })}
                    </div>
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
          <div className={`fixed bottom-0 left-0 right-0 z-30 transition-all duration-300 ${
            sidebarOpen ? "lg:left-[260px]" : "lg:left-[52px]"
          }`}>
            <div className="flex justify-center w-full">
              <div className="m-2 w-full max-w-[1200px] p-2 sm:m-4 sm:p-4 lg:m-6 lg:p-5">
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
          galleryRenders={rendersGalleryOrdered}
          projects={projects.map((p) => ({ id: p.id, name: p.name }))}
          previewVariant={studioPreviewVariant}
          billingUnlimited={Boolean(billing?.unlimited)}
          onNavigateToRender={(r) => {
            setStudioRender(r);
            setStudioPreviewVariant(undefined);
          }}
          onClose={() => {
            if (
              studioRender.status === "processing" ||
              studioRender.status === "pending" ||
              studioRender.status === "upscaling"
            ) {
              setPendingStudioRenderIds((prev) => new Set(prev).add(studioRender.id));
            }
            setStudioRender(null);
            setStudioPreviewVariant(undefined);
          }}
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
            void fetchRenders(0, true);
            void fetchProjects();
          }}
          onRenderQueued={(renderId) => {
            setPendingStudioRenderIds((prev) => new Set(prev).add(renderId));
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

      {readyRenderToast && (
        <button
          onClick={() => {
            setStudioRender(readyRenderToast);
            setStudioPreviewVariant(undefined);
            setReadyRenderToast(null);
          }}
          className="fixed bottom-20 right-4 sm:right-6 z-[110] max-w-[320px] bg-black/90 text-white border border-white/20 px-4 py-3 shadow-lg backdrop-blur-sm animate-in slide-in-from-bottom-2 fade-in duration-300 text-left hover:bg-black transition-colors"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-green-400 flex-shrink-0" />
            <div>
              <p className="text-xs font-mono">Render ready</p>
              <p className="text-[10px] text-white/70 font-mono">Click to open in studio</p>
            </div>
          </div>
        </button>
      )}
    </div>
  );
}
