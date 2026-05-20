import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

const BUCKET = "catalog-items";

function bytesToAscii(bytes: Uint8Array, start: number, len: number): string {
  let s = "";
  const end = Math.min(start + len, bytes.length);
  for (let i = start; i < end; i++) {
    s += String.fromCharCode(bytes[i]!);
  }
  return s;
}

function sniffImageMimeFromHead(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (bytes.length >= 12) {
    const head = bytesToAscii(bytes, 0, 4);
    const mid = bytesToAscii(bytes, 8, 4);
    if (head === "RIFF" && mid === "WEBP") return "image/webp";
    if (bytes.length >= 16 && bytesToAscii(bytes, 8, 4) === "ftyp") {
      const brand = bytesToAscii(bytes, 12, 4);
      if (/heic|heix|mif1|msf1/i.test(brand)) return "image/heic";
    }
  }
  return null;
}

/**
 * Upload d’image pour la galerie catalogue.
 * - HEIC/HEIF converti en JPEG via sharp.
 * - Fichier servi en lecture publique depuis le bucket `catalog-items`.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 });
    }

    const maxBytes = 15 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: `Fichier trop volumineux (max ${Math.round(maxBytes / (1024 * 1024))} Mo)` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);
    const head = new Uint8Array(buf.subarray(0, Math.min(32, buf.length)));

    let effectiveType = (file.type || "").trim().toLowerCase();
    if (!effectiveType.startsWith("image/")) {
      const sniffed = sniffImageMimeFromHead(head);
      if (sniffed) {
        effectiveType = sniffed;
      } else {
        return NextResponse.json(
          { error: "Le fichier doit être une image" },
          { status: 400 }
        );
      }
    }

    const sniffedMime = sniffImageMimeFromHead(head);
    const isHeic =
      effectiveType.includes("heic") ||
      effectiveType.includes("heif") ||
      sniffedMime === "image/heic";

    let uploadBody: Buffer = buf;
    let contentType = effectiveType;
    let convertedHeicToJpeg = false;
    if (isHeic) {
      try {
        uploadBody = await sharp(buf)
          .rotate()
          .resize(4096, 4096, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 85, mozjpeg: true })
          .toBuffer();
        contentType = "image/jpeg";
        convertedHeicToJpeg = true;
      } catch (err) {
        console.error("catalog upload HEIC→JPEG:", err);
      }
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const safeName = (file.name || "image").replace(/[^\w.\-()+]/g, "_") || "image";
    const rand = Math.random().toString(36).slice(2, 10);
    const baseName = convertedHeicToJpeg
      ? `${safeName.replace(/\.(heic|heif)$/i, "") || "photo"}.jpg`
      : safeName;
    const objectPath = `${session.user.id}/${Date.now()}-${rand}-${baseName}`;

    const { error } = await supabase.storage.from(BUCKET).upload(objectPath, uploadBody, {
      cacheControl: "3600",
      upsert: false,
      contentType,
    });

    if (error) {
      console.error("catalog upload storage:", error);
      return NextResponse.json(
        { error: "Erreur stockage" },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);

    return NextResponse.json({ url: publicUrl, path: objectPath });
  } catch (err) {
    console.error("catalog upload unexpected:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
