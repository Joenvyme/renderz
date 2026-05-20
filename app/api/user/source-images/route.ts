import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getOrgContext, buildReadScopeFilter, parseVisibility } from "@/lib/org-context";

export const dynamic = "force-dynamic";

export interface SourceImageEntry {
  id: string;
  url: string;
  createdAt: string;
  visibility: "private" | "organization";
  isMine: boolean;
}

const ORIGINAL_BUCKET = "original-images";

/**
 * Liste les images d'entrée disponibles :
 *  - celles que l'utilisateur a téléversées (toutes orgs confondues), +
 *  - celles partagées dans ses organisations.
 * Sert à la galerie « réutiliser une image » sous la barre de prompt.
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await getOrgContext();
    if (!ctx) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { searchParams } = new URL(request.url);
    const rawLimit = Number(searchParams.get("limit") || "24");
    const rawOffset = Number(searchParams.get("offset") || "0");
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(rawLimit, 1), 100)
      : 24;
    const offset = Number.isFinite(rawOffset) ? Math.max(rawOffset, 0) : 0;

    const { data, error } = await supabase
      .from("source_images")
      .select("id, user_id, url, visibility, created_at")
      .or(buildReadScopeFilter(ctx))
      .order("created_at", { ascending: false })
      .range(offset, offset + limit);

    if (error) {
      console.error("source-images:", error);
      return NextResponse.json(
        { error: "Erreur récupération images" },
        { status: 500 }
      );
    }

    const safeRows = data ?? [];
    const hasMore = safeRows.length > limit;
    const paginatedRows = hasMore ? safeRows.slice(0, limit) : safeRows;
    const nextOffset = offset + paginatedRows.length;

    const images: SourceImageEntry[] = paginatedRows.map((row) => {
      const r = row as {
        id: string;
        user_id: string;
        url: string;
        visibility: "private" | "organization";
        created_at: string;
      };
      return {
        id: r.id,
        url: r.url,
        createdAt: r.created_at,
        visibility: r.visibility,
        isMine: r.user_id === ctx.userId,
      };
    });

    return NextResponse.json({ images, hasMore, nextOffset });
  } catch (err) {
    console.error("source-images error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * Enregistre une image source téléversée (bucket `original-images`) dans la galerie.
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await getOrgContext();
    if (!ctx) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as { url?: string };
    const url = typeof body.url === "string" ? body.url.trim() : "";
    if (!url) {
      return NextResponse.json({ error: "URL manquante" }, { status: 400 });
    }

    if (!url.includes(`/storage/v1/object/public/${ORIGINAL_BUCKET}/`)) {
      return NextResponse.json(
        { error: "URL invalide pour une image source" },
        { status: 400 }
      );
    }

    if (!ctx.activeOrgId) {
      return NextResponse.json(
        { error: "Organisation active requise" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from("source_images")
      .upsert(
        {
          user_id: ctx.userId,
          organization_id: ctx.activeOrgId,
          visibility: "private" as const,
          url,
        },
        { onConflict: "user_id,url", ignoreDuplicates: false }
      )
      .select("id, url, visibility, created_at")
      .single();

    if (error) {
      console.error("source-images POST:", error);
      return NextResponse.json(
        { error: "Erreur enregistrement image" },
        { status: 500 }
      );
    }

    const row = data as {
      id: string;
      url: string;
      visibility: "private" | "organization";
      created_at: string;
    };

    return NextResponse.json({
      image: {
        id: row.id,
        url: row.url,
        createdAt: row.created_at,
        visibility: row.visibility,
        isMine: true,
      } satisfies SourceImageEntry,
    });
  } catch (err) {
    console.error("source-images POST error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

function extractStoragePathFromPublicUrl(
  publicUrl: string,
  bucket: string
): string | null {
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

/**
 * Supprime une image source de la galerie (créateur uniquement) :
 *  - supprime la ligne `source_images` (cascade via uniqueness),
 *  - retire le fichier du bucket Storage (best-effort),
 *  - détache l'URL de tous les renders du user (`original_image_url = NULL`).
 */
export async function DELETE(request: NextRequest) {
  try {
    const ctx = await getOrgContext();
    if (!ctx) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    let url: string | undefined;
    let id: string | undefined;
    try {
      const body = (await request.json()) as { url?: unknown; id?: unknown };
      if (typeof body?.url === "string") url = body.url;
      if (typeof body?.id === "string") id = body.id;
    } catch {
      /* ignore – on tente le query string */
    }
    if (!url) {
      url = request.nextUrl.searchParams.get("url") ?? undefined;
    }
    if (!id) {
      id = request.nextUrl.searchParams.get("id") ?? undefined;
    }
    if (!url && !id) {
      return NextResponse.json({ error: "URL ou ID manquant" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Trouver la ligne et vérifier le créateur.
    let query = supabase
      .from("source_images")
      .select("id, url, user_id")
      .eq("user_id", ctx.userId);
    if (id) query = query.eq("id", id);
    else if (url) query = query.eq("url", url);

    const { data: row, error: lookupErr } = await query.maybeSingle();

    if (lookupErr) {
      console.error("source-images DELETE lookup:", lookupErr);
      return NextResponse.json(
        { error: "Erreur lecture image" },
        { status: 500 }
      );
    }

    if (!row) {
      return NextResponse.json(
        { error: "Image introuvable pour cet utilisateur" },
        { status: 404 }
      );
    }

    const r = row as { id: string; url: string; user_id: string };

    // Storage : suppression best-effort.
    const storagePath = extractStoragePathFromPublicUrl(r.url, ORIGINAL_BUCKET);
    if (storagePath) {
      const { error: stErr } = await supabase.storage
        .from(ORIGINAL_BUCKET)
        .remove([storagePath]);
      if (stErr) {
        console.warn("source-images DELETE storage:", stErr.message);
      }
    }

    // Détacher l'URL des renders.
    const { error: updErr } = await supabase
      .from("renders")
      .update({ original_image_url: null })
      .eq("user_id", ctx.userId)
      .eq("original_image_url", r.url);
    if (updErr) {
      console.error("source-images DELETE detach:", updErr);
      return NextResponse.json(
        { error: "Erreur détachement des renders" },
        { status: 500 }
      );
    }

    // Supprimer la ligne source_images.
    const { error: rmErr } = await supabase
      .from("source_images")
      .delete()
      .eq("id", r.id)
      .eq("user_id", ctx.userId);
    if (rmErr) {
      console.error("source-images DELETE row:", rmErr);
      return NextResponse.json(
        { error: "Erreur suppression image" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("source-images DELETE error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * PATCH — bascule la visibilité (privée ↔ organisation).
 */
export async function PATCH(request: NextRequest) {
  try {
    const ctx = await getOrgContext();
    if (!ctx) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      id?: string;
      url?: string;
      visibility?: "private" | "organization";
    };

    if (!body.id && !body.url) {
      return NextResponse.json(
        { error: "ID ou URL requis" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let lookup = supabase
      .from("source_images")
      .select("id, organization_id")
      .eq("user_id", ctx.userId);
    if (body.id) lookup = lookup.eq("id", body.id);
    else if (body.url) lookup = lookup.eq("url", body.url);

    const { data: row, error: lookupErr } = await lookup.maybeSingle();
    if (lookupErr) {
      console.error("source-images PATCH lookup:", lookupErr);
      return NextResponse.json(
        { error: "Erreur lecture image" },
        { status: 500 }
      );
    }
    if (!row) {
      return NextResponse.json(
        { error: "Image introuvable" },
        { status: 404 }
      );
    }

    const r = row as { id: string; organization_id: string | null };
    const visibility = parseVisibility(body.visibility, "private");
    if (visibility === "organization" && !r.organization_id) {
      return NextResponse.json(
        { error: "Image sans organisation rattachée." },
        { status: 400 }
      );
    }

    const { error: updErr } = await supabase
      .from("source_images")
      .update({ visibility })
      .eq("id", r.id)
      .eq("user_id", ctx.userId);
    if (updErr) {
      console.error("source-images PATCH update:", updErr);
      return NextResponse.json(
        { error: "Erreur mise à jour visibilité" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("source-images PATCH error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
