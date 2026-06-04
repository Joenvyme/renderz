import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getOrgContext, buildWorkspaceReadFilter, buildWorkspacePrivateFilter } from "@/lib/org-context";

export const dynamic = "force-dynamic";

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
    const projectId = searchParams.get("project_id");
    const favoritesOnly = searchParams.get("favorites") === "true";
    // Filtre multi-sélection : "private", "organization" ou "private,organization".
    // Cas particulier : si rien ou les deux cochés → équivalent à pas de contrainte.
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
    const rawLimit = Number(searchParams.get("limit") || "24");
    const rawOffset = Number(searchParams.get("offset") || "0");
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 24;
    const offset = Number.isFinite(rawOffset) ? Math.max(rawOffset, 0) : 0;
    const statusFilter = searchParams.get("status");
    const allowedStatuses = ["pending", "processing", "completed", "failed"] as const;
    const status =
      statusFilter && allowedStatuses.includes(statusFilter as (typeof allowedStatuses)[number])
        ? (statusFilter as (typeof allowedStatuses)[number])
        : null;

    let query = supabase
      .from("renders")
      .select("*")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });

    if (onlyPrivate) {
      query = query.or(buildWorkspacePrivateFilter(ctx));
    } else if (onlyShared) {
      query = query.or(buildWorkspaceReadFilter(ctx)).eq("visibility", "organization");
    } else {
      query = query.or(buildWorkspaceReadFilter(ctx));
    }

    if (projectId === "unassigned") {
      query = query.is("project_id", null);
    } else if (projectId && projectId !== "favorites") {
      query = query.eq("project_id", projectId);
    }

    if (projectId === "favorites" || favoritesOnly) {
      query = query.contains("metadata", { favorite: true });
    }

    if (status) {
      query = query.eq("status", status);
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
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
