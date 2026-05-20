import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getOrgContext, buildReadScopeFilter, parseVisibility } from "@/lib/org-context";

export const dynamic = "force-dynamic";

// GET - Liste les projets visibles : créés par moi (toutes orgs) + partagés dans mes organisations.
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
      .select("*, renders(count)")
      .or(buildReadScopeFilter(ctx))
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching projects:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des projets" },
        { status: 500 }
      );
    }

    const projectsWithCount = (projects || []).map((p: any) => ({
      ...p,
      render_count: p.renders?.[0]?.count || 0,
      renders: undefined,
    }));

    return NextResponse.json({ projects: projectsWithCount });
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
