import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getOrgContext, parseVisibility } from "@/lib/org-context";

export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function loadOwnedFolder(folderId: string, userId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("catalog_folders")
    .select("id, user_id, organization_id, parent_id")
    .eq("id", folderId)
    .single();
  if (error || !data) return null;
  if (data.user_id !== userId) return null;
  return data as {
    id: string;
    user_id: string;
    organization_id: string | null;
    parent_id: string | null;
  };
}

/** Empêche un cycle parent <-> enfant lors d'un déplacement. */
async function isDescendantOf(
  candidateAncestorId: string,
  startFolderId: string,
  userId: string
): Promise<boolean> {
  if (candidateAncestorId === startFolderId) return true;
  const supabase = getSupabase();
  // Pour la détection de cycle on regarde uniquement les dossiers que l'utilisateur possède
  // (les writes sont réservés au créateur, c'est suffisant).
  const { data, error } = await supabase
    .from("catalog_folders")
    .select("id, parent_id, user_id")
    .eq("user_id", userId);
  if (error || !data) return false;
  const byId = new Map<string, { id: string; parent_id: string | null }>();
  for (const r of data) byId.set(r.id, { id: r.id, parent_id: r.parent_id });
  let cursor: string | null = candidateAncestorId;
  let safety = 200;
  while (cursor && safety-- > 0) {
    if (cursor === startFolderId) return true;
    const node = byId.get(cursor);
    cursor = node?.parent_id ?? null;
  }
  return false;
}

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const ctx = await getOrgContext();
    if (!ctx) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const folderId = context.params.id;
    const owned = await loadOwnedFolder(folderId, ctx.userId);
    if (!owned) {
      return NextResponse.json(
        { error: "Dossier introuvable" },
        { status: 404 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      name?: string;
      parent_id?: string | null;
      visibility?: "private" | "organization";
    };

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (typeof body.name === "string") {
      const name = body.name.trim();
      if (!name) {
        return NextResponse.json(
          { error: "Le nom ne peut pas être vide" },
          { status: 400 }
        );
      }
      if (name.length > 80) {
        return NextResponse.json(
          { error: "Nom trop long (80 caractères max)" },
          { status: 400 }
        );
      }
      update.name = name;
    }

    if ("parent_id" in body) {
      const parentId =
        typeof body.parent_id === "string" && body.parent_id ? body.parent_id : null;
      if (parentId) {
        if (parentId === folderId) {
          return NextResponse.json(
            { error: "Un dossier ne peut pas être son propre parent" },
            { status: 400 }
          );
        }
        const parent = await loadOwnedFolder(parentId, ctx.userId);
        if (!parent) {
          return NextResponse.json(
            { error: "Dossier parent introuvable" },
            { status: 400 }
          );
        }
        if (await isDescendantOf(parentId, folderId, ctx.userId)) {
          return NextResponse.json(
            { error: "Cycle interdit (le parent serait un descendant)" },
            { status: 400 }
          );
        }
      }
      update.parent_id = parentId;
    }

    if ("visibility" in body) {
      const next = parseVisibility(body.visibility, "private");
      if (next === "organization" && !owned.organization_id) {
        return NextResponse.json(
          { error: "Dossier sans organisation rattachée." },
          { status: 400 }
        );
      }
      update.visibility = next;
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("catalog_folders")
      .update(update)
      .eq("id", folderId)
      .eq("user_id", ctx.userId)
      .select("*")
      .single();

    if (error) {
      console.error("catalog folder PATCH:", error);
      return NextResponse.json(
        { error: "Erreur mise à jour dossier" },
        { status: 500 }
      );
    }

    return NextResponse.json({ folder: data });
  } catch (err) {
    console.error("catalog folder PATCH unexpected:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const ctx = await getOrgContext();
    if (!ctx) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const folderId = context.params.id;
    const owned = await loadOwnedFolder(folderId, ctx.userId);
    if (!owned) {
      return NextResponse.json(
        { error: "Dossier introuvable" },
        { status: 404 }
      );
    }

    const supabase = getSupabase();
    const { error } = await supabase
      .from("catalog_folders")
      .delete()
      .eq("id", folderId)
      .eq("user_id", ctx.userId);

    if (error) {
      console.error("catalog folder DELETE:", error);
      return NextResponse.json(
        { error: "Erreur suppression dossier" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("catalog folder DELETE unexpected:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
