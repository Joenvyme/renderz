import { createClient } from "@supabase/supabase-js";
import { auth } from "@/lib/auth";
import { headers as nextHeaders } from "next/headers";

/**
 * Contexte d'organisation pour scoper les requêtes serveur :
 * - `userId`        : utilisateur courant
 * - `activeOrgId`   : organisation active de sa session (org perso par défaut)
 * - `orgIds`        : toutes les organisations dont l'utilisateur est membre (pour la LECTURE)
 * - `roleInActive`  : son rôle dans l'organisation active (`owner` / `admin` / `member`)
 *
 * Règles de scope :
 * - LECTURE  : `user_id = userId` OR (`organization_id IN orgIds` AND `visibility = 'organization'`)
 * - CRÉATION : `user_id = userId`, `organization_id = activeOrgId`, `visibility = 'private'` (défaut)
 * - WRITE   : seul le créateur peut modifier, sauf si l'item est partagé et que le user est admin/owner de l'organisation
 */
export interface OrgContext {
  userId: string;
  activeOrgId: string | null;
  orgIds: string[];
  roleInActive: "owner" | "admin" | "member" | null;
}

let _client: ReturnType<typeof createClient> | null = null;
function svc() {
  if (_client) return _client;
  _client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  return _client;
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

  // Récupère toutes les memberships de l'utilisateur.
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

  // L'organisation active vient de la session Better Auth (`activeOrganizationId`).
  // Si jamais elle manque (session ancienne, plugin pas encore propagé), on retombe sur la première membership.
  const sessionAny = session.session as unknown as {
    activeOrganizationId?: string | null;
  };
  let activeOrgId =
    typeof sessionAny.activeOrganizationId === "string" && sessionAny.activeOrganizationId
      ? sessionAny.activeOrganizationId
      : null;

  if (!activeOrgId && orgIds.length > 0) {
    // Préférence : org perso (`org_<userId>`) si dispo.
    const preferred = `org_${userId}`;
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

/**
 * Helper : construit un filtre Supabase `OR` qui matche
 *   `user_id = me` OR (`organization_id IN orgs` AND `visibility = 'organization'`)
 *
 * À passer à `query.or(scope)`.
 */
export function buildReadScopeFilter(ctx: OrgContext): string {
  const safeOrgs = ctx.orgIds.filter((id) => /^[A-Za-z0-9_-]+$/.test(id));
  const orgsList = safeOrgs.length > 0 ? safeOrgs.join(",") : "";

  // Échappement : user_id Better Auth est `text`, peut contenir des caractères.
  // On vérifie qu'il est aussi safe ; sinon, on n'expose pas la branche org.
  const userIdSafe = /^[A-Za-z0-9_-]+$/.test(ctx.userId) ? ctx.userId : null;

  if (!userIdSafe) {
    // Cas extrême : ne devrait pas arriver avec Better Auth ; sécurité défensive.
    return `user_id.eq.${ctx.userId}`;
  }

  const userBranch = `user_id.eq.${userIdSafe}`;
  if (!orgsList) return userBranch;

  const orgBranch = `and(organization_id.in.(${orgsList}),visibility.eq.organization)`;
  return `${userBranch},${orgBranch}`;
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
