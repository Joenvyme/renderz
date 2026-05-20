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

// GET - Visible si je suis le créateur OU le projet est partagé dans une de mes organisations.
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await getOrgContext();
    if (!ctx) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const supabase = getSupabase();
    const { data: project, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error || !project) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    const p = project as {
      user_id: string;
      organization_id: string | null;
      visibility: "private" | "organization";
    };
    const allowed =
      p.user_id === ctx.userId ||
      (p.visibility === "organization" &&
        p.organization_id !== null &&
        ctx.orgIds.includes(p.organization_id));

    if (!allowed) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH - Modifier (créateur uniquement). Permet le toggle visibility.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await getOrgContext();
    if (!ctx) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, visibility: visibilityRaw } = body as {
      name?: string;
      description?: string;
      visibility?: "private" | "organization";
    };

    const supabase = getSupabase();

    // S'assure que le projet appartient au user.
    const { data: existing, error: existingErr } = await supabase
      .from("projects")
      .select("id, organization_id")
      .eq("id", params.id)
      .eq("user_id", ctx.userId)
      .single();
    if (existingErr || !existing) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (typeof name === "string") updateData.name = name.trim();
    if ("description" in body) {
      updateData.description = description?.trim() || null;
    }
    if ("visibility" in body) {
      const next = parseVisibility(visibilityRaw, "private");
      if (next === "organization" && !existing.organization_id) {
        return NextResponse.json(
          { error: "Projet sans organisation rattachée." },
          { status: 400 }
        );
      }
      updateData.visibility = next;
    }

    const { data: project, error } = await supabase
      .from("projects")
      .update(updateData)
      .eq("id", params.id)
      .eq("user_id", ctx.userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating project:", error);
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour" },
        { status: 500 }
      );
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Créateur uniquement.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await getOrgContext();
    if (!ctx) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const supabase = getSupabase();
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", params.id)
      .eq("user_id", ctx.userId);

    if (error) {
      console.error("Error deleting project:", error);
      return NextResponse.json(
        { error: "Erreur lors de la suppression" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
