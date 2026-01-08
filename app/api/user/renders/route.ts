import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
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

    const supabase = await createClient();

    // Récupérer les rendus de l'utilisateur
    const { data: renders, error } = await supabase
      .from("renders")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching renders:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des rendus" },
        { status: 500 }
      );
    }

    return NextResponse.json({ renders });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

