"use client";

import { Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CatalogFolder } from "@/components/catalog-item-form";
import {
  Check,
  Folder,
  FolderOpen,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

export type CatalogTreeNode = CatalogFolder & { children: CatalogTreeNode[] };

export function buildCatalogTree(folders: CatalogFolder[]): CatalogTreeNode[] {
  const byParent = new Map<string | null, CatalogFolder[]>();
  for (const f of folders) {
    const p = f.parent_id ?? null;
    if (!byParent.has(p)) byParent.set(p, []);
    byParent.get(p)!.push(f);
  }
  const attach = (parentId: string | null): CatalogTreeNode[] =>
    (byParent.get(parentId) ?? [])
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((f) => ({ ...f, children: attach(f.id) }));
  return attach(null);
}

interface CatalogSidebarTreeProps {
  nodes: CatalogTreeNode[];
  depth: number;
  selectedId: string | null;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onSelect: (id: string) => void;
  menuId: string | null;
  onMenuToggle: (id: string | null) => void;
  renamingId: string | null;
  renameDraft: string;
  onRenameDraftChange: (value: string) => void;
  renamingSubmitting: boolean;
  onStartRename: (id: string, name: string) => void;
  onCommitRename: (id: string) => void;
  onCancelRename: () => void;
  onRequestDelete: (id: string) => void;
  deletingId: string | null;
}

export function CatalogSidebarTree({
  nodes,
  depth,
  selectedId,
  expandedIds,
  onToggleExpand,
  onSelect,
  menuId,
  onMenuToggle,
  renamingId,
  renameDraft,
  onRenameDraftChange,
  renamingSubmitting,
  onStartRename,
  onCommitRename,
  onCancelRename,
  onRequestDelete,
  deletingId,
}: CatalogSidebarTreeProps) {
  return (
    <>
      {nodes.map((node) => {
        const hasChildren = node.children.length > 0;
        const isExpanded = expandedIds.has(node.id);
        const isSelected = selectedId === node.id;
        const isRenaming = renamingId === node.id;
        const isMenuOpen = menuId === node.id;
        const padLeft = 8 + depth * 14;

        return (
          <Fragment key={node.id}>
            {isRenaming ? (
              <div
                className="flex items-center gap-1.5 rounded-[4px] border border-border/80 bg-muted/15 py-1.5 pr-2"
                style={{ paddingLeft: padLeft }}
              >
                <Input
                  value={renameDraft}
                  onChange={(e) => onRenameDraftChange(e.target.value)}
                  className="h-8 min-w-0 flex-1 rounded-[4px] border-border/80 text-sm font-medium"
                  autoFocus
                  disabled={renamingSubmitting}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void onCommitRename(node.id);
                    if (e.key === "Escape") onCancelRename();
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 shrink-0 rounded-[4px]"
                  disabled={renamingSubmitting || !renameDraft.trim()}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => void onCommitRename(node.id)}
                >
                  {renamingSubmitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" strokeWidth={2} />
                  )}
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0"
                  disabled={renamingSubmitting}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={onCancelRename}
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                </Button>
              </div>
            ) : (
              <div className="group relative rounded-[4px]">
                <button
                  type="button"
                  onClick={() => {
                    if (hasChildren) onToggleExpand(node.id);
                    onSelect(node.id);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-[4px] py-2 pr-8 text-left text-sm font-medium tracking-tight transition-colors",
                    isSelected
                      ? "bg-black text-white"
                      : "text-foreground hover:bg-muted/45"
                  )}
                  style={{ paddingLeft: padLeft }}
                >
                  {hasChildren && isExpanded ? (
                    <FolderOpen className="h-[15px] w-[15px] shrink-0 opacity-90" strokeWidth={2} />
                  ) : (
                    <Folder className="h-[15px] w-[15px] shrink-0 opacity-90" strokeWidth={2} />
                  )}
                  <span className="min-w-0 flex-1 truncate">{node.name}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMenuToggle(isMenuOpen ? null : node.id);
                  }}
                  data-catalog-sidebar-menu-trigger
                  className={cn(
                    "absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-[4px] transition-opacity",
                    isSelected
                      ? "text-white/90 opacity-100 hover:bg-white/10"
                      : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted/60"
                  )}
                  aria-label="Folder actions"
                >
                  <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
                </button>
                {isMenuOpen && (
                  <div
                    data-catalog-sidebar-menu
                    className="absolute right-1 top-[calc(100%-2px)] z-20 min-w-[158px] overflow-hidden rounded-[6px] border border-border/80 bg-white py-1 shadow-md"
                  >
                    <button
                      type="button"
                      onClick={() => onStartRename(node.id, node.name)}
                      className="mx-1 flex w-[calc(100%-8px)] items-center gap-2 rounded-[4px] px-2.5 py-1.5 text-left text-xs font-medium text-foreground hover:bg-muted/50"
                    >
                      <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => onRequestDelete(node.id)}
                      disabled={deletingId === node.id}
                      className="mx-1 flex w-[calc(100%-8px)] items-center gap-2 rounded-[4px] px-2.5 py-1.5 text-left text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingId === node.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                      )}
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
            {hasChildren && isExpanded ? (
              <CatalogSidebarTree
                nodes={node.children}
                depth={depth + 1}
                selectedId={selectedId}
                expandedIds={expandedIds}
                onToggleExpand={onToggleExpand}
                onSelect={onSelect}
                menuId={menuId}
                onMenuToggle={onMenuToggle}
                renamingId={renamingId}
                renameDraft={renameDraft}
                onRenameDraftChange={onRenameDraftChange}
                renamingSubmitting={renamingSubmitting}
                onStartRename={onStartRename}
                onCommitRename={onCommitRename}
                onCancelRename={onCancelRename}
                onRequestDelete={onRequestDelete}
                deletingId={deletingId}
              />
            ) : null}
          </Fragment>
        );
      })}
    </>
  );
}
