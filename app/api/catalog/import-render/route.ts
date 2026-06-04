import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getOrgContext, canReadInActiveWorkspace, requireActiveWorkspace } from "@/lib/org-context";

export const dynamic = "force-dynamic";

const CATALOG_BUCKET = "catalog-items";

function getRenderImageUrl(render: {
  generated_image_url: string | null;
  upscaled_image_url: string | null;
}): string | null {
  if (
    render.upscaled_image_url &&
    render.upscaled_image_url !== render.generated_image_url
  ) {
    return render.upscaled_image_url;
  }
  return render.generated_image_url;
}

/**
 * Copie l’image d’un rendu accessible par l’utilisateur vers le bucket catalogue.
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await getOrgContext();
    if (!ctx) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      render_id?: string;
    };
    const renderId = body.render_id?.trim();
    if (!renderId) {
      return NextResponse.json({ error: "render_id requis" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: render, error: renderErr } = await supabase
      .from("renders")
      .select("id, user_id, organization_id, visibility, generated_image_url, upscaled_image_url")
      .eq("id", renderId)
      .single();

    if (renderErr || !render) {
      return NextResponse.json({ error: "Rendu introuvable" }, { status: 404 });
    }

    const r = render as {
      user_id: string;
      organization_id: string | null;
      visibility: "private" | "organization";
      generated_image_url: string | null;
      upscaled_image_url: string | null;
    };

    const allowed = canReadInActiveWorkspace(ctx, r);

    if (!allowed) {
      return NextResponse.json({ error: "Rendu introuvable" }, { status: 404 });
    }

    const ws = requireActiveWorkspace(ctx);
    if (!ws.ok) {
      return NextResponse.json({ error: ws.error }, { status: 400 });
    }

    const sourceUrl = getRenderImageUrl(r);
    if (!sourceUrl) {
      return NextResponse.json(
        { error: "Ce rendu n’a pas encore d’image" },
        { status: 400 }
      );
    }

    const imageRes = await fetch(sourceUrl);
    if (!imageRes.ok) {
      return NextResponse.json(
        { error: "Impossible de récupérer l’image du rendu" },
        { status: 502 }
      );
    }

    const contentType =
      imageRes.headers.get("content-type")?.split(";")[0]?.trim() ||
      "image/jpeg";
    const buf = Buffer.from(await imageRes.arrayBuffer());

    const maxBytes = 15 * 1024 * 1024;
    if (buf.length > maxBytes) {
      return NextResponse.json(
        { error: "Image trop volumineuse pour le catalogue" },
        { status: 400 }
      );
    }

    const ext =
      contentType === "image/png"
        ? "png"
        : contentType === "image/webp"
          ? "webp"
          : "jpg";
    const rand = Math.random().toString(36).slice(2, 10);
    const objectPath = `${ctx.userId}/${Date.now()}-${rand}-render-${renderId.slice(0, 8)}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from(CATALOG_BUCKET)
      .upload(objectPath, buf, {
        cacheControl: "3600",
        upsert: false,
        contentType,
      });

    if (uploadErr) {
      console.error("catalog import-render storage:", uploadErr);
      return NextResponse.json({ error: "Erreur stockage" }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(CATALOG_BUCKET).getPublicUrl(objectPath);

    return NextResponse.json({ url: publicUrl, path: objectPath });
  } catch (err) {
    console.error("catalog import-render unexpected:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
