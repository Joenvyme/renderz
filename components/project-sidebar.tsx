"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import type { CatalogFolder } from "@/components/catalog-item-form";
import {
  buildCatalogTree,
  CatalogSidebarTree,
} from "@/components/catalog-sidebar-tree";
import { cn } from "@/lib/utils";
import {
  FolderOpen,
  FolderPlus,
  Settings,
  Loader2,
  X,
  Trash2,
  MoreHorizontal,
  Pencil,
  Check,
  LayoutGrid,
  Library,
  Images,
  Inbox,
} from "lucide-react";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
  render_count: number;
}

export const RENDER_DRAG_MIME = "application/x-renderz-render-id";

/** Parse drag payload: JSON `{ ids: string[] }`, comma-separated, or single UUID */
export function parseDragRenderIds(raw: string): string[] {
  if (!raw || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as { ids?: string[] };
    if (parsed?.ids && Array.isArray(parsed.ids)) {
      return Array.from(
        new Set(parsed.ids.filter((id): id is string => Boolean(id)))
      );
    }
  } catch {
    /* plain string */
  }
  if (raw.includes(",")) {
    return Array.from(
      new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))
    );
  }
  return [raw.trim()];
}

interface ProjectSidebarProps {
  projects: Project[];
  selectedProjectId: string | null; // null = "All", "unassigned"/"favorites" = special filters
  /** Filtre favoris de la galerie : la ligne « All » n’est active que si false */
  favoritesOnly: boolean;
  onSelectProject: (projectId: string | null) => void;
  onCreateProject: (name: string) => Promise<void>;
  onDeleteProject: (projectId: string) => Promise<void>;
  onRenameProject: (projectId: string, name: string) => Promise<void>;
  isLoading: boolean;
  /** Drop one or more renders from the gallery onto Unassigned or a project folder */
  onDropRender?: (renderIds: string[], projectId: string | null) => Promise<void>;
  catalogActive?: boolean;
  onOpenCatalog?: () => void;
  rendersActive?: boolean;
  onOpenRenders?: () => void;
  catalogFolders?: CatalogFolder[];
  selectedCatalogFolderId?: string | null;
  onSelectCatalogFolder?: (folderId: string | null) => void;
  onCreateCatalogFolder?: (
    name: string,
    parentId: string | null
  ) => Promise<void>;
  onRenameCatalogFolder?: (folderId: string, name: string) => Promise<void>;
  onDeleteCatalogFolder?: (folderId: string) => Promise<void>;
  catalogFoldersLoading?: boolean;
}

export function ProjectSidebar({
  projects,
  selectedProjectId,
  favoritesOnly,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onRenameProject,
  isLoading,
  onDropRender,
  catalogActive = false,
  onOpenCatalog,
  rendersActive = false,
  onOpenRenders,
  catalogFolders = [],
  selectedCatalogFolderId = null,
  onSelectCatalogFolder,
  onCreateCatalogFolder,
  onRenameCatalogFolder,
  onDeleteCatalogFolder,
  catalogFoldersLoading = false,
}: ProjectSidebarProps) {
  const [dropHoverTarget, setDropHoverTarget] = useState<string | null>(null);

  useEffect(() => {
    const clearHover = () => setDropHoverTarget(null);
    document.addEventListener("dragend", clearHover);
    return () => document.removeEventListener("dragend", clearHover);
  }, []);

  const [catalogMenuId, setCatalogMenuId] = useState<string | null>(null);
  const [catalogRenamingId, setCatalogRenamingId] = useState<string | null>(null);
  const [catalogRenameDraft, setCatalogRenameDraft] = useState("");
  const [catalogRenamingSubmitting, setCatalogRenamingSubmitting] = useState(false);
  const [pendingDeleteCatalogId, setPendingDeleteCatalogId] = useState<string | null>(null);
  const [deletingCatalogId, setDeletingCatalogId] = useState<string | null>(null);
  const [expandedCatalogIds, setExpandedCatalogIds] = useState<Set<string>>(new Set());

  const catalogTree = useMemo(
    () => buildCatalogTree(catalogFolders),
    [catalogFolders]
  );

  useEffect(() => {
    if (!catalogActive || !selectedCatalogFolderId || !catalogFolders.length) return;
    const byId = new Map(catalogFolders.map((f) => [f.id, f]));
    const pathIds: string[] = [];
    let cursor: string | null = selectedCatalogFolderId;
    let safety = 50;
    while (cursor && safety-- > 0) {
      pathIds.push(cursor);
      const f = byId.get(cursor);
      cursor = f?.parent_id ?? null;
    }
    if (pathIds.length === 0) return;
    setExpandedCatalogIds((prev) => {
      const next = new Set(prev);
      for (const id of pathIds) next.add(id);
      return next;
    });
  }, [catalogActive, selectedCatalogFolderId, catalogFolders]);

  useEffect(() => {
    if (!catalogMenuId) return;
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (
        target.closest("[data-catalog-sidebar-menu]") ||
        target.closest("[data-catalog-sidebar-menu-trigger]")
      )
        return;
      setCatalogMenuId(null);
    };
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, [catalogMenuId]);

  const toggleCatalogExpanded = useCallback((folderId: string) => {
    setExpandedCatalogIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  }, []);

  const handleDragOver = (e: React.DragEvent, targetKey: string) => {
    if (!onDropRender || catalogActive) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropHoverTarget(targetKey);
  };

  const handleDrop = async (e: React.DragEvent, projectId: string | null) => {
    if (!onDropRender || catalogActive) return;
    e.preventDefault();
    setDropHoverTarget(null);
    const raw =
      e.dataTransfer.getData(RENDER_DRAG_MIME) ||
      e.dataTransfer.getData("text/plain");
    const renderIds = parseDragRenderIds(raw);
    if (renderIds.length === 0) return;
    await onDropRender(renderIds, projectId);
  };

  const dropRing = (targetKey: string) =>
    onDropRender && !catalogActive && dropHoverTarget === targetKey
      ? "ring-2 ring-black ring-offset-1 ring-offset-white bg-muted/30"
      : "";

  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contextMenuId, setContextMenuId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteProjectId, setPendingDeleteProjectId] = useState<string | null>(null);
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [renamingSubmitting, setRenamingSubmitting] = useState(false);

  useEffect(() => {
    if (!contextMenuId) return;

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const clickedInMenu = target.closest("[data-project-menu]");
      const clickedMenuTrigger = target.closest("[data-project-menu-trigger]");

      if (clickedInMenu || clickedMenuTrigger) return;
      setContextMenuId(null);
    };

    document.addEventListener("click", handleDocumentClick);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, [contextMenuId]);

  const handleCreate = async () => {
    if (!newProjectName.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (catalogActive && onCreateCatalogFolder) {
        await onCreateCatalogFolder(
          newProjectName.trim(),
          selectedCatalogFolderId ?? null
        );
      } else {
        await onCreateProject(newProjectName.trim());
      }
      setNewProjectName("");
      setIsCreating(false);
    } catch (error) {
      console.error("Error creating folder:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const commitRenameCatalog = async (folderId: string) => {
    const trimmed = catalogRenameDraft.trim();
    if (!trimmed || catalogRenamingSubmitting || !onRenameCatalogFolder) return;
    setCatalogRenamingSubmitting(true);
    try {
      await onRenameCatalogFolder(folderId, trimmed);
      setCatalogRenamingId(null);
      setCatalogRenameDraft("");
    } catch (error) {
      console.error("Catalog rename error:", error);
      alert(error instanceof Error ? error.message : "Rename failed");
    } finally {
      setCatalogRenamingSubmitting(false);
    }
  };

  const handleDeleteCatalog = async (folderId: string) => {
    if (!onDeleteCatalogFolder) return;
    setDeletingCatalogId(folderId);
    try {
      await onDeleteCatalogFolder(folderId);
      setCatalogMenuId(null);
      if (selectedCatalogFolderId === folderId) {
        onSelectCatalogFolder?.(null);
      }
    } catch (error) {
      console.error("Error deleting catalog folder:", error);
    } finally {
      setDeletingCatalogId(null);
    }
  };

  const handleDelete = async (projectId: string) => {
    setDeletingId(projectId);
    try {
      await onDeleteProject(projectId);
      setContextMenuId(null);
      if (selectedProjectId === projectId) {
        onSelectProject(null);
      }
    } catch (error) {
      console.error("Error deleting project:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const allViewActive = catalogActive
    ? selectedCatalogFolderId === null
    : selectedProjectId === null && !favoritesOnly;

  const createPlaceholder = catalogActive
    ? selectedCatalogFolderId
      ? "Subfolder name…"
      : "Folder name…"
    : "Folder name…";

  const cancelRename = () => {
    setRenamingProjectId(null);
    setRenameDraft("");
  };

  const commitRename = async (projectId: string) => {
    const trimmed = renameDraft.trim();
    if (!trimmed || renamingSubmitting) return;
    setRenamingSubmitting(true);
    try {
      await onRenameProject(projectId, trimmed);
      cancelRename();
    } catch (error) {
      console.error("Rename error:", error);
      alert(error instanceof Error ? error.message : "Rename failed");
    } finally {
      setRenamingSubmitting(false);
    }
  };

  return (
    <aside className="flex h-full w-full flex-col border-r border-border/80 bg-white">
      {/* Scrollable Project List */}
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-2 pt-4 sm:pt-5">
        <div className="relative rounded-[4px]">
          <button
            type="button"
            onClick={() => {
              if (catalogActive) onSelectCatalogFolder?.(null);
              else onSelectProject(null);
            }}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-[4px] px-2.5 py-2 text-left text-sm font-medium tracking-tight transition-colors",
              allViewActive
                ? "bg-black text-white"
                : "text-foreground hover:bg-muted/45"
            )}
          >
            {catalogActive ? (
              <Library className="h-[15px] w-[15px] shrink-0 opacity-90" strokeWidth={2} />
            ) : (
              <LayoutGrid className="h-[15px] w-[15px] shrink-0 opacity-90" strokeWidth={2} />
            )}
            <span className="min-w-0 flex-1 truncate">All</span>
          </button>
        </div>

        {!catalogActive && onDropRender && (
          <div
            className={cn(
              "relative rounded-[4px] transition-colors",
              dropRing("unfiled")
            )}
            onDragOver={(e) => handleDragOver(e, "unfiled")}
            onDrop={(e) => handleDrop(e, null)}
          >
            <button
              type="button"
              onClick={() => onSelectProject("unassigned")}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-[4px] px-2.5 py-2 text-left text-sm font-medium tracking-tight transition-colors",
                selectedProjectId === "unassigned"
                  ? "bg-black text-white"
                  : "text-foreground hover:bg-muted/45"
              )}
            >
              <Inbox className="h-[15px] w-[15px] shrink-0 opacity-90" strokeWidth={2} />
              <span className="min-w-0 flex-1 truncate">Unfiled</span>
            </button>
          </div>
        )}

        {catalogActive ? (
          catalogFoldersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" strokeWidth={2} />
            </div>
          ) : catalogTree.length === 0 ? (
            <div className="rounded-[4px] px-3 py-8 text-center">
              <FolderOpen className="mx-auto mb-2 h-8 w-8 text-muted-foreground/35" strokeWidth={2} />
              <p className="text-xs text-muted-foreground">No folders yet</p>
            </div>
          ) : (
            <CatalogSidebarTree
              nodes={catalogTree}
              depth={0}
              selectedId={selectedCatalogFolderId}
              expandedIds={expandedCatalogIds}
              onToggleExpand={toggleCatalogExpanded}
              onSelect={(id) => onSelectCatalogFolder?.(id)}
              menuId={catalogMenuId}
              onMenuToggle={setCatalogMenuId}
              renamingId={catalogRenamingId}
              renameDraft={catalogRenameDraft}
              onRenameDraftChange={setCatalogRenameDraft}
              renamingSubmitting={catalogRenamingSubmitting}
              onStartRename={(id, name) => {
                setCatalogRenamingId(id);
                setCatalogRenameDraft(name);
                setCatalogMenuId(null);
              }}
              onCommitRename={(id) => void commitRenameCatalog(id)}
              onCancelRename={() => {
                setCatalogRenamingId(null);
                setCatalogRenameDraft("");
              }}
              onRequestDelete={(id) => {
                setPendingDeleteCatalogId(id);
                setCatalogMenuId(null);
              }}
              deletingId={deletingCatalogId}
            />
          )
        ) : isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2
              className="h-5 w-5 animate-spin text-muted-foreground"
              strokeWidth={2}
            />
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-[4px] px-3 py-8 text-center">
            <FolderOpen
              className="mx-auto mb-2 h-8 w-8 text-muted-foreground/35"
              strokeWidth={2}
            />
            <p className="text-xs text-muted-foreground">No folders yet</p>
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              className={`group relative rounded-[4px] transition-colors ${dropRing(`project:${project.id}`)}`}
              onDragOver={(e) => handleDragOver(e, `project:${project.id}`)}
              onDrop={(e) => handleDrop(e, project.id)}
            >
              {renamingProjectId === project.id ? (
                <div
                  data-project-rename
                  className="flex items-center gap-1.5 rounded-[4px] border border-border/80 bg-muted/15 px-2 py-1.5"
                >
                  <Input
                    value={renameDraft}
                    onChange={(e) => setRenameDraft(e.target.value)}
                    className="h-8 flex-1 rounded-[4px] border-border/80 text-sm font-medium"
                    autoFocus
                    disabled={renamingSubmitting}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void commitRename(project.id);
                      if (e.key === "Escape") cancelRename();
                    }}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 shrink-0 rounded-[4px] border-border/80"
                    disabled={renamingSubmitting || !renameDraft.trim()}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => void commitRename(project.id)}
                  >
                    {renamingSubmitting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                    ) : (
                      <Check className="h-3.5 w-3.5" strokeWidth={2} />
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0 rounded-[4px]"
                    disabled={renamingSubmitting}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={cancelRename}
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                  </Button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onSelectProject(project.id)}
                    className={`
                      flex w-full items-center gap-2.5 rounded-[4px] px-2.5 py-2 text-left text-sm font-medium tracking-tight transition-colors
                      ${selectedProjectId === project.id
                        ? "bg-black text-white"
                        : "text-foreground hover:bg-muted/45"
                      }
                    `}
                  >
                    <FolderOpen
                      className="h-[15px] w-[15px] shrink-0 opacity-90"
                      strokeWidth={2}
                    />
                    <span className="min-w-0 flex-1 truncate">{project.name}</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setContextMenuId(
                        contextMenuId === project.id ? null : project.id
                      );
                    }}
                    data-project-menu-trigger
                    className={`
                      absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-[4px] transition-opacity
                      ${selectedProjectId === project.id
                        ? "text-white/90 opacity-100 hover:bg-white/10"
                        : "text-muted-foreground opacity-0 hover:bg-muted/60 group-hover:opacity-100"
                      }
                    `}
                    aria-label="Folder actions"
                  >
                    <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
                  </button>

                  {contextMenuId === project.id && (
                    <div
                      data-project-menu
                      className="absolute right-1.5 top-[calc(100%-2px)] z-20 min-w-[158px] overflow-hidden rounded-[6px] border border-border/80 bg-white py-1 shadow-md"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setRenamingProjectId(project.id);
                          setRenameDraft(project.name);
                          setContextMenuId(null);
                        }}
                        className="mx-1 flex w-[calc(100%-8px)] items-center gap-2 rounded-[4px] px-2.5 py-1.5 text-left text-xs font-medium text-foreground transition-colors hover:bg-muted/50"
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPendingDeleteProjectId(project.id);
                          setContextMenuId(null);
                        }}
                        disabled={deletingId === project.id}
                        className="mx-1 flex w-[calc(100%-8px)] items-center gap-2 rounded-[4px] px-2.5 py-1.5 text-left text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingId === project.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                        )}
                        Delete
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </nav>

      <ConfirmActionDialog
        open={pendingDeleteProjectId !== null}
        title="Delete this folder?"
        description="Your renders stay in your account and move back to Unfiled."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        isLoading={deletingId === pendingDeleteProjectId}
        onCancel={() => setPendingDeleteProjectId(null)}
        onConfirm={async () => {
          if (!pendingDeleteProjectId) return;
          const projectId = pendingDeleteProjectId;
          await handleDelete(projectId);
          setPendingDeleteProjectId(null);
        }}
      />

      <ConfirmActionDialog
        open={pendingDeleteCatalogId !== null}
        title="Delete this folder?"
        description="Items inside will be moved to the catalog root or parent folder."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        isLoading={deletingCatalogId === pendingDeleteCatalogId}
        onCancel={() => setPendingDeleteCatalogId(null)}
        onConfirm={async () => {
          if (!pendingDeleteCatalogId) return;
          const id = pendingDeleteCatalogId;
          await handleDeleteCatalog(id);
          setPendingDeleteCatalogId(null);
        }}
      />

      {/* Bottom pinned section - always visible */}
      <div className="shrink-0 border-t border-border/80">
        {/* Create Project */}
        <div className="p-3">
          {isCreating ? (
            <div className="space-y-2">
              <Input
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder={createPlaceholder}
                className="h-9 rounded-[4px] border-border/80 text-sm font-medium"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") {
                    setIsCreating(false);
                    setNewProjectName("");
                  }
                }}
              />
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  onClick={handleCreate}
                  disabled={!newProjectName.trim() || isSubmitting}
                  className="h-8 flex-1 rounded-[4px] text-xs font-medium !bg-black hover:!bg-black/85"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                  ) : (
                    "Create"
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setNewProjectName("");
                  }}
                  className="h-8 rounded-[4px] px-2.5"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() => setIsCreating(true)}
              className="h-9 w-full gap-2 rounded-[4px] border-0 text-xs font-medium shadow-sm !bg-black !text-white hover:!bg-black/85"
            >
              <FolderPlus className="h-3.5 w-3.5" strokeWidth={2} />
              New folder
            </Button>
          )}
        </div>

        {(onOpenRenders || onOpenCatalog) && (
          <div className="space-y-1 px-3 pb-2 pt-2">
            {onOpenRenders && (
              <button
                type="button"
                onClick={onOpenRenders}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-[4px] px-2.5 py-2 text-left text-sm font-medium tracking-tight transition-colors",
                  rendersActive ? "bg-black text-white" : "text-foreground hover:bg-muted/45"
                )}
                title="Back to renders"
                aria-current={rendersActive ? "page" : undefined}
              >
                <Images className="h-[15px] w-[15px] shrink-0 opacity-90" strokeWidth={2} />
                <span className="min-w-0 flex-1 truncate">Renders</span>
              </button>
            )}
            {onOpenCatalog && (
              <button
                type="button"
                onClick={onOpenCatalog}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-[4px] px-2.5 py-2 text-left text-sm font-medium tracking-tight transition-colors",
                  catalogActive ? "bg-black text-white" : "text-foreground hover:bg-muted/45"
                )}
                title="Open catalog"
                aria-current={catalogActive ? "page" : undefined}
              >
                <Library className="h-[15px] w-[15px] shrink-0 opacity-90" strokeWidth={2} />
                <span className="min-w-0 flex-1 truncate">Catalog</span>
              </button>
            )}
          </div>
        )}

        <div className="px-3 pb-3">
          <a
            href="/settings"
            className="flex items-center gap-2.5 rounded-[4px] px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/45 hover:text-foreground"
          >
            <Settings className="h-[15px] w-[15px]" strokeWidth={2} />
            Settings
          </a>
        </div>
      </div>
    </aside>
  );
}
