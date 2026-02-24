"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import {
  FolderOpen,
  FolderPlus,
  Settings,
  Image,
  ChevronLeft,
  Loader2,
  X,
  Trash2,
  MoreHorizontal,
  Inbox,
  Heart,
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

interface ProjectSidebarProps {
  projects: Project[];
  selectedProjectId: string | null; // null = "All", "unassigned"/"favorites" = special filters
  onSelectProject: (projectId: string | null) => void;
  onCreateProject: (name: string) => Promise<void>;
  onDeleteProject: (projectId: string) => Promise<void>;
  isLoading: boolean;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function ProjectSidebar({
  projects,
  selectedProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  isLoading,
  sidebarOpen,
  onToggleSidebar,
}: ProjectSidebarProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contextMenuId, setContextMenuId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteProjectId, setPendingDeleteProjectId] = useState<string | null>(null);

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
      await onCreateProject(newProjectName.trim());
      setNewProjectName("");
      setIsCreating(false);
    } catch (error) {
      console.error("Error creating project:", error);
    } finally {
      setIsSubmitting(false);
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

  return (
    <aside className="w-full h-full flex flex-col bg-white/5 backdrop-blur-[2px] border-r border-border">
      {/* Desktop collapse button */}
      <div className="hidden lg:flex justify-end p-2">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 hover:bg-muted rounded transition-colors"
          title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${!sidebarOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Top navigation items */}
      <nav className="p-2 space-y-0.5">
        {/* All renders */}
        <button
          onClick={() => onSelectProject(null)}
          className={`
            w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all text-sm font-mono rounded-sm
            ${selectedProjectId === null
              ? "bg-black text-white"
              : "hover:bg-muted/50 text-foreground"
            }
          `}
        >
          <Image className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 truncate">All Renders</span>
        </button>

        {/* Unassigned renders */}
        <button
          onClick={() => onSelectProject("unassigned")}
          className={`
            w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all text-sm font-mono rounded-sm
            ${selectedProjectId === "unassigned"
              ? "bg-black text-white"
              : "hover:bg-muted/50 text-foreground"
            }
          `}
        >
          <Inbox className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 truncate">Unassigned</span>
        </button>

        {/* Favorite renders */}
        <button
          onClick={() => onSelectProject("favorites")}
          className={`
            w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all text-sm font-mono rounded-sm
            ${selectedProjectId === "favorites"
              ? "bg-black text-white"
              : "hover:bg-muted/50 text-foreground"
            }
          `}
        >
          <Heart className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 truncate">Favorites</span>
        </button>
      </nav>

      {/* Separator */}
      <div className="px-4">
        <div className="border-t border-border" />
      </div>

      {/* Scrollable Project List */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : projects.length === 0 ? (
          <div className="px-3 py-6 text-center">
            <FolderOpen className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground font-mono">
              No projects yet
            </p>
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="relative group">
              <button
                onClick={() => onSelectProject(project.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all text-sm font-mono rounded-sm
                  ${selectedProjectId === project.id
                    ? "bg-black text-white"
                    : "hover:bg-muted/50 text-foreground"
                  }
                `}
              >
                <FolderOpen className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 truncate">{project.name}</span>
              </button>

              {/* Context menu button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setContextMenuId(contextMenuId === project.id ? null : project.id);
                }}
                data-project-menu-trigger
                className={`
                  absolute right-2 top-1/2 -translate-y-1/2 p-1 transition-opacity
                  ${selectedProjectId === project.id
                    ? "text-white opacity-100"
                    : "text-foreground/70 opacity-0 group-hover:opacity-100"}
                `}
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>

              {/* Context menu */}
              {contextMenuId === project.id && (
                <div
                  data-project-menu
                  className="absolute right-2 top-full z-20 bg-white border border-border shadow-lg py-1 min-w-[140px]"
                >
                  <button
                    onClick={() => {
                      setPendingDeleteProjectId(project.id);
                      setContextMenuId(null);
                    }}
                    disabled={deletingId === project.id}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-red-600 hover:bg-red-50 transition-colors"
                  >
                    {deletingId === project.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </nav>

      <ConfirmActionDialog
        open={pendingDeleteProjectId !== null}
        title="Delete project?"
        description="Renders in this project will be kept but moved to unassigned."
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

      {/* Bottom pinned section - always visible */}
      <div className="shrink-0 border-t border-border">
        {/* Create Project */}
        <div className="p-3">
          {isCreating ? (
            <div className="space-y-2">
              <Input
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Project name..."
                className="h-8 font-mono text-xs"
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
                  className="flex-1 h-7 font-mono text-[10px] !bg-black hover:!bg-black/80"
                >
                  {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : "CREATE"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setNewProjectName("");
                  }}
                  className="h-7 px-2"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() => setIsCreating(true)}
              className="w-full font-mono text-[10px] h-9 gap-1.5 !bg-black !text-white hover:!bg-black/80 border-0 shadow-sm"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              NEW PROJECT
            </Button>
          )}
        </div>

        {/* Settings Link */}
        <div className="px-3 pb-3">
          <a
            href="/settings"
            className="flex items-center gap-2 px-3 py-2 text-sm font-mono text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-sm transition-all"
          >
            <Settings className="w-4 h-4" />
            Settings
          </a>
        </div>
      </div>
    </aside>
  );
}
