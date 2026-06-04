import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getOrgContext,
  parseVisibility,
  canReadInActiveWorkspace,
  canWriteInActiveWorkspace,
} from "@/lib/org-context";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * GET — récupération d'un render.
 * Visible si :
 *  - l'utilisateur en est le créateur, OU
 *  - le render est `visibility='organization'` et l'utilisateur est membre de l'organisation.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const ctx = await getOrgContext();
    if (!ctx) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401, headers: NO_CACHE_HEADERS }
      );
    }

    const supabase = getSupabase();
    const { data: render, error } = await supabase
      .from("renders")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !render) {
      return NextResponse.json(
        { error: "Render not found" },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    const r = render as {
      user_id: string;
      organization_id: string | null;
      visibility: "private" | "organization";
    };

    const allowed = canReadInActiveWorkspace(ctx, r);

    if (!allowed) {
      return NextResponse.json(
        { error: "Render not found" },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    return NextResponse.json(render, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("Get render error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH — uniquement par le créateur.
 * Champs autorisés : project_id (déplacer), favorite (méta), visibility (partage).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await getOrgContext();
    if (!ctx) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = params;
    const body = (await request.json().catch(() => ({}))) as {
      project_id?: string | null;
      favorite?: boolean;
      visibility?: "private" | "organization";
    };

    const hasProjectUpdate = Object.prototype.hasOwnProperty.call(body, "project_id");
    const hasFavoriteUpdate = Object.prototype.hasOwnProperty.call(body, "favorite");
    const hasVisibilityUpdate = Object.prototype.hasOwnProperty.call(body, "visibility");

    if (!hasProjectUpdate && !hasFavoriteUpdate && !hasVisibilityUpdate) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    if (hasFavoriteUpdate && typeof body.favorite !== "boolean") {
      return NextResponse.json(
        { error: "favorite must be a boolean" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const { data: render, error: fetchError } = await supabase
      .from("renders")
      .select("id, metadata, organization_id, user_id, visibility")
      .eq("id", id)
      .single();

    if (fetchError || !render) {
      return NextResponse.json(
        { error: "Render not found or access denied" },
        { status: 404 }
      );
    }

    const renderRow = render as {
      user_id: string;
      organization_id: string | null;
      visibility: "private" | "organization";
    };
    if (!canWriteInActiveWorkspace(ctx, renderRow)) {
      return NextResponse.json(
        { error: "Render not found or access denied" },
        { status: 404 }
      );
    }

    if (hasProjectUpdate && body.project_id) {
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("id, user_id, organization_id, visibility")
        .eq("id", body.project_id)
        .single();
      const projectRow = project as {
        user_id: string;
        organization_id: string | null;
        visibility: "private" | "organization";
      } | null;
      if (
        projectError ||
        !projectRow ||
        !canReadInActiveWorkspace(ctx, projectRow)
      ) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 }
        );
      }
    }

    const metadataObject =
      render?.metadata &&
      typeof render.metadata === "object" &&
      !Array.isArray(render.metadata)
        ? (render.metadata as Record<string, unknown>)
        : {};

    const updatePayload: Record<string, unknown> = {};

    if (hasProjectUpdate) {
      updatePayload.project_id = body.project_id || null;
    }

    if (hasFavoriteUpdate) {
      updatePayload.metadata = { ...metadataObject, favorite: body.favorite };
    }

    if (hasVisibilityUpdate) {
      const next = parseVisibility(body.visibility, "private");
      if (next === "organization") {
        const orgId = render.organization_id ?? ctx.activeOrgId;
        if (!orgId) {
          return NextResponse.json(
            { error: "Aucune organisation active pour le partage." },
            { status: 400 }
          );
        }
        updatePayload.visibility = next;
        if (!render.organization_id && ctx.activeOrgId) {
          updatePayload.organization_id = ctx.activeOrgId;
        }
      } else {
        updatePayload.visibility = next;
      }
    }

    const { error: updateError } = await supabase
      .from("renders")
      .update(updatePayload)
      .eq("id", id);

    if (updateError) {
      console.error("Update render error:", updateError);
      return NextResponse.json(
        { error: "Failed to update render" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update render error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE — uniquement par le créateur (même règles qu'avant).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await getOrgContext();
    if (!ctx) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = params;
    const supabase = getSupabase();

    const { data: render, error: fetchError } = await supabase
      .from("renders")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !render) {
      return NextResponse.json(
        { error: "Render not found or access denied" },
        { status: 404 }
      );
    }

    const renderRow = render as {
      user_id: string;
      organization_id: string | null;
    };
    if (!canWriteInActiveWorkspace(ctx, renderRow)) {
      return NextResponse.json(
        { error: "Render not found or access denied" },
        { status: 404 }
      );
    }

    const filesToDelete: string[] = [];

    if (render.generated_image_url) {
      const match = render.generated_image_url.match(/generated-renders\/(.+)$/);
      if (match) filesToDelete.push(match[1]);
    }

    if (
      render.upscaled_image_url &&
      render.upscaled_image_url !== render.generated_image_url
    ) {
      const match = render.upscaled_image_url.match(/upscaled-renders\/(.+)$/);
      if (match) {
        await supabase.storage.from("upscaled-renders").remove([match[1]]);
      }
    }

    if (filesToDelete.length > 0) {
      await supabase.storage.from("generated-renders").remove(filesToDelete);
    }

    const { error: deleteError } = await supabase
      .from("renders")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Delete error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete render" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete render error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
