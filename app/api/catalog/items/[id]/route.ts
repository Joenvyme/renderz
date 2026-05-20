import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getOrgContext, parseVisibility } from "@/lib/org-context";

export const dynamic = "force-dynamic";

const CATALOG_BUCKET = "catalog-items";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function extractStoragePath(publicUrl: string, bucket: string): string | null {
  try {
    const u = new URL(publicUrl);
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = u.pathname.indexOf(marker);
    if (idx === -1) return null;
    const raw = u.pathname.substring(idx + marker.length);
    if (!raw) return null;
    return decodeURIComponent(raw);
  } catch {
    return null;
  }
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

    const itemId = context.params.id;
    const supabase = getSupabase();

    const { data: existing, error: existingErr } = await supabase
      .from("catalog_items")
      .select("id, user_id, organization_id, image_url")
      .eq("id", itemId)
      .single();

    if (existingErr || !existing || existing.user_id !== ctx.userId) {
      return NextResponse.json({ error: "Item introuvable" }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      title?: string;
      description?: string | null;
      image_url?: string | null;
      folder_id?: string | null;
      visibility?: "private" | "organization";
    };

    const update: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body.title === "string") {
      const t = body.title.trim();
      if (!t) {
        return NextResponse.json(
          { error: "Le titre ne peut pas être vide" },
          { status: 400 }
        );
      }
      if (t.length > 120) {
        return NextResponse.json(
          { error: "Titre trop long (120 caractères max)" },
          { status: 400 }
        );
      }
      update.title = t;
    }

    if ("description" in body) {
      update.description =
        typeof body.description === "string" && body.description.trim()
          ? body.description.trim().slice(0, 1000)
          : null;
    }

    if ("image_url" in body) {
      const newUrl =
        typeof body.image_url === "string" && body.image_url.trim()
          ? body.image_url.trim()
          : null;
      update.image_url = newUrl;

      if (existing.image_url && existing.image_url !== newUrl) {
        const path = extractStoragePath(existing.image_url, CATALOG_BUCKET);
        if (path) {
          const { error: rmErr } = await supabase.storage
            .from(CATALOG_BUCKET)
            .remove([path]);
          if (rmErr) console.warn("catalog item PATCH storage cleanup:", rmErr.message);
        }
      }
    }

    if ("folder_id" in body) {
      const folderId =
        typeof body.folder_id === "string" && body.folder_id ? body.folder_id : null;
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
      update.folder_id = folderId;
    }

    if ("visibility" in body) {
      const next = parseVisibility(body.visibility, "private");
      if (next === "organization" && !existing.organization_id) {
        return NextResponse.json(
          { error: "Item sans organisation rattachée." },
          { status: 400 }
        );
      }
      update.visibility = next;
    }

    const { data, error } = await supabase
      .from("catalog_items")
      .update(update)
      .eq("id", itemId)
      .eq("user_id", ctx.userId)
      .select("*")
      .single();

    if (error) {
      console.error("catalog item PATCH:", error);
      return NextResponse.json(
        { error: "Erreur mise à jour item" },
        { status: 500 }
      );
    }

    return NextResponse.json({ item: data });
  } catch (err) {
    console.error("catalog item PATCH unexpected:", err);
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

    const itemId = context.params.id;
    const supabase = getSupabase();

    const { data: existing, error: existingErr } = await supabase
      .from("catalog_items")
      .select("id, user_id, image_url")
      .eq("id", itemId)
      .single();

    if (existingErr || !existing || existing.user_id !== ctx.userId) {
      return NextResponse.json({ error: "Item introuvable" }, { status: 404 });
    }

    const { error } = await supabase
      .from("catalog_items")
      .delete()
      .eq("id", itemId)
      .eq("user_id", ctx.userId);

    if (error) {
      console.error("catalog item DELETE:", error);
      return NextResponse.json(
        { error: "Erreur suppression item" },
        { status: 500 }
      );
    }

    if (existing.image_url) {
      const path = extractStoragePath(existing.image_url, CATALOG_BUCKET);
      if (path) {
        const { error: rmErr } = await supabase.storage
          .from(CATALOG_BUCKET)
          .remove([path]);
        if (rmErr) console.warn("catalog item DELETE storage cleanup:", rmErr.message);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("catalog item DELETE unexpected:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
