"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Check,
  ChevronDown,
  Loader2,
  Plus,
  Settings as SettingsIcon,
  X,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

interface OrgEntry {
  id: string;
  name: string;
  slug?: string | null;
  logo?: string | null;
}

/**
 * Bouton compact dans le header qui affiche l'organisation active.
 * Au clic, ouvre un panneau avec :
 *   - la liste des organisations dont l'utilisateur est membre (toggle d'activation),
 *   - un mini-formulaire pour créer une nouvelle organisation,
 *   - un lien vers la page de gestion `/organization`.
 *
 * Style : aligné sur les autres éléments du header (`rounded-full`, `border`, hover sur muted).
 */
export function OrganizationSwitcher({ className }: { className?: string }) {
  const { data: activeOrg, refetch: refetchActive } = authClient.useActiveOrganization();
  const { data: orgsRaw, refetch: refetchList } = authClient.useListOrganizations();

  const orgs: OrgEntry[] = Array.isArray(orgsRaw)
    ? (orgsRaw as OrgEntry[])
    : [];

  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowCreate(false);
        setCreateError(null);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const activeId = (activeOrg as { id?: string } | null | undefined)?.id ?? null;
  const activeName =
    (activeOrg as { name?: string } | null | undefined)?.name ??
    orgs.find((o) => o.id === activeId)?.name ??
    "Organisation";

  const handleSwitch = useCallback(
    async (orgId: string) => {
      if (orgId === activeId || switching) return;
      setSwitching(orgId);
      try {
        await authClient.organization.setActive({ organizationId: orgId });
        await refetchActive();
        // Recharge léger : les routes API utilisent ctx.activeOrgId, le scope change.
        if (typeof window !== "undefined") {
          window.location.reload();
        }
      } catch (err) {
        console.error("setActive:", err);
        setSwitching(null);
      }
    },
    [activeId, switching, refetchActive]
  );

  const handleCreate = useCallback(async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    setCreateError(null);
    try {
      const slug =
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 32) +
        "-" +
        Math.random().toString(36).slice(2, 6);
      const res = await authClient.organization.create({ name, slug });
      if ((res as { error?: { message?: string } }).error) {
        const msg =
          (res as { error?: { message?: string } }).error?.message ||
          "Création impossible";
        setCreateError(msg);
        return;
      }
      // La création n'active pas auto la nouvelle org : on bascule explicitement dessus.
      const created = (res as { data?: { id?: string } }).data;
      if (created?.id) {
        await authClient.organization.setActive({ organizationId: created.id });
      }
      await Promise.all([refetchActive(), refetchList()]);
      setNewName("");
      setShowCreate(false);
      setOpen(false);
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Erreur création");
    } finally {
      setCreating(false);
    }
  }, [newName, refetchActive, refetchList]);

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 items-center gap-1.5 rounded-full border border-border bg-white/60 px-2.5 text-[11px] font-medium tracking-tight text-foreground transition-colors hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 sm:text-xs"
        title="Organisation active"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Building2 className="h-3.5 w-3.5 opacity-70" strokeWidth={1.75} />
        <span className="max-w-[110px] truncate sm:max-w-[160px]">{activeName}</span>
        <ChevronDown className="h-3 w-3 opacity-70" strokeWidth={2} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-[120] mt-1.5 w-[260px] overflow-hidden rounded-[6px] border border-border bg-white shadow-[0_12px_28px_rgba(0,0,0,0.12)]"
        >
          <div className="max-h-[260px] overflow-y-auto py-1">
            {orgs.length === 0 ? (
              <div className="px-3 py-3 text-xs text-muted-foreground">
                Aucune organisation
              </div>
            ) : (
              orgs.map((o) => {
                const isActive = o.id === activeId;
                const isLoading = switching === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => handleSwitch(o.id)}
                    disabled={isActive || !!switching}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] transition-colors",
                      isActive
                        ? "bg-foreground/5 font-medium text-foreground"
                        : "text-foreground hover:bg-muted/45"
                    )}
                    role="menuitemradio"
                    aria-checked={isActive}
                  >
                    {o.logo ? (
                      <img
                        src={o.logo}
                        alt=""
                        className="h-5 w-5 shrink-0 rounded-[3px] object-cover"
                      />
                    ) : (
                      <Building2 className="h-3.5 w-3.5 shrink-0 opacity-60" strokeWidth={1.75} />
                    )}
                    <span className="min-w-0 flex-1 truncate">{o.name}</span>
                    {isLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin opacity-60" />
                    ) : (
                      isActive && <Check className="h-3.5 w-3.5 opacity-70" strokeWidth={2} />
                    )}
                  </button>
                );
              })
            )}
          </div>

          <div className="border-t border-border bg-muted/15 py-1">
            {showCreate ? (
              <div className="space-y-1.5 px-2 py-1.5">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreate();
                      if (e.key === "Escape") {
                        setShowCreate(false);
                        setNewName("");
                        setCreateError(null);
                      }
                    }}
                    placeholder="Nom de l'organisation"
                    autoFocus
                    className="h-8 min-w-0 flex-1 rounded-[4px] border border-border bg-white px-2 text-[12px] text-foreground placeholder:text-muted-foreground/70 focus:border-foreground/40 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={creating || !newName.trim()}
                    className="flex h-8 items-center justify-center rounded-[4px] bg-foreground px-2 text-[11px] font-medium text-background transition-colors hover:bg-foreground/85 disabled:opacity-50"
                  >
                    {creating ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Créer"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreate(false);
                      setNewName("");
                      setCreateError(null);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-[4px] border border-border text-muted-foreground hover:bg-muted/40"
                    title="Annuler"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                {createError && (
                  <p className="px-1 text-[10px] text-red-600">{createError}</p>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-foreground transition-colors hover:bg-muted/45"
              >
                <Plus className="h-3.5 w-3.5 opacity-70" strokeWidth={2} />
                Nouvelle organisation
              </button>
            )}
            <Link
              href="/organization"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-foreground transition-colors hover:bg-muted/45"
            >
              <SettingsIcon className="h-3.5 w-3.5 opacity-70" strokeWidth={1.75} />
              Gérer l'organisation
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
