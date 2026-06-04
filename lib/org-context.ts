import { createClient } from "@supabase/supabase-js";
import { auth } from "@/lib/auth";
import { headers as nextHeaders } from "next/headers";

/**
 * Contexte d'organisation pour scoper les requêtes serveur :
 * - `userId`        : utilisateur courant
 * - `activeOrgId`   : espace de travail actif (session Better Auth)
 * - `orgIds`        : toutes les organisations dont l'utilisateur est membre
 * - `roleInActive`  : rôle dans l'espace actif
 *
 * Règles de scope (isolation par espace de travail) :
 * - LECTURE  : uniquement les lignes de `activeOrgId` (legacy sans org → org perso uniquement)
 * - CRÉATION : `organization_id = activeOrgId`
 * - WRITE    : créateur + ressource dans l'espace actif
 */
export interface OrgContext {
  userId: string;
  activeOrgId: string | null;
  orgIds: string[];
  roleInActive: "owner" | "admin" | "member" | null;
}

export type ScopedResource = {
  user_id: string;
  organization_id: string | null;
  visibility?: "private" | "organization";
};

let _client: ReturnType<typeof createClient> | null = null;
function svc() {
  if (_client) return _client;
  _client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  return _client;
}

export function personalOrganizationId(userId: string): string {
  return `org_${userId}`;
}

function safeId(id: string): string | null {
  return /^[A-Za-z0-9_-]+$/.test(id) ? id : null;
}

/**
 * Charge l'utilisateur connecté + son contexte d'organisation.
 * Retourne `null` si non authentifié — laisse la route renvoyer 401.
 */
export async function getOrgContext(): Promise<
  ({ session: { user: { id: string; email: string; name?: string | null } } } & OrgContext) | null
> {
  const session = await auth.api.getSession({ headers: await nextHeaders() });
  if (!session) return null;

  const userId = session.user.id;

  const supabase = svc();
  const { data: memberships, error } = await supabase
    .from("member")
    .select('"organizationId", role')
    .eq("userId", userId);

  if (error) {
    console.error("[org-context] member fetch error:", error);
  }

  const orgIds: string[] = Array.isArray(memberships)
    ? (memberships
        .map((m) => (m as { organizationId: string }).organizationId)
        .filter(Boolean) as string[])
    : [];

  const sessionAny = session.session as unknown as {
    activeOrganizationId?: string | null;
  };
  let activeOrgId =
    typeof sessionAny.activeOrganizationId === "string" && sessionAny.activeOrganizationId
      ? sessionAny.activeOrganizationId
      : null;

  if (!activeOrgId && orgIds.length > 0) {
    const preferred = personalOrganizationId(userId);
    activeOrgId = orgIds.includes(preferred) ? preferred : orgIds[0];
  }

  let roleInActive: OrgContext["roleInActive"] = null;
  if (activeOrgId && Array.isArray(memberships)) {
    const found = memberships.find(
      (m) => (m as { organizationId: string }).organizationId === activeOrgId
    );
    const r = (found as { role?: string } | undefined)?.role;
    if (r === "owner" || r === "admin" || r === "member") {
      roleInActive = r;
    }
  }

  return {
    session: session as unknown as {
      user: { id: string; email: string; name?: string | null };
    },
    userId,
    activeOrgId,
    orgIds,
    roleInActive,
  };
}

/** Ressource rattachée à l'espace de travail actif (legacy null → org perso du créateur). */
export function isInActiveWorkspace(ctx: OrgContext, row: ScopedResource): boolean {
  if (!ctx.activeOrgId) return false;
  const active = safeId(ctx.activeOrgId);
  const user = safeId(ctx.userId);
  if (!active || !user) return false;

  if (row.organization_id === null) {
    return row.user_id === user && active === personalOrganizationId(user);
  }
  return row.organization_id === active;
}

/** Lecture dans l'espace actif : mes items + items partagés (visibility organization) du même espace. */
export function canReadInActiveWorkspace(
  ctx: OrgContext,
  row: ScopedResource & { visibility: "private" | "organization" }
): boolean {
  if (!isInActiveWorkspace(ctx, row)) return false;
  if (row.user_id === ctx.userId) return true;
  return row.visibility === "organization";
}

/** Écriture : créateur uniquement, ressource dans l'espace actif. */
export function canWriteInActiveWorkspace(ctx: OrgContext, row: ScopedResource): boolean {
  return row.user_id === ctx.userId && isInActiveWorkspace(ctx, row);
}

/**
 * Filtre Supabase `.or(...)` : contenu visible dans l'espace de travail actif.
 */
export function buildWorkspaceReadFilter(ctx: OrgContext): string {
  if (!ctx.activeOrgId) return "organization_id.eq.__none__";

  const org = safeId(ctx.activeOrgId);
  const user = safeId(ctx.userId);
  if (!org || !user) return "organization_id.eq.__none__";

  const inWorkspace = `and(organization_id.eq.${org},or(user_id.eq.${user},visibility.eq.organization))`;

  if (org === personalOrganizationId(user)) {
    const legacyMine = `and(organization_id.is.null,user_id.eq.${user})`;
    return `${inWorkspace},${legacyMine}`;
  }

  return inWorkspace;
}

/** @deprecated Alias — préférer buildWorkspaceReadFilter */
export function buildReadScopeFilter(ctx: OrgContext): string {
  return buildWorkspaceReadFilter(ctx);
}

/**
 * Filtre pour listes « visibility = private » : privés de l'utilisateur dans l'espace actif.
 */
export function buildWorkspacePrivateFilter(ctx: OrgContext): string {
  if (!ctx.activeOrgId) return "organization_id.eq.__none__";

  const org = safeId(ctx.activeOrgId);
  const user = safeId(ctx.userId);
  if (!org || !user) return "organization_id.eq.__none__";

  if (org === personalOrganizationId(user)) {
    return `and(user_id.eq.${user},visibility.eq.private,or(organization_id.eq.${org},organization_id.is.null))`;
  }

  return `and(user_id.eq.${user},visibility.eq.private,organization_id.eq.${org})`;
}

export function requireActiveWorkspace(
  ctx: OrgContext
): { ok: true; activeOrgId: string } | { ok: false; error: string } {
  if (!ctx.activeOrgId) {
    return { ok: false, error: "Aucun espace de travail actif — sélectionnez-en un dans le header." };
  }
  const active = safeId(ctx.activeOrgId);
  if (!active) {
    return { ok: false, error: "Espace de travail invalide." };
  }
  if (!ctx.orgIds.includes(active)) {
    return { ok: false, error: "Vous n'êtes pas membre de cet espace de travail." };
  }
  return { ok: true, activeOrgId: active };
}

/**
 * Convertit une chaîne `visibility` non-fiable (form-data) en valeur valide.
 */
export function parseVisibility(
  raw: unknown,
  fallback: "private" | "organization" = "private"
): "private" | "organization" {
  if (raw === "organization") return "organization";
  if (raw === "private") return "private";
  return fallback;
}
