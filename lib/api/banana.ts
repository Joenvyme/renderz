/**
 * Google Gemini API Client (Imagen)
 * https://ai.google.dev/
 */

import { MOCK_MODE, delay, MOCK_GENERATED_IMAGE } from './mock-mode';

interface GeminiGenerateRequest {
  imageUrl: string;
  prompt: string;
}

interface GeminiGenerateResponse {
  success: boolean;
  generatedImageUrl?: string;
  error?: string;
}

export async function generateWithGemini(
  request: GeminiGenerateRequest
): Promise<GeminiGenerateResponse> {
  // MODE MOCK pour tester sans API
  if (MOCK_MODE) {
    console.log('✨ [MOCK] Google Gemini generation simulated...');
    await delay(2000); // Simule un délai de 2 secondes
    return {
      success: true,
      generatedImageUrl: MOCK_GENERATED_IMAGE,
    };
  }

  try {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('Google Gemini API key not configured. Set MOCK_MODE=true in .env.local to test without API keys.');
    }

    // Utilisation de l'API Gemini pour la génération d'images
    // Documentation: https://ai.google.dev/tutorials/image_generation
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instances: [
            {
              prompt: request.prompt,
              // Image de référence (optionnel selon le modèle)
              image: {
                bytesBase64Encoded: await fetchImageAsBase64(request.imageUrl),
              },
            },
          ],
          parameters: {
            sampleCount: 1,
            aspectRatio: '1:1',
            negativePrompt: 'blurry, low quality, distorted',
            // Mode: edit ou generate
            mode: 'edit', // Pour éditer une image existante
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Google Gemini API error: ${response.statusText} - ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();

    // Gemini retourne les images en base64
    const imageBase64 = data.predictions?.[0]?.bytesBase64Encoded;
    
    if (!imageBase64) {
      throw new Error('No image returned from Gemini API');
    }

    return {
      success: true,
      generatedImageUrl: `data:image/png;base64,${imageBase64}`,
    };
  } catch (error) {
    console.error('Google Gemini generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Convertir une URL d'image en base64
 */
async function fetchImageAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  return base64;
}

