"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, X, ImagePlus, Images } from "lucide-react";
import { cn } from "@/lib/utils";
import { RenderLibraryPicker } from "@/components/render-library-picker";

export interface CatalogFolder {
  id: string;
  user_id: string;
  organization_id?: string | null;
  visibility?: "private" | "organization";
  parent_id: string | null;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface CatalogItem {
  id: string;
  user_id: string;
  organization_id?: string | null;
  visibility?: "private" | "organization";
  folder_id: string | null;
  title: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CatalogItemFormValues {
  title: string;
  description: string | null;
  image_url: string | null;
  folder_id: string | null;
}

interface CatalogItemFormProps {
  open: boolean;
  initial?: CatalogItem | null;
  /** Préselectionne ce dossier pour les nouveaux items. */
  defaultFolderId?: string | null;
  folders: CatalogFolder[];
  onClose: () => void;
  onSubmit: (values: CatalogItemFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
}

interface FolderOption {
  id: string;
  label: string;
}

function buildFolderOptions(folders: CatalogFolder[]): FolderOption[] {
  const byParent = new Map<string | null, CatalogFolder[]>();
  for (const f of folders) {
    const key = f.parent_id;
    const arr = byParent.get(key) ?? [];
    arr.push(f);
    byParent.set(key, arr);
  }
  Array.from(byParent.values()).forEach((arr) => {
    arr.sort((a: CatalogFolder, b: CatalogFolder) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
  });
  const out: FolderOption[] = [];
  const walk = (parent: string | null, depth: number) => {
    for (const f of byParent.get(parent) ?? []) {
      out.push({
        id: f.id,
        label: `${"\u00A0".repeat(depth * 4)}${depth > 0 ? "└ " : ""}${f.name}`,
      });
      walk(f.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}

export function CatalogItemForm({
  open,
  initial,
  defaultFolderId = null,
  folders,
  onClose,
  onSubmit,
  onDelete,
}: CatalogItemFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [folderId, setFolderId] = useState<string | "">("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [importingRenderId, setImportingRenderId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? "");
    setDescription(initial?.description ?? "");
    setFolderId(initial?.folder_id ?? defaultFolderId ?? "");
    setImageUrl(initial?.image_url ?? null);
    setUploading(false);
    setSubmitting(false);
    setDeleting(false);
    setDragging(false);
    setLibraryOpen(false);
    setImportingRenderId(null);
  }, [open, initial, defaultFolderId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting && !uploading && !deleting) {
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, submitting, uploading, deleting]);

  const folderOptions = buildFolderOptions(folders);

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/catalog/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const { url } = (await res.json()) as { url?: string };
      if (!url) throw new Error("URL manquante");
      setImageUrl(url);
    } catch (err) {
      console.error("catalog item upload:", err);
      alert(err instanceof Error ? `Upload : ${err.message}` : "Upload impossible");
    } finally {
      setUploading(false);
    }
  };

  const onPickFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/") && !/\.(heic|heif)$/i.test(file.name)) {
      alert("Le fichier doit être une image.");
      return;
    }
    void uploadFile(file);
  };

  const importFromRender = async (render: { id: string }) => {
    setImportingRenderId(render.id);
    setUploading(true);
    try {
      const res = await fetch("/api/catalog/import-render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ render_id: render.id }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const { url } = (await res.json()) as { url?: string };
      if (!url) throw new Error("URL manquante");
      setImageUrl(url);
      setLibraryOpen(false);
    } catch (err) {
      console.error("catalog import render:", err);
      alert(
        err instanceof Error ? err.message : "Impossible d’utiliser ce rendu"
      );
    } finally {
      setUploading(false);
      setImportingRenderId(null);
    }
  };

  const submit = async () => {
    const t = title.trim();
    if (!t) {
      alert("Le titre est requis.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        title: t,
        description: description.trim() || null,
        image_url: imageUrl,
        folder_id: folderId || null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!confirm("Supprimer cet item du catalogue ? L’image associée sera supprimée."))
      return;
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  };

  if (!open) return null;

  const isBusy = submitting || uploading || deleting;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isBusy) onClose();
      }}
    >
      <div className="flex max-h-[90vh] w-[min(720px,100%)] flex-col overflow-hidden rounded-xl border border-border/80 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">
            {initial ? "Modifier l’item" : "Nouvel item"}
          </h2>
          <button
            type="button"
            onClick={() => !isBusy && onClose()}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-[260px,1fr]">
            <div
              className={cn(
                "relative flex aspect-square w-full flex-col overflow-hidden rounded-lg border bg-muted/15 transition-colors",
                libraryOpen
                  ? "border-border/80"
                  : dragging
                    ? "border-foreground/40 bg-muted/30"
                    : "border-dashed border-border/80",
                uploading && !libraryOpen && "pointer-events-none opacity-70"
              )}
            >
              {libraryOpen ? (
                <div className="flex min-h-0 flex-1 flex-col p-2">
                  <RenderLibraryPicker
                    onBack={() => setLibraryOpen(false)}
                    onSelect={importFromRender}
                    selectingId={importingRenderId}
                    disabled={isBusy}
                  />
                </div>
              ) : imageUrl ? (
                <div className="relative flex h-full w-full items-center justify-center">
                  <img
                    src={imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl(null)}
                    disabled={isBusy}
                    className="absolute right-2 top-2 z-[2] flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white shadow-sm transition-colors hover:bg-red-600"
                    aria-label="Retirer l’image"
                    title="Retirer l’image"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2.25} />
                  </button>
                  <div className="absolute bottom-2 left-1/2 z-[2] flex -translate-x-1/2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isBusy}
                      className="rounded-full bg-black/70 px-3 py-1 text-[11px] font-medium text-white shadow-sm transition-colors hover:bg-black"
                    >
                      Téléverser
                    </button>
                    <button
                      type="button"
                      onClick={() => setLibraryOpen(true)}
                      disabled={isBusy}
                      className="rounded-full bg-black/70 px-3 py-1 text-[11px] font-medium text-white shadow-sm transition-colors hover:bg-black"
                    >
                      Bibliothèque
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="flex h-full min-h-0 flex-col"
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    if (uploading) return;
                    const file = e.dataTransfer.files?.[0];
                    onPickFile(file);
                  }}
                >
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isBusy}
                    className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="text-[11px]">Envoi en cours…</span>
                      </>
                    ) : (
                      <>
                        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white shadow-sm">
                          <Upload className="h-4 w-4" strokeWidth={1.75} />
                        </span>
                        <div>
                          <p className="text-xs font-medium text-foreground">
                            Téléverser une image
                          </p>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            ou glisser-déposer un fichier
                          </p>
                        </div>
                      </>
                    )}
                  </button>
                  {!uploading && (
                    <>
                      <div className="flex items-center gap-2 px-4">
                        <span className="h-px flex-1 bg-border/80" />
                        <span className="text-[10px] text-muted-foreground">ou</span>
                        <span className="h-px flex-1 bg-border/80" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setLibraryOpen(true)}
                        disabled={isBusy}
                        className="mx-4 mb-4 flex items-center justify-center gap-2 rounded-md border border-border/80 bg-white px-3 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/40"
                      >
                        <Images className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                        Choisir un rendu
                      </button>
                    </>
                  )}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  onPickFile(f);
                }}
              />
            </div>

            <div className="flex min-w-0 flex-col gap-4">
              <div>
                <label className="mb-1 block text-[11px] font-mono uppercase tracking-wide text-muted-foreground">
                  Titre
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 120))}
                  placeholder="Ex. Canapé d’angle « Lyon »"
                  disabled={isBusy}
                  maxLength={120}
                />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground">
                    Description
                  </label>
                  <span className="text-[10px] tabular-nums text-muted-foreground/70">
                    {description.length}/1000
                  </span>
                </div>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
                  placeholder="Notes, dimensions, fournisseur, matière…"
                  disabled={isBusy}
                  className="min-h-[140px] resize-none rounded-md"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-mono uppercase tracking-wide text-muted-foreground">
                  Dossier
                </label>
                <select
                  value={folderId}
                  onChange={(e) => setFolderId(e.target.value)}
                  disabled={isBusy}
                  className="h-9 w-full rounded-md border border-border/80 bg-white px-2 text-sm text-foreground"
                >
                  <option value="">Sans dossier</option>
                  {folderOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border/60 px-5 py-3">
          <div>
            {onDelete && initial && (
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleDelete()}
                disabled={isBusy}
                className="!text-red-600"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Supprimer"
                )}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isBusy}
            >
              Annuler
            </Button>
            <Button type="button" onClick={() => void submit()} disabled={isBusy}>
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : initial ? (
                "Enregistrer"
              ) : (
                <>
                  <ImagePlus className="mr-1.5 h-4 w-4" />
                  Créer
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
