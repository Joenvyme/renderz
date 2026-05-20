"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StripedPattern } from "@/components/magicui/striped-pattern";
import { BrandLogo } from "@/components/brand-logo";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { authClient, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Building2,
  Crown,
  Loader2,
  Mail,
  Shield,
  Trash2,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";

type Role = "owner" | "admin" | "member";

interface MemberEntry {
  id: string;
  role: Role;
  createdAt?: string;
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  };
}

interface InvitationEntry {
  id: string;
  email: string;
  role: Role | null;
  status: "pending" | "accepted" | "rejected" | "canceled" | "expired";
  expiresAt: string;
}

interface FullOrg {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  members?: MemberEntry[];
  invitations?: InvitationEntry[];
}

function roleLabel(role: Role | null | undefined) {
  if (role === "owner") return "Propriétaire";
  if (role === "admin") return "Admin";
  return "Membre";
}

function roleIcon(role: Role | null | undefined) {
  if (role === "owner") return <Crown className="h-3 w-3" strokeWidth={2} />;
  if (role === "admin") return <Shield className="h-3 w-3" strokeWidth={2} />;
  return null;
}

export default function OrganizationPage() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const { data: activeOrg, refetch: refetchActive } =
    authClient.useActiveOrganization();

  const [fullOrg, setFullOrg] = useState<FullOrg | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("member");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!sessionPending && !session) {
      router.push("/");
    }
  }, [session, sessionPending, router]);

  const activeId = (activeOrg as { id?: string } | null | undefined)?.id ?? null;

  const reload = useCallback(async () => {
    if (!activeId) return;
    setLoading(true);
    try {
      const res = await authClient.organization.getFullOrganization({
        query: { organizationId: activeId, membersLimit: 200 },
      });
      const data = (res as { data?: FullOrg | null }).data ?? null;
      setFullOrg(data);
      if (data?.name) setNameDraft(data.name);
    } catch (err) {
      console.error("getFullOrganization:", err);
      setFullOrg(null);
    } finally {
      setLoading(false);
    }
  }, [activeId]);

  useEffect(() => {
    if (activeId) {
      void reload();
    } else {
      setFullOrg(null);
      setLoading(false);
    }
  }, [activeId, reload]);

  const myMember = useMemo(() => {
    if (!fullOrg?.members || !session) return null;
    return (
      fullOrg.members.find((m) => m.user.id === session.user.id) ?? null
    );
  }, [fullOrg, session]);

  const myRole: Role | null = myMember?.role ?? null;
  const canManage = myRole === "owner" || myRole === "admin";
  const canDeleteOrg = myRole === "owner";

  const handleSaveName = useCallback(async () => {
    if (!fullOrg) return;
    const next = nameDraft.trim();
    if (!next || next === fullOrg.name) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      const res = await authClient.organization.update({
        data: { name: next },
        organizationId: fullOrg.id,
      });
      if ((res as { error?: { message?: string } }).error) {
        const msg =
          (res as { error?: { message?: string } }).error?.message ||
          "Échec de la mise à jour";
        alert(msg);
        return;
      }
      setEditingName(false);
      await Promise.all([reload(), refetchActive()]);
    } catch (err) {
      console.error("update org name:", err);
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSavingName(false);
    }
  }, [fullOrg, nameDraft, reload, refetchActive]);

  const handleInvite = useCallback(async () => {
    if (!fullOrg) return;
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      setInviteError("Email invalide");
      return;
    }
    setInviting(true);
    setInviteError(null);
    try {
      const res = await authClient.organization.inviteMember({
        email,
        role: inviteRole,
        organizationId: fullOrg.id,
      });
      if ((res as { error?: { message?: string } }).error) {
        setInviteError(
          (res as { error?: { message?: string } }).error?.message ||
            "Invitation impossible"
        );
        return;
      }
      setInviteEmail("");
      await reload();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Erreur invitation");
    } finally {
      setInviting(false);
    }
  }, [fullOrg, inviteEmail, inviteRole, reload]);

  const handleCancelInvite = useCallback(
    async (inviteId: string) => {
      setActionBusy(`invite:${inviteId}`);
      try {
        const res = await authClient.organization.cancelInvitation({
          invitationId: inviteId,
        });
        if ((res as { error?: { message?: string } }).error) {
          alert(
            (res as { error?: { message?: string } }).error?.message ||
              "Annulation impossible"
          );
          return;
        }
        await reload();
      } catch (err) {
        console.error("cancelInvitation:", err);
      } finally {
        setActionBusy(null);
      }
    },
    [reload]
  );

  const handleRemoveMember = useCallback(
    async (memberId: string, memberEmail: string) => {
      if (!fullOrg) return;
      const ok =
        typeof window !== "undefined"
          ? window.confirm(`Retirer ${memberEmail} de l'organisation ?`)
          : true;
      if (!ok) return;
      setActionBusy(`member:${memberId}`);
      try {
        const res = await authClient.organization.removeMember({
          memberIdOrEmail: memberId,
          organizationId: fullOrg.id,
        });
        if ((res as { error?: { message?: string } }).error) {
          alert(
            (res as { error?: { message?: string } }).error?.message ||
              "Retrait impossible"
          );
          return;
        }
        await reload();
      } catch (err) {
        console.error("removeMember:", err);
      } finally {
        setActionBusy(null);
      }
    },
    [fullOrg, reload]
  );

  const handleUpdateRole = useCallback(
    async (memberId: string, role: Role) => {
      if (!fullOrg) return;
      setActionBusy(`role:${memberId}`);
      try {
        const res = await authClient.organization.updateMemberRole({
          memberId,
          role,
          organizationId: fullOrg.id,
        });
        if ((res as { error?: { message?: string } }).error) {
          alert(
            (res as { error?: { message?: string } }).error?.message ||
              "Mise à jour impossible"
          );
          return;
        }
        await reload();
      } catch (err) {
        console.error("updateMemberRole:", err);
      } finally {
        setActionBusy(null);
      }
    },
    [fullOrg, reload]
  );

  const handleDeleteOrg = useCallback(async () => {
    if (!fullOrg) return;
    setDeleting(true);
    try {
      const res = await authClient.organization.delete({
        organizationId: fullOrg.id,
      });
      if ((res as { error?: { message?: string } }).error) {
        alert(
          (res as { error?: { message?: string } }).error?.message ||
            "Suppression impossible"
        );
        return;
      }
      // Recharge complète : l'org active a changé.
      window.location.href = "/profile";
    } catch (err) {
      console.error("deleteOrganization:", err);
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setDeleting(false);
    }
  }, [fullOrg]);

  if (sessionPending || (loading && !fullOrg)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      <StripedPattern className="absolute inset-0 [mask-image:radial-gradient(800px_circle_at_center,white,transparent)]" />

      <header className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-white/5 backdrop-blur-sm">
        <div className="container mx-auto flex h-14 items-center justify-between px-3 sm:h-16 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/profile">
              <button className="rounded p-1.5 transition-colors hover:bg-muted">
                <ArrowLeft className="h-4 w-4" />
              </button>
            </Link>
            <BrandLogo className="transition-opacity hover:opacity-90" />
          </div>
        </div>
      </header>

      <main className="container relative z-10 mx-auto px-3 pb-16 pt-24 sm:px-6 sm:pt-32">
        <div className="mx-auto w-full min-w-0 max-w-4xl space-y-6 sm:space-y-8">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Organisation
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Membres, invitations et partage des éléments avec votre équipe.
              </p>
            </div>
          </div>

          {!fullOrg ? (
            <Card className="border border-white bg-white/5 p-6 backdrop-blur-[2px]">
              <p className="text-sm text-muted-foreground">
                Aucune organisation active. Crée-en une depuis le sélecteur du
                header.
              </p>
            </Card>
          ) : (
            <>
              {/* Identité de l'organisation */}
              <Card className="border border-white bg-white/5 p-4 backdrop-blur-[2px] sm:p-6">
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[6px] border border-border bg-white">
                    {fullOrg.logo ? (
                      <img
                        src={fullOrg.logo}
                        alt=""
                        className="h-full w-full rounded-[6px] object-cover"
                      />
                    ) : (
                      <Building2 className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {editingName ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={nameDraft}
                          onChange={(e) => setNameDraft(e.target.value)}
                          autoFocus
                          className="h-9 max-w-md"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveName();
                            if (e.key === "Escape") {
                              setEditingName(false);
                              setNameDraft(fullOrg.name);
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={handleSaveName}
                          disabled={savingName || !nameDraft.trim()}
                        >
                          {savingName ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Enregistrer"
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingName(false);
                            setNameDraft(fullOrg.name);
                          }}
                        >
                          Annuler
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => canManage && setEditingName(true)}
                        disabled={!canManage}
                        className={cn(
                          "block min-w-0 max-w-full truncate text-left text-lg font-semibold tracking-tight",
                          canManage && "hover:underline"
                        )}
                        title={canManage ? "Modifier le nom" : undefined}
                      >
                        {fullOrg.name}
                      </button>
                    )}
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {fullOrg.slug}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Invitation */}
              {canManage && (
                <Card className="border border-white bg-white/5 p-4 backdrop-blur-[2px] sm:p-6">
                  <h2 className="mb-3 flex items-center gap-2 text-base font-semibold tracking-tight">
                    <UserPlus className="h-4 w-4" strokeWidth={1.75} />
                    Inviter un membre
                  </h2>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      type="email"
                      placeholder="email@exemple.com"
                      value={inviteEmail}
                      onChange={(e) => {
                        setInviteEmail(e.target.value);
                        setInviteError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleInvite();
                      }}
                      className="h-9 flex-1"
                    />
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as Role)}
                      className="h-9 rounded-md border border-input bg-white px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    >
                      <option value="member">Membre</option>
                      <option value="admin">Admin</option>
                      {myRole === "owner" && <option value="owner">Propriétaire</option>}
                    </select>
                    <Button
                      onClick={handleInvite}
                      disabled={inviting || !inviteEmail.trim()}
                      className="h-9"
                    >
                      {inviting ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        "Inviter"
                      )}
                    </Button>
                  </div>
                  {inviteError && (
                    <p className="mt-2 text-xs text-red-600">{inviteError}</p>
                  )}
                </Card>
              )}

              {/* Invitations en attente */}
              {fullOrg.invitations && fullOrg.invitations.length > 0 && (
                <Card className="border border-white bg-white/5 p-4 backdrop-blur-[2px] sm:p-6">
                  <h2 className="mb-3 flex items-center gap-2 text-base font-semibold tracking-tight">
                    <Mail className="h-4 w-4" strokeWidth={1.75} />
                    Invitations en attente
                  </h2>
                  <ul className="divide-y divide-border">
                    {fullOrg.invitations
                      .filter((i) => i.status === "pending")
                      .map((inv) => (
                        <li
                          key={inv.id}
                          className="flex items-center gap-3 py-2.5"
                        >
                          <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm">{inv.email}</p>
                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                              {roleLabel(inv.role)} · expire le{" "}
                              {new Date(inv.expiresAt).toLocaleDateString()}
                            </p>
                          </div>
                          {canManage && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCancelInvite(inv.id)}
                              disabled={actionBusy === `invite:${inv.id}`}
                              className="h-7 text-xs"
                            >
                              {actionBusy === `invite:${inv.id}` ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <X className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </li>
                      ))}
                  </ul>
                </Card>
              )}

              {/* Membres */}
              <Card className="border border-white bg-white/5 p-4 backdrop-blur-[2px] sm:p-6">
                <h2 className="mb-3 text-base font-semibold tracking-tight">
                  Membres ({fullOrg.members?.length ?? 0})
                </h2>
                <ul className="divide-y divide-border">
                  {(fullOrg.members ?? []).map((m) => {
                    const isMe = m.user.id === session.user.id;
                    const canActOnThis =
                      canManage && !isMe && m.role !== "owner";
                    return (
                      <li
                        key={m.id}
                        className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
                            {m.user.image ? (
                              <img
                                src={m.user.image}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-medium text-muted-foreground">
                                {(m.user.name || m.user.email || "?")
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm">
                              {m.user.name || m.user.email}
                              {isMe && (
                                <span className="ml-1.5 rounded-full bg-muted/60 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                                  vous
                                </span>
                              )}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {m.user.email}
                            </p>
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-white/60 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                            {roleIcon(m.role)}
                            {roleLabel(m.role)}
                          </span>
                        </div>
                        {canActOnThis && (
                          <div className="flex shrink-0 items-center gap-2">
                            <select
                              value={m.role}
                              disabled={actionBusy === `role:${m.id}`}
                              onChange={(e) =>
                                handleUpdateRole(m.id, e.target.value as Role)
                              }
                              className="h-8 rounded-md border border-input bg-white px-2 text-xs"
                            >
                              <option value="member">Membre</option>
                              <option value="admin">Admin</option>
                              {myRole === "owner" && (
                                <option value="owner">Propriétaire</option>
                              )}
                            </select>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveMember(m.id, m.user.email)}
                              disabled={actionBusy === `member:${m.id}`}
                              className="h-8 px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                              title="Retirer de l'organisation"
                            >
                              {actionBusy === `member:${m.id}` ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <UserMinus className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Card>

              {/* Zone danger */}
              {canDeleteOrg && (
                <Card className="border border-red-200 bg-red-50/40 p-4 backdrop-blur-[2px] sm:p-6">
                  <h2 className="mb-2 text-base font-semibold tracking-tight text-red-700">
                    Zone dangereuse
                  </h2>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Supprimer l'organisation détache tous les éléments partagés.
                    Les rendus, images et items restent visibles par leur créateur
                    mais ne sont plus partagés.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setConfirmDeleteOpen(true)}
                    className="h-9 border-red-300 text-red-700 hover:bg-red-100 hover:text-red-800"
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Supprimer l'organisation
                  </Button>
                </Card>
              )}
            </>
          )}
        </div>
      </main>

      <ConfirmActionDialog
        open={confirmDeleteOpen}
        onCancel={() => setConfirmDeleteOpen(false)}
        title="Supprimer l'organisation ?"
        description={
          fullOrg
            ? `« ${fullOrg.name} » sera supprimée définitivement. Cette action est irréversible.`
            : ""
        }
        confirmLabel={deleting ? "Suppression…" : "Supprimer définitivement"}
        danger
        onConfirm={handleDeleteOrg}
        isLoading={deleting}
        requiredText={fullOrg?.name}
        requiredTextLabel={
          fullOrg
            ? `Tape « ${fullOrg.name} » pour confirmer.`
            : undefined
        }
      />
    </div>
  );
}
