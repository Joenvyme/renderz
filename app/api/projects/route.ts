import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getOrgContext, buildWorkspaceReadFilter, parseVisibility, requireActiveWorkspace } from "@/lib/org-context";

export const dynamic = "force-dynamic";

// GET - Projets visibles dans l'espace de travail actif uniquement.
export async function GET() {
  try {
    const ctx = await getOrgContext();
    if (!ctx) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: projects, error } = await supabase
      .from("projects")
      .select("*")
      .or(buildWorkspaceReadFilter(ctx))
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching projects:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des projets" },
        { status: 500 }
      );
    }

    const { data: completedRows, error: countError } = await supabase
      .from("renders")
      .select("project_id")
      .or(buildWorkspaceReadFilter(ctx))
      .eq("status", "completed");

    if (countError) {
      console.error("Error counting renders per project:", countError);
      return NextResponse.json(
        { error: "Erreur lors du comptage des rendus" },
        { status: 500 }
      );
    }

    const countByProject = new Map<string, number>();
    let unassignedCount = 0;
    for (const row of completedRows ?? []) {
      const pid = row.project_id as string | null;
      if (!pid) {
        unassignedCount += 1;
        continue;
      }
      countByProject.set(pid, (countByProject.get(pid) ?? 0) + 1);
    }

    const projectsWithCount = (projects || []).map((p) => ({
      ...p,
      render_count: countByProject.get(p.id) ?? 0,
    }));

    return NextResponse.json({ projects: projectsWithCount, unassigned_count: unassignedCount });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Crée un projet dans l'organisation active de l'utilisateur (privé par défaut).
export async function POST(request: NextRequest) {
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

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Le nom du projet est requis" },
        { status: 400 }
      );
    }

    const ws = requireActiveWorkspace(ctx);
    if (!ws.ok) {
      return NextResponse.json({ error: ws.error }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const visibility = parseVisibility(visibilityRaw, "private");
    if (visibility === "organization" && !ctx.activeOrgId) {
      return NextResponse.json(
        { error: "Aucune organisation active pour le partage" },
        { status: 400 }
      );
    }

    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        user_id: ctx.userId,
        organization_id: ctx.activeOrgId,
        visibility,
        name: name.trim(),
        description: description?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating project:", error);
      return NextResponse.json(
        { error: "Erreur lors de la création du projet" },
        { status: 500 }
      );
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
