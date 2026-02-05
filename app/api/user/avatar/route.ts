import { NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Pool } from "pg";

export async function POST(request: NextRequest) {
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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Le fichier doit être une image" },
        { status: 400 }
      );
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "L'image ne doit pas dépasser 5MB" },
        { status: 400 }
      );
    }

    // Upload vers Vercel Blob
    const blob = await put(`avatars/${session.user.id}-${Date.now()}`, file, {
      access: "public",
      addRandomSuffix: false,
    });

    // Mettre à jour l'utilisateur dans la base de données
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // Récupérer l'ancienne image pour la supprimer
    const oldImageResult = await pool.query(
      'SELECT image FROM "user" WHERE id = $1',
      [session.user.id]
    );
    const oldImageUrl = oldImageResult.rows[0]?.image;

    // Mettre à jour avec la nouvelle image
    await pool.query(
      'UPDATE "user" SET image = $1, "updatedAt" = NOW() WHERE id = $2',
      [blob.url, session.user.id]
    );

    await pool.end();

    // Supprimer l'ancienne image si elle existe et est sur Vercel Blob
    if (oldImageUrl && oldImageUrl.includes("vercel-storage.com")) {
      try {
        await del(oldImageUrl);
      } catch (error) {
        console.error("Error deleting old avatar:", error);
        // On continue même si la suppression échoue
      }
    }

    return NextResponse.json({
      success: true,
      url: blob.url,
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // Récupérer l'image actuelle
    const result = await pool.query(
      'SELECT image FROM "user" WHERE id = $1',
      [session.user.id]
    );
    const imageUrl = result.rows[0]?.image;

    // Supprimer l'image de Vercel Blob si elle existe
    if (imageUrl && imageUrl.includes("vercel-storage.com")) {
      try {
        await del(imageUrl);
      } catch (error) {
        console.error("Error deleting avatar:", error);
      }
    }

    // Mettre à jour l'utilisateur (supprimer l'image)
    await pool.query(
      'UPDATE "user" SET image = NULL, "updatedAt" = NOW() WHERE id = $1',
      [session.user.id]
    );

    await pool.end();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Avatar delete error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}







