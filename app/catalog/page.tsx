"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  PanelLeft,
  PanelLeftClose,
  Plus,
  Loader2,
  Search,
  Image as ImageIcon,
  User,
  Folder,
  FolderPlus,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Trash2,
  Library,
  Lock,
  Users,
  Check,
  X,
  Inbox,
  Loader2 as LoaderIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/brand-logo";
import { ProjectSidebar, type Project } from "@/components/project-sidebar";
import { OrganizationSwitcher } from "@/components/organization-switcher";
import { VisibilityChip } from "@/components/visibility-chip";
import {
  VisibilityFilter,
  serializeVisibilityFilter,
  type VisibilityFilterValue,
} from "@/components/visibility-filter";
import { useSession } from "@/lib/auth-client";
import type { CatalogFolder } from "@/components/catalog-item-form";
import {
  CatalogItemForm,
  type CatalogItem,
  type CatalogItemFormValues,
} from "@/components/catalog-item-form";
import type { BillingPayload } from "@/lib/billing/billing-types";
import { ArrowUpRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CatalogPage() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();

  /** Vue catalogue — état principal */
  const [folders, setFolders] = useState<CatalogFolder[]>([]);
  const [items, setItems] = useState<CatalogItem[]>([]);
  /** Dossier actuellement ouvert (null = racine) */
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [foldersLoading, setFoldersLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);

  /** Création / renommage d’un dossier dans la zone principale */
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderSubmitting, setNewFolderSubmitting] = useState(false);
  const [folderMenuId, setFolderMenuId] = useState<string | null>(null);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [renameSubmitting, setRenameSubmitting] = useState(false);
  const [pendingDeleteFolderId, setPendingDeleteFolderId] = useState<string | null>(null);
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);

  /** Toggle visibilité items / dossiers (org sharing). */
  const [togglingItemVisibilityIds, setTogglingItemVisibilityIds] = useState<Set<string>>(new Set());
  const [togglingFolderVisibilityIds, setTogglingFolderVisibilityIds] = useState<Set<string>>(new Set());

  /** Filtre multi-sélection sur la visibilité (Shared / Private). */
  const [visibilityFilter, setVisibilityFilter] = useState<Set<VisibilityFilterValue>>(new Set());

  /** Sidebar projets (partagée avec /profile) */
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  /** Badge tier (header, comme /profile) */
  const [billing, setBilling] = useState<BillingPayload | null>(null);
  const [billingLoading, setBillingLoading] = useState(true);

  useEffect(() => {
    if (!sessionPending && !session) {
      router.replace("/");
    }
  }, [session, sessionPending, router]);

  const fetchFolders = useCallback(async () => {
    setFoldersLoading(true);
    try {
      const params = new URLSearchParams();
      const vis = serializeVisibilityFilter(visibilityFilter);
      if (vis) params.set("visibility", vis);
      const url = `/api/catalog/folders${params.toString() ? `?${params}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { folders?: CatalogFolder[] };
      setFolders(Array.isArray(data.folders) ? data.folders : []);
    } catch (err) {
      console.error("fetch folders:", err);
    } finally {
      setFoldersLoading(false);
    }
  }, [visibilityFilter]);

  const fetchItems = useCallback(
    async (folderId: string | null) => {
      setItemsLoading(true);
      try {
        const param = folderId ? folderId : "unassigned";
        const params = new URLSearchParams();
        params.set("folder_id", param);
        const vis = serializeVisibilityFilter(visibilityFilter);
        if (vis) params.set("visibility", vis);
        const url = `/api/catalog/items?${params.toString()}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { items?: CatalogItem[] };
        setItems(Array.isArray(data.items) ? data.items : []);
      } catch (err) {
        console.error("fetch items:", err);
      } finally {
        setItemsLoading(false);
      }
    },
    [visibilityFilter]
  );

  const fetchProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.projects) setProjects(data.projects);
    } catch (err) {
      console.error("fetch projects:", err);
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  const fetchBilling = useCallback(async () => {
    setBillingLoading(true);
    try {
      const res = await fetch("/api/user/billing");
      const data = await res.json();
      if (res.ok) setBilling(data);
    } catch (err) {
      console.error("billing fetch:", err);
    } finally {
      setBillingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!session) return;
    void fetchFolders();
    void fetchProjects();
    void fetchBilling();
  }, [session, fetchFolders, fetchProjects, fetchBilling]);

  useEffect(() => {
    if (!session) return;
    void fetchItems(currentFolderId);
  }, [session, currentFolderId, fetchItems]);

  /** Fermer le menu d’actions d’un dossier au clic extérieur */
  useEffect(() => {
    if (!folderMenuId) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (
        t.closest("[data-catalog-folder-menu]") ||
        t.closest("[data-catalog-folder-menu-trigger]")
      )
        return;
      setFolderMenuId(null);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [folderMenuId]);

  const childrenFolders = useMemo(
    () => folders.filter((f) => (f.parent_id ?? null) === currentFolderId),
    [folders, currentFolderId]
  );

  const breadcrumb = useMemo(() => {
    const byId = new Map(folders.map((f) => [f.id, f]));
    const path: CatalogFolder[] = [];
    let cursor: string | null = currentFolderId;
    let safety = 50;
    while (cursor && safety-- > 0) {
      const f = byId.get(cursor);
      if (!f) break;
      path.unshift(f);
      cursor = f.parent_id ?? null;
    }
    return path;
  }, [folders, currentFolderId]);

  const filteredFolders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return childrenFolders;
    return childrenFolders.filter((f) => f.name.toLowerCase().includes(q));
  }, [childrenFolders, search]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (it) =>
        it.title.toLowerCase().includes(q) ||
        (it.description ?? "").toLowerCase().includes(q)
    );
  }, [items, search]);

  /* ------------------------- Mutations ------------------------- */

  const submitCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name || newFolderSubmitting) return;
    setNewFolderSubmitting(true);
    try {
      const res = await fetch("/api/catalog/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parent_id: currentFolderId }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setCreatingFolder(false);
      setNewFolderName("");
      await fetchFolders();
    } catch (err) {
      console.error("create folder:", err);
      alert(err instanceof Error ? err.message : "Création impossible");
    } finally {
      setNewFolderSubmitting(false);
    }
  };

  const submitRenameFolder = async (folderId: string) => {
    const name = renameDraft.trim();
    if (!name || renameSubmitting) return;
    setRenameSubmitting(true);
    try {
      const res = await fetch(`/api/catalog/folders/${folderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setRenamingFolderId(null);
      setRenameDraft("");
      await fetchFolders();
    } catch (err) {
      console.error("rename folder:", err);
      alert(err instanceof Error ? err.message : "Renommage impossible");
    } finally {
      setRenameSubmitting(false);
    }
  };

  const confirmDeleteFolder = async () => {
    if (!pendingDeleteFolderId) return;
    setDeletingFolderId(pendingDeleteFolderId);
    try {
      const res = await fetch(`/api/catalog/folders/${pendingDeleteFolderId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const removedId = pendingDeleteFolderId;
      setPendingDeleteFolderId(null);
      await fetchFolders();
      if (currentFolderId === removedId) {
        setCurrentFolderId(null);
      } else {
        await fetchItems(currentFolderId);
      }
    } catch (err) {
      console.error("delete folder:", err);
      alert(err instanceof Error ? err.message : "Suppression impossible");
    } finally {
      setDeletingFolderId(null);
    }
  };

  const handleCreateCatalogFolder = useCallback(
    async (name: string, parentId: string | null) => {
      const res = await fetch("/api/catalog/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parent_id: parentId }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      await fetchFolders();
    },
    [fetchFolders]
  );

  const handleRenameCatalogFolder = useCallback(
    async (folderId: string, name: string) => {
      const res = await fetch(`/api/catalog/folders/${folderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      await fetchFolders();
    },
    [fetchFolders]
  );

  const handleDeleteCatalogFolder = useCallback(
    async (folderId: string) => {
      const res = await fetch(`/api/catalog/folders/${folderId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      await fetchFolders();
      if (currentFolderId === folderId) {
        setCurrentFolderId(null);
      } else {
        await fetchItems(currentFolderId);
      }
    },
    [currentFolderId, fetchFolders, fetchItems]
  );

  const openCreateItem = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const openEditItem = (item: CatalogItem) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const handleSubmitItem = async (values: CatalogItemFormValues) => {
    const url = editingItem
      ? `/api/catalog/items/${editingItem.id}`
      : "/api/catalog/items";
    const method = editingItem ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    closeForm();
    await fetchItems(currentFolderId);
  };

  const handleDeleteItem = async () => {
    if (!editingItem) return;
    const res = await fetch(`/api/catalog/items/${editingItem.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    closeForm();
    await fetchItems(currentFolderId);
  };

  const handleToggleItemVisibility = useCallback(
    async (item: CatalogItem, next: "private" | "organization") => {
      if (togglingItemVisibilityIds.has(item.id)) return;
      setTogglingItemVisibilityIds((prev) => new Set(prev).add(item.id));
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, visibility: next } : i))
      );
      try {
        const res = await fetch(`/api/catalog/items/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visibility: next }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error || `HTTP ${res.status}`);
        }
      } catch (err) {
        console.error("toggle item visibility:", err);
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, visibility: next === "private" ? "organization" : "private" }
              : i
          )
        );
        alert(err instanceof Error ? err.message : "Mise à jour impossible");
      } finally {
        setTogglingItemVisibilityIds((prev) => {
          const s = new Set(prev);
          s.delete(item.id);
          return s;
        });
      }
    },
    [togglingItemVisibilityIds]
  );

  const handleToggleFolderVisibility = useCallback(
    async (folder: CatalogFolder, next: "private" | "organization") => {
      if (togglingFolderVisibilityIds.has(folder.id)) return;
      setTogglingFolderVisibilityIds((prev) => new Set(prev).add(folder.id));
      setFolders((prev) =>
        prev.map((f) => (f.id === folder.id ? { ...f, visibility: next } : f))
      );
      try {
        const res = await fetch(`/api/catalog/folders/${folder.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visibility: next }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error || `HTTP ${res.status}`);
        }
      } catch (err) {
        console.error("toggle folder visibility:", err);
        setFolders((prev) =>
          prev.map((f) =>
            f.id === folder.id
              ? { ...f, visibility: next === "private" ? "organization" : "private" }
              : f
          )
        );
        alert(err instanceof Error ? err.message : "Mise à jour impossible");
      } finally {
        setTogglingFolderVisibilityIds((prev) => {
          const s = new Set(prev);
          s.delete(folder.id);
          return s;
        });
      }
    },
    [togglingFolderVisibilityIds]
  );

  /* ------------------------- Sidebar projets (réutilisé) ------------------------- */

  const handleCreateProject = useCallback(
    async (name: string) => {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to create project");
      await fetchProjects();
    },
    [fetchProjects]
  );

  const handleDeleteProject = useCallback(
    async (projectId: string) => {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete project");
      await fetchProjects();
    },
    [fetchProjects]
  );

  const handleRenameProject = useCallback(
    async (projectId: string, name: string) => {
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
    },
    [fetchProjects]
  );

  const tierBadgeText = billingLoading
    ? "…"
    : !billing
      ? "FREE"
      : billing.tier === "free"
        ? "FREE"
        : billing.tier === "pro"
          ? "PRO"
          : "ENT";

  if (sessionPending) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!session) return null;

  return (
    <div className="relative min-h-[100dvh] bg-white">
      {/* Header — mêmes éléments que /profile */}
      <header className="fixed top-0 left-0 right-0 z-[100] border-b border-border bg-white/80 backdrop-blur-sm">
        <div className="flex h-14 items-center justify-between px-3 sm:h-16 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="rounded-md p-1.5 transition-colors hover:bg-muted lg:hidden"
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <BrandLogo className="transition-opacity hover:opacity-90" />
          </div>
          <div className="flex items-center gap-2">
            <OrganizationSwitcher className="hidden sm:flex" />
            <Badge
              asChild
              variant="outline"
              className="cursor-pointer gap-1 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide hover:bg-muted/80 sm:gap-1.5 sm:text-[11px]"
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
            <Link href="/settings">
              <div className="flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-border bg-muted transition-all hover:ring-2 hover:ring-primary">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || ""}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </Link>
          </div>
        </div>
      </header>

      <div className="relative pt-14 sm:pt-16">
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 z-[130] lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden
          >
            <div className="absolute inset-0 bg-black/30" />
          </div>
        )}

        <div
          id="profile-project-sidebar"
          className={cn(
            "fixed bottom-0 top-14 z-[140] w-[260px] bg-white transition-all duration-300 sm:top-16 lg:z-40",
            mobileSidebarOpen ? "left-0" : "-left-[280px]",
            sidebarOpen ? "lg:left-0" : "lg:-left-[280px]"
          )}
        >
          <ProjectSidebar
            catalogActive
            onOpenCatalog={() => {
              setCurrentFolderId(null);
              setMobileSidebarOpen(false);
            }}
            onOpenRenders={() => {
              setMobileSidebarOpen(false);
              router.push("/profile");
            }}
            projects={projects}
            selectedProjectId={null}
            favoritesOnly={false}
            onSelectProject={() => {}}
            onCreateProject={handleCreateProject}
            onDeleteProject={handleDeleteProject}
            onRenameProject={handleRenameProject}
            isLoading={false}
            catalogFolders={folders}
            selectedCatalogFolderId={currentFolderId}
            onSelectCatalogFolder={(id) => {
              setCurrentFolderId(id);
              setMobileSidebarOpen(false);
            }}
            onCreateCatalogFolder={handleCreateCatalogFolder}
            onRenameCatalogFolder={handleRenameCatalogFolder}
            onDeleteCatalogFolder={handleDeleteCatalogFolder}
            catalogFoldersLoading={foldersLoading}
          />
        </div>

        <main
          className={cn(
            "transition-[margin] duration-300",
            sidebarOpen ? "lg:ml-[260px]" : "lg:ml-0"
          )}
        >
          {/* Barre sticky : breadcrumb + actions */}
          <div className="sticky top-14 z-[80] -mx-2 bg-white/95 px-2 py-3 backdrop-blur-md sm:top-16 sm:mx-0 sm:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSidebarOpen((o) => !o)}
                className="hidden h-8 items-center justify-center rounded-md p-0 text-foreground transition-opacity hover:opacity-70 lg:inline-flex [&_svg]:!size-[18px]"
                title={sidebarOpen ? "Replier la barre latérale" : "Afficher la barre latérale"}
              >
                {sidebarOpen ? (
                  <PanelLeftClose strokeWidth={1.5} />
                ) : (
                  <PanelLeft strokeWidth={1.5} />
                )}
              </button>

              <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto text-sm">
                <button
                  type="button"
                  onClick={() => setCurrentFolderId(null)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 font-medium transition-colors",
                    currentFolderId === null
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <Library className="h-4 w-4" strokeWidth={2} />
                  Catalogue
                </button>
                {breadcrumb.map((f) => (
                  <div key={f.id} className="flex shrink-0 items-center gap-1">
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
                    <button
                      type="button"
                      onClick={() => setCurrentFolderId(f.id)}
                      className={cn(
                        "rounded-md px-2 py-1 font-medium transition-colors",
                        currentFolderId === f.id
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      {f.name}
                    </button>
                  </div>
                ))}
              </nav>

              <div className="ml-auto flex items-center gap-2">
                <VisibilityFilter
                  variant="compact"
                  value={visibilityFilter}
                  onChange={setVisibilityFilter}
                />
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher…"
                    className="h-8 w-[160px] rounded-md pl-7 text-sm sm:w-[220px]"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    setCreatingFolder(true);
                    setNewFolderName("");
                  }}
                >
                  <FolderPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Nouveau dossier</span>
                  <span className="sm:hidden">Dossier</span>
                </Button>
                <Button type="button" onClick={openCreateItem} size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Nouvel item</span>
                  <span className="sm:hidden">Item</span>
                </Button>
              </div>
            </div>

            {creatingFolder && (
              <div className="mt-2 flex items-center gap-1.5">
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder={
                    currentFolderId === null
                      ? "Nom du dossier"
                      : `Nom du sous-dossier${breadcrumb.length ? ` dans ${breadcrumb.at(-1)!.name}` : ""}`
                  }
                  autoFocus
                  disabled={newFolderSubmitting}
                  className="h-9 max-w-md rounded-md text-sm font-medium"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void submitCreateFolder();
                    if (e.key === "Escape") {
                      setCreatingFolder(false);
                      setNewFolderName("");
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void submitCreateFolder()}
                  disabled={newFolderSubmitting || !newFolderName.trim()}
                >
                  {newFolderSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Créer"
                  )}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setCreatingFolder(false);
                    setNewFolderName("");
                  }}
                  disabled={newFolderSubmitting}
                >
                  Annuler
                </Button>
              </div>
            )}
          </div>

          <div className="px-3 pb-12 pt-2 sm:px-6">
            {/* Section Dossiers */}
            {(filteredFolders.length > 0 || foldersLoading) && (
              <section className="mb-6">
                <div className="mb-2 flex items-baseline gap-2">
                  <h2 className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                    Dossiers
                  </h2>
                  <span className="text-[10px] tabular-nums text-muted-foreground/70">
                    {filteredFolders.length}
                  </span>
                </div>

                {foldersLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {filteredFolders.map((f) => {
                      const isRenaming = renamingFolderId === f.id;
                      const isMenuOpen = folderMenuId === f.id;
                      return (
                        <div
                          key={f.id}
                          className={cn(
                            "group relative flex items-center gap-2 rounded-md border border-border/80 bg-white px-3 py-2.5 transition-colors",
                            isRenaming
                              ? "border-foreground/40"
                              : "hover:border-foreground/40 hover:bg-muted/40"
                          )}
                        >
                          {isRenaming ? (
                            <>
                              <Folder
                                className="h-4 w-4 shrink-0 text-muted-foreground"
                                strokeWidth={2}
                              />
                              <Input
                                value={renameDraft}
                                onChange={(e) => setRenameDraft(e.target.value)}
                                autoFocus
                                disabled={renameSubmitting}
                                className="h-7 flex-1 rounded-sm border-border/60 px-1.5 text-sm"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    void submitRenameFolder(f.id);
                                  if (e.key === "Escape") {
                                    setRenamingFolderId(null);
                                    setRenameDraft("");
                                  }
                                }}
                              />
                              <button
                                type="button"
                                disabled={renameSubmitting || !renameDraft.trim()}
                                onClick={() => void submitRenameFolder(f.id)}
                                className="flex h-7 w-7 items-center justify-center rounded-md text-foreground hover:bg-muted disabled:opacity-50"
                              >
                                {renameSubmitting ? (
                                  <LoaderIcon className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                              </button>
                              <button
                                type="button"
                                disabled={renameSubmitting}
                                onClick={() => {
                                  setRenamingFolderId(null);
                                  setRenameDraft("");
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => setCurrentFolderId(f.id)}
                                className="flex min-w-0 flex-1 items-center gap-2 text-left"
                              >
                                <Folder
                                  className="h-4 w-4 shrink-0 text-muted-foreground"
                                  strokeWidth={2}
                                />
                                <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                                  {f.name}
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFolderMenuId(isMenuOpen ? null : f.id);
                                }}
                                data-catalog-folder-menu-trigger
                                className={cn(
                                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-opacity hover:bg-muted hover:text-foreground",
                                  isMenuOpen
                                    ? "opacity-100"
                                    : "opacity-0 group-hover:opacity-100"
                                )}
                                aria-label="Actions du dossier"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                              {isMenuOpen && (
                                <div
                                  data-catalog-folder-menu
                                  className="absolute right-2 top-[calc(100%-2px)] z-20 min-w-[190px] overflow-hidden rounded-[6px] border border-border/80 bg-white py-1 shadow-md"
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRenamingFolderId(f.id);
                                      setRenameDraft(f.name);
                                      setFolderMenuId(null);
                                    }}
                                    className="mx-1 flex w-[calc(100%-8px)] items-center gap-2 rounded-[4px] px-2.5 py-1.5 text-left text-xs font-medium text-foreground hover:bg-muted/50"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                    Renommer
                                  </button>
                                  {f.organization_id && (
                                    <button
                                      type="button"
                                      disabled={togglingFolderVisibilityIds.has(f.id)}
                                      onClick={() => {
                                        const next: "private" | "organization" =
                                          f.visibility === "organization"
                                            ? "private"
                                            : "organization";
                                        handleToggleFolderVisibility(f, next);
                                        setFolderMenuId(null);
                                      }}
                                      className="mx-1 flex w-[calc(100%-8px)] items-center gap-2 rounded-[4px] px-2.5 py-1.5 text-left text-xs font-medium text-foreground hover:bg-muted/50 disabled:opacity-60"
                                    >
                                      {togglingFolderVisibilityIds.has(f.id) ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : f.visibility === "organization" ? (
                                        <>
                                          <Lock className="h-3.5 w-3.5" />
                                          Rendre privé
                                        </>
                                      ) : (
                                        <>
                                          <Users className="h-3.5 w-3.5" />
                                          Partager avec l'org
                                        </>
                                      )}
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPendingDeleteFolderId(f.id);
                                      setFolderMenuId(null);
                                    }}
                                    className="mx-1 flex w-[calc(100%-8px)] items-center gap-2 rounded-[4px] px-2.5 py-1.5 text-left text-xs font-medium text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Supprimer
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* Section Items */}
            <section>
              <div className="mb-2 flex items-baseline gap-2">
                <h2 className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                  Items
                </h2>
                <span className="text-[10px] tabular-nums text-muted-foreground/70">
                  {filteredItems.length}
                  {filteredItems.length !== items.length ? ` / ${items.length}` : ""}
                </span>
              </div>

              {itemsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredItems.length === 0 && filteredFolders.length === 0 ? (
                <div className="mx-auto mt-2 max-w-md rounded-lg border border-dashed border-border/80 bg-muted/20 p-8 text-center">
                  {search.trim() ? (
                    <>
                      <Search className="mx-auto mb-3 h-7 w-7 text-muted-foreground/40" />
                      <p className="text-sm font-medium text-foreground">
                        Aucun résultat
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Essayez un autre terme de recherche.
                      </p>
                    </>
                  ) : currentFolderId === null ? (
                    <>
                      <Library className="mx-auto mb-3 h-7 w-7 text-muted-foreground/40" />
                      <p className="text-sm font-medium text-foreground">
                        Votre catalogue est vide
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Ajoutez un premier item ou créez un dossier pour ranger
                        votre mobilier, vos matières, etc.
                      </p>
                      <div className="mt-4 flex justify-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setCreatingFolder(true);
                            setNewFolderName("");
                          }}
                          className="gap-1.5"
                        >
                          <FolderPlus className="h-4 w-4" />
                          Dossier
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={openCreateItem}
                          className="gap-1.5"
                        >
                          <Plus className="h-4 w-4" />
                          Nouvel item
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Inbox className="mx-auto mb-3 h-7 w-7 text-muted-foreground/40" />
                      <p className="text-sm font-medium text-foreground">
                        Ce dossier est vide
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Ajoutez un item ou un sous-dossier pour le remplir.
                      </p>
                      <div className="mt-4 flex justify-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setCreatingFolder(true);
                            setNewFolderName("");
                          }}
                          className="gap-1.5"
                        >
                          <FolderPlus className="h-4 w-4" />
                          Sous-dossier
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={openCreateItem}
                          className="gap-1.5"
                        >
                          <Plus className="h-4 w-4" />
                          Nouvel item
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ) : filteredItems.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Aucun item dans cette vue.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {filteredItems.map((it) => {
                    const isMine = session?.user.id === it.user_id;
                    return (
                      <div
                        key={it.id}
                        className="group relative flex flex-col overflow-hidden rounded-lg border border-border/80 bg-white text-left transition-all hover:border-foreground/40 hover:shadow-sm"
                      >
                        <button
                          type="button"
                          onClick={() => openEditItem(it)}
                          className="flex flex-col text-left"
                        >
                          <div className="relative aspect-square w-full overflow-hidden bg-muted/30">
                            {it.image_url ? (
                              <img
                                src={it.image_url}
                                alt=""
                                loading="lazy"
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <ImageIcon className="h-7 w-7 text-muted-foreground/40" />
                              </div>
                            )}
                          </div>
                          <div className="flex min-h-0 flex-col gap-1 p-2.5">
                            <p className="line-clamp-1 text-sm font-medium text-foreground">
                              {it.title}
                            </p>
                            {it.description && (
                              <p className="line-clamp-2 text-xs text-muted-foreground">
                                {it.description}
                              </p>
                            )}
                          </div>
                        </button>
                        <div
                          className={cn(
                            "pointer-events-none absolute left-1.5 top-1.5 z-[2] transition-opacity",
                            it.visibility === "organization" || !isMine
                              ? "opacity-100"
                              : "opacity-0 group-hover:opacity-100"
                          )}
                        >
                          <div className="pointer-events-auto">
                            <VisibilityChip
                              visibility={it.visibility ?? "private"}
                              loading={togglingItemVisibilityIds.has(it.id)}
                              canShare={!!it.organization_id}
                              compact
                              onToggle={
                                isMine
                                  ? (next) => handleToggleItemVisibility(it, next)
                                  : undefined
                              }
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      <CatalogItemForm
        open={showForm}
        initial={editingItem}
        defaultFolderId={currentFolderId}
        folders={folders}
        onClose={closeForm}
        onSubmit={handleSubmitItem}
        onDelete={editingItem ? handleDeleteItem : undefined}
      />

      {pendingDeleteFolderId && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deletingFolderId) {
              setPendingDeleteFolderId(null);
            }
          }}
        >
          <div className="w-[min(420px,100%)] rounded-lg border border-border/80 bg-white p-5 shadow-xl">
            <h3 className="text-base font-semibold text-foreground">
              Supprimer ce dossier ?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Les sous-dossiers seront supprimés. Les items contenus reviennent
              dans « Sans dossier » et ne sont pas perdus.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPendingDeleteFolderId(null)}
                disabled={!!deletingFolderId}
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={() => void confirmDeleteFolder()}
                disabled={!!deletingFolderId}
                className="!bg-red-600 hover:!bg-red-700"
              >
                {deletingFolderId === pendingDeleteFolderId ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Supprimer"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
