import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getOrgContext,
  buildWorkspaceReadFilter,
  buildWorkspacePrivateFilter,
  parseVisibility,
  canReadInActiveWorkspace,
  canWriteInActiveWorkspace,
  requireActiveWorkspace,
} from "@/lib/org-context";

export const dynamic = "force-dynamic";

export interface CatalogFolderRow {
  id: string;
  user_id: string;
  organization_id: string | null;
  visibility: "private" | "organization";
  parent_id: string | null;
  name: string;
  created_at: string;
  updated_at: string;
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  try {
    const ctx = await getOrgContext();
    if (!ctx) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const visibilityParam = (searchParams.get("visibility") || "")
      .split(",")
      .map((v) => v.trim())
      .filter((v): v is "private" | "organization" =>
        v === "private" || v === "organization"
      );
    const onlyPrivate =
      visibilityParam.length === 1 && visibilityParam[0] === "private";
    const onlyShared =
      visibilityParam.length === 1 && visibilityParam[0] === "organization";

    const supabase = getSupabase();
    let query = supabase
      .from("catalog_folders")
      .select("*")
      .order("name", { ascending: true });

    if (onlyPrivate) {
      query = query.or(buildWorkspacePrivateFilter(ctx));
    } else if (onlyShared) {
      query = query.or(buildWorkspaceReadFilter(ctx)).eq("visibility", "organization");
    } else {
      query = query.or(buildWorkspaceReadFilter(ctx));
    }

    const { data, error } = await query;

    if (error) {
      console.error("catalog folders GET:", error);
      return NextResponse.json(
        { error: "Erreur récupération dossiers" },
        { status: 500 }
      );
    }

    return NextResponse.json({ folders: data ?? [] });
  } catch (err) {
    console.error("catalog folders GET unexpected:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getOrgContext();
    if (!ctx) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      name?: string;
      parent_id?: string | null;
      visibility?: "private" | "organization";
    };

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json(
        { error: "Le nom du dossier est requis" },
        { status: 400 }
      );
    }
    if (name.length > 80) {
      return NextResponse.json(
        { error: "Nom trop long (80 caractères max)" },
        { status: 400 }
      );
    }

    const parentId =
      typeof body.parent_id === "string" && body.parent_id ? body.parent_id : null;

    const supabase = getSupabase();

    // Le parent doit être visible (créé par moi ou partagé dans une de mes orgs).
    if (parentId) {
      const { data: parent, error: parentErr } = await supabase
        .from("catalog_folders")
        .select("id, user_id, organization_id, visibility")
        .eq("id", parentId)
        .single();
      const p = parent as {
        user_id: string;
        organization_id: string | null;
        visibility: "private" | "organization";
      } | null;
      const allowed = !!p && canReadInActiveWorkspace(ctx, p);
      if (parentErr || !allowed) {
        return NextResponse.json(
          { error: "Dossier parent introuvable" },
          { status: 400 }
        );
      }
    }

    const ws = requireActiveWorkspace(ctx);
    if (!ws.ok) {
      return NextResponse.json({ error: ws.error }, { status: 400 });
    }

    const visibility = parseVisibility(body.visibility, "private");
    if (visibility === "organization" && !ctx.activeOrgId) {
      return NextResponse.json(
        { error: "Aucune organisation active pour le partage" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("catalog_folders")
      .insert({
        user_id: ctx.userId,
        organization_id: ctx.activeOrgId,
        visibility,
        parent_id: parentId,
        name,
      })
      .select("*")
      .single();

    if (error) {
      console.error("catalog folders POST:", error);
      return NextResponse.json(
        { error: "Erreur création dossier" },
        { status: 500 }
      );
    }

    return NextResponse.json({ folder: data });
  } catch (err) {
    console.error("catalog folders POST unexpected:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
