import 'server-only';

/**
 * Google Nano Banana API Client
 * Documentation: 
 * - Génération d'images: https://ai.google.dev/gemini-api/docs/image-generation?authuser=1&hl=fr
 * - Bonnes pratiques Gemini 3: https://ai.google.dev/gemini-api/docs/gemini-3?hl=fr#image_generation_and_editing
 * 
 * Génération d'images avec Gemini 3 Pro Image Preview (Nano Banana Pro)
 * 
 * Bonnes pratiques appliquées :
 * - Prompts concis et directs (Gemini 3 répond mieux aux instructions courtes)
 * - Instructions placées après le contexte multimédia (meilleur ancrage du raisonnement)
 * - Évite les techniques verbeuses d'ingénierie de prompts
 */

import sharp from 'sharp';
import type { AspectRatio, ImageInput, ImageOutputSize, ImageRole } from './gemini-image-config';
import { DEFAULT_IMAGE_OUTPUT_SIZE } from './gemini-image-config';
import { MOCK_MODE, delay, MOCK_GENERATED_IMAGE } from './mock-mode';

/** Côté le plus long plafonné — photos galerie 12Mpx gonflaient la requête et provoquaient des 503 / deadline. */
const PREVIEW_MAX_EDGE_PX = 2048;
const PREVIEW_JPEG_QUALITY = 85;

interface NanoBananaGenerateRequest {
  images: ImageInput[]; // Support pour plusieurs images
  prompt: string;
  aspectRatio?: AspectRatio;
  /** Résolution de sortie Gemini 3 Pro Image (`imageConfig.imageSize`). Défaut : 1K. */
  imageSize?: ImageOutputSize;
}

// Pour la compatibilité, on garde aussi l'ancien format
interface NanoBananaGenerateRequestLegacy {
  imageUrl: string;
  prompt: string;
  aspectRatio?: AspectRatio;
  imageSize?: ImageOutputSize;
}

interface NanoBananaGenerateResponse {
  success: boolean;
  generatedImageUrl?: string;
  error?: string;
}

/**
 * Génère une image avec Gemini, supportant plusieurs images en entrée
 */
export async function generateWithNanoBanana(
  request: NanoBananaGenerateRequest | NanoBananaGenerateRequestLegacy
): Promise<NanoBananaGenerateResponse> {
  // MODE MOCK pour tester sans API
  if (MOCK_MODE) {
    console.log('🍌 [MOCK] Gemini 3 Pro Image generation simulated...');
    await delay(2000);
    return {
      success: true,
      generatedImageUrl: MOCK_GENERATED_IMAGE,
    };
  }

  try {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('Google Gemini API key not configured. Get one free at https://aistudio.google.com/app/apikey');
    }

    // Normaliser le format de la requête (compatibilité avec l'ancien format)
    const images: ImageInput[] = 'images' in request 
      ? request.images 
      : [{ url: request.imageUrl, role: 'main' as ImageRole }];

    const imagePartsPromises = images.map(async (img) =>
      buildGeminiInlineImagePart(img.url)
    );
    const imageParts = await Promise.all(imagePartsPromises);

    // Construire le prompt selon les bonnes pratiques Gemini 3 :
    // - Instructions directes et concises (Gemini 3 répond mieux aux prompts courts)
    // - Instructions après le contexte (pour les grandes données multimodales)
    // - Éviter les techniques verbeuses d'ingénierie de prompts
    let enhancedPrompt: string;
    
    if (images.length === 1) {
      // Prompt concis et direct pour Gemini 3
      enhancedPrompt = `${request.prompt}. Photorealistic, professional quality.`;
    } else {
      // Plusieurs images : ordre des parts = ordre du tableau = numéros 1…N (référencables dans le prompt utilisateur).
      const numbering = images.map((_, i) => `Image ${i + 1}`).join(', ');

      enhancedPrompt = `Input images in order: ${numbering}. They are numbered 1 through ${images.length} in the same order as the image inputs above; when the user refers to an image by number, apply that to the corresponding image. ${request.prompt}. Photorealistic, professional quality.`;
    }

    const imageSize: ImageOutputSize = request.imageSize ?? DEFAULT_IMAGE_OUTPUT_SIZE;

    console.log(`🍌 Generating with Gemini 3 Pro Image (${images.length} image(s))...`);
    console.log(`   Order: ${images.map((_, i) => i + 1).join(', ')}`);
    console.log(`   Output: ${request.aspectRatio || '1:1'} @ ${imageSize}`);

    // Construire les parts selon les bonnes pratiques Gemini 3 :
    // - Pour les données multimodales (images), placer les instructions APRÈS le contexte
    // - Cela ancre mieux le raisonnement du modèle aux données fournies
    const parts: any[] = [
      ...imageParts,  // Images d'abord (contexte)
      { text: enhancedPrompt }  // Instructions après (bonne pratique Gemini 3)
    ];

    // Appel à l'API Gemini 3 Pro Image Preview (Nano Banana Pro)
    // Documentation: https://ai.google.dev/gemini-api/docs/image-generation
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: parts
          }],
          generationConfig: {
            responseModalities: ['IMAGE'],
            imageConfig: {
              aspectRatio: request.aspectRatio || '1:1',
              imageSize,
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Gemini 3 Pro Image API error: ${response.statusText} - ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();

    // Log la réponse complète pour debug
    console.log('🍌 Gemini 3 Pro API Response:', JSON.stringify(data, null, 2).substring(0, 1000));

    // Vérifier s'il y a un blocage de contenu
    if (data.promptFeedback?.blockReason) {
      throw new Error(`Content blocked: ${data.promptFeedback.blockReason}`);
    }

    // Vérifier s'il y a une erreur
    if (data.error) {
      throw new Error(`API Error: ${data.error.message || JSON.stringify(data.error)}`);
    }

    // Extraire l'image générée de la réponse
    // La réponse contient candidates[0].content.parts[]
    const responseParts = data.candidates?.[0]?.content?.parts;
    
    // Vérifier si le candidat a été bloqué
    if (data.candidates?.[0]?.finishReason === 'SAFETY') {
      throw new Error('Image generation blocked for safety reasons');
    }
    
    if (!responseParts || responseParts.length === 0) {
      // Log plus de détails
      console.error('🍌 No parts in response. Full response:', JSON.stringify(data, null, 2));
      throw new Error(`No image returned from Gemini 3 Pro Image API. Finish reason: ${data.candidates?.[0]?.finishReason || 'unknown'}`);
    }

    // Trouver la partie qui contient l'image (inlineData)
    const imagePart = responseParts.find((part: any) => part.inlineData);
    
    if (!imagePart || !imagePart.inlineData?.data) {
      throw new Error('No image data in response');
    }

    const imageBase64Result = imagePart.inlineData.data;
    const mimeType = imagePart.inlineData.mimeType || 'image/png';

    console.log(`✓ Image generated successfully! Size: ${Math.round(imageBase64Result.length / 1024)}KB`);

    // Upload l'image générée vers Supabase Storage
    const uploadedUrl = await uploadBase64ToSupabase(imageBase64Result, mimeType);
    
    console.log(`✓ Image uploaded to Supabase: ${uploadedUrl}`);

    return {
      success: true,
      generatedImageUrl: uploadedUrl,
    };
  } catch (error) {
    console.error('Gemini 3 Pro Image generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Prépare une part image pour Gemini : compression + bon MIME (les uploads galerie sont souvent d’énormes JPEG/HEIC ;
 * on envoyait tout en `image/png`, ce qui est incorrect ; la taille faisait aussi expirer la deadline côté Google).
 */
async function buildGeminiInlineImagePart(
  url: string
): Promise<{ inline_data: { mime_type: string; data: string } }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Impossible de télécharger l’image (${response.status}): ${url.substring(0, 80)}…`);
  }
  const buf = Buffer.from(await response.arrayBuffer());
  const headerMime = normalizeContentTypeMime(response.headers.get('content-type'));

  try {
    const out = await sharp(buf)
      .rotate()
      .resize(PREVIEW_MAX_EDGE_PX, PREVIEW_MAX_EDGE_PX, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: PREVIEW_JPEG_QUALITY, mozjpeg: true })
      .toBuffer();

    return {
      inline_data: {
        mime_type: 'image/jpeg',
        data: out.toString('base64'),
      },
    };
  } catch (err) {
    console.warn(
      '🍌 sharp indisponible ou format non supporté, envoi brut avec MIME détecté:',
      err instanceof Error ? err.message : err
    );
    const mime = headerMime ?? sniffImageMimeFromBuffer(buf);
    return {
      inline_data: {
        mime_type: mime,
        data: buf.toString('base64'),
      },
    };
  }
}

function normalizeContentTypeMime(ct: string | null): string | null {
  if (!ct) return null;
  const base = ct.split(';')[0]?.trim().toLowerCase();
  if (!base || base === 'application/octet-stream') return null;
  if (base.startsWith('image/')) return base;
  return null;
}

/** Détection légère si Supabase/payload ne renvoient pas un Content-Type fiable. */
function sniffImageMimeFromBuffer(buf: Buffer): string {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return 'image/png';
  }
  if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    return 'image/webp';
  }
  if (buf.length >= 16 && buf.slice(8, 12).toString('ascii') === 'ftyp') {
    const brand = buf.slice(12, 16).toString('ascii');
    if (/heic|heix|mif1|msf1/i.test(brand)) {
      return 'image/heic';
    }
  }
  return 'image/jpeg';
}

/**
 * Upload une image base64 vers Supabase Storage
 */
async function uploadBase64ToSupabase(base64Data: string, mimeType: string): Promise<string> {
  const { createClient } = await import('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Convertir base64 en Buffer
  const buffer = Buffer.from(base64Data, 'base64');
  
  // Générer un nom de fichier unique
  const fileName = `generated-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
  const filePath = `renders/${fileName}`;

  // Upload vers Supabase Storage
  const { data, error } = await supabase.storage
    .from('generated-renders')
    .upload(filePath, buffer, {
      contentType: mimeType,
      cacheControl: '3600',
    });

  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error(`Failed to upload to Supabase: ${error.message}`);
  }

  // Obtenir l'URL publique
  const { data: { publicUrl } } = supabase.storage
    .from('generated-renders')
    .getPublicUrl(filePath);

  return publicUrl;
}

