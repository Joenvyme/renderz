import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

function bytesToAscii(bytes: Uint8Array, start: number, len: number): string {
  let s = '';
  const end = Math.min(start + len, bytes.length);
  for (let i = start; i < end; i++) {
    s += String.fromCharCode(bytes[i]!);
  }
  return s;
}

/** Safari / FormData : type MIME parfois vide alors que le contenu est bien une image. */
function sniffImageMimeFromHead(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return 'image/png';
  }
  if (bytes.length >= 12) {
    const head = bytesToAscii(bytes, 0, 4);
    const mid = bytesToAscii(bytes, 8, 4);
    if (head === 'RIFF' && mid === 'WEBP') return 'image/webp';
    if (bytes.length >= 16 && bytesToAscii(bytes, 8, 4) === 'ftyp') {
      const brand = bytesToAscii(bytes, 12, 4);
      if (/heic|heix|mif1|msf1/i.test(brand)) return 'image/heic';
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    /** Limite relevée : le client compresse en général avant envoi ; repli gros fichiers rares. */
    const maxBytes = 25 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: `Fichier trop volumineux (max ${Math.round(maxBytes / (1024 * 1024))} Mo)` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);
    const head = new Uint8Array(buf.subarray(0, Math.min(32, buf.length)));

    let effectiveType = (file.type || '').trim().toLowerCase();
    if (!effectiveType.startsWith('image/')) {
      const sniffed = sniffImageMimeFromHead(head);
      if (sniffed) {
        effectiveType = sniffed;
      } else {
        return NextResponse.json(
          { error: 'File must be an image' },
          { status: 400 }
        );
      }
    }

    const sniffedMime = sniffImageMimeFromHead(head);
    const isHeic =
      effectiveType.includes('heic') ||
      effectiveType.includes('heif') ||
      sniffedMime === 'image/heic';

    let uploadBody: Buffer = buf;
    let contentType = effectiveType;
    let convertedHeicToJpeg = false;

    if (isHeic) {
      try {
        uploadBody = await sharp(buf)
          .rotate()
          .resize(4096, 4096, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85, mozjpeg: true })
          .toBuffer();
        contentType = 'image/jpeg';
        convertedHeicToJpeg = true;
      } catch (convErr) {
        console.error('upload HEIC→JPEG:', convErr);
      }
    }

    // Upload vers Supabase Storage
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const safeName = file.name?.replace(/[^\w.\-()+]/g, '_') || 'image';
    const rand = Math.random().toString(36).slice(2, 10);
    const fileName = convertedHeicToJpeg
      ? `${Date.now()}-${rand}-${safeName.replace(/\.(heic|heif)$/i, '') || 'photo'}.jpg`
      : `${Date.now()}-${rand}-${safeName}`;

    const { error } = await supabase.storage.from('original-images').upload(fileName, uploadBody, {
      cacheControl: '3600',
      upsert: false,
      contentType,
    });

    if (error) {
      console.error('Supabase upload error:', error);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('original-images').getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}







