import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getOrgContext, buildWorkspaceReadFilter } from "@/lib/org-context";

export const dynamic = "force-dynamic";

/** Totaux galerie (rendus terminés visibles) — pour paramètres / stats. */
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

    const scope = buildWorkspaceReadFilter(ctx);

    const { count: standard, error: standardErr } = await supabase
      .from("renders")
      .select("id", { count: "exact", head: true })
      .or(scope)
      .eq("status", "completed");

    if (standardErr) {
      console.error("render-stats standard:", standardErr);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    const { data: upscaleRows, error: upscaleErr } = await supabase
      .from("renders")
      .select("generated_image_url, upscaled_image_url")
      .or(scope)
      .eq("status", "completed")
      .not("upscaled_image_url", "is", null);

    if (upscaleErr) {
      console.error("render-stats upscaled:", upscaleErr);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    let upscaled = 0;
    for (const row of upscaleRows ?? []) {
      const up = row.upscaled_image_url;
      const gen = row.generated_image_url;
      if (up && gen && up !== gen) upscaled += 1;
    }

    return NextResponse.json({
      standard: standard ?? 0,
      upscaled,
    });
  } catch (e) {
    console.error("GET /api/user/render-stats:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
