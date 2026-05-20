import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getOrgContext, buildReadScopeFilter, parseVisibility } from "@/lib/org-context";

export const dynamic = "force-dynamic";

export interface CatalogItemRow {
  id: string;
  user_id: string;
  organization_id: string | null;
  visibility: "private" | "organization";
  folder_id: string | null;
  title: string;
  description: string | null;
  image_url: string | null;
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

    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const folderParam = searchParams.get("folder_id");
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

    let query = supabase
      .from("catalog_items")
      .select("*")
      .order("updated_at", { ascending: false });

    if (onlyPrivate) {
      query = query.eq("user_id", ctx.userId).eq("visibility", "private");
    } else if (onlyShared) {
      query = query.or(buildReadScopeFilter(ctx)).eq("visibility", "organization");
    } else {
      query = query.or(buildReadScopeFilter(ctx));
    }

    if (folderParam === "unassigned") {
      query = query.is("folder_id", null);
    } else if (folderParam && folderParam !== "all") {
      query = query.eq("folder_id", folderParam);
    }

    const { data, error } = await query;
    if (error) {
      console.error("catalog items GET:", error);
      return NextResponse.json(
        { error: "Erreur récupération des items" },
        { status: 500 }
      );
    }

    return NextResponse.json({ items: data ?? [] });
  } catch (err) {
    console.error("catalog items GET unexpected:", err);
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
      title?: string;
      description?: string | null;
      image_url?: string | null;
      folder_id?: string | null;
      visibility?: "private" | "organization";
    };

    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json({ error: "Le titre est requis" }, { status: 400 });
    }
    if (title.length > 120) {
      return NextResponse.json(
        { error: "Titre trop long (120 caractères max)" },
        { status: 400 }
      );
    }

    const description =
      typeof body.description === "string" && body.description.trim()
        ? body.description.trim().slice(0, 1000)
        : null;
    const imageUrl =
      typeof body.image_url === "string" && body.image_url.trim()
        ? body.image_url.trim()
        : null;
    const folderId =
      typeof body.folder_id === "string" && body.folder_id ? body.folder_id : null;

    const supabase = getSupabase();

    if (folderId) {
      const { data: folder, error: folderErr } = await supabase
        .from("catalog_folders")
        .select("id, user_id, organization_id, visibility")
        .eq("id", folderId)
        .single();
      const f = folder as {
        user_id: string;
        organization_id: string | null;
        visibility: "private" | "organization";
      } | null;
      const allowed =
        !!f &&
        (f.user_id === ctx.userId ||
          (f.visibility === "organization" &&
            f.organization_id !== null &&
            ctx.orgIds.includes(f.organization_id)));
      if (folderErr || !allowed) {
        return NextResponse.json(
          { error: "Dossier introuvable" },
          { status: 400 }
        );
      }
    }

    const visibility = parseVisibility(body.visibility, "private");
    if (visibility === "organization" && !ctx.activeOrgId) {
      return NextResponse.json(
        { error: "Aucune organisation active pour le partage" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("catalog_items")
      .insert({
        user_id: ctx.userId,
        organization_id: ctx.activeOrgId,
        visibility,
        folder_id: folderId,
        title,
        description,
        image_url: imageUrl,
      })
      .select("*")
      .single();

    if (error) {
      console.error("catalog items POST:", error);
      return NextResponse.json(
        { error: "Erreur création item" },
        { status: 500 }
      );
    }

    return NextResponse.json({ item: data });
  } catch (err) {
    console.error("catalog items POST unexpected:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
