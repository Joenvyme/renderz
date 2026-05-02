import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("project_id");
    const favoritesOnly = searchParams.get("favorites") === "true";
    const rawLimit = Number(searchParams.get("limit") || "24");
    const rawOffset = Number(searchParams.get("offset") || "0");
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 24;
    const offset = Number.isFinite(rawOffset) ? Math.max(rawOffset, 0) : 0;

    // Récupérer les rendus de l'utilisateur, éventuellement filtrés par projet
    let query = supabase
      .from("renders")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });

    if (projectId === "unassigned") {
      query = query.is("project_id", null);
    } else if (projectId && projectId !== "favorites") {
      query = query.eq("project_id", projectId);
    }

    if (projectId === "favorites" || favoritesOnly) {
      query = query.contains("metadata", { favorite: true });
    }

    const { data: renders, error } = await query.range(offset, offset + limit);

    if (error) {
      console.error("Error fetching renders:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des rendus" },
        { status: 500 }
      );
    }

    const safeRenders = renders ?? [];
    const hasMore = safeRenders.length > limit;
    const paginatedRenders = hasMore ? safeRenders.slice(0, limit) : safeRenders;
    const nextOffset = offset + paginatedRenders.length;

    return NextResponse.json({
      renders: paginatedRenders,
      hasMore,
      nextOffset,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

