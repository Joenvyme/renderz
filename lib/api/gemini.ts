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

    // Utilisation de l'API Gemini Pro Vision pour analyser et générer des descriptions
    // Puis utilisation d'un service de génération d'images (Replicate, Stability AI, etc.)
    // Pour l'instant, on utilise Gemini pour améliorer le prompt
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are an AI image generation expert. Given this prompt: "${request.prompt}", enhance it to create a photorealistic, hyperrealistic render. Return ONLY the enhanced prompt, nothing else.`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 200,
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
    const enhancedPrompt = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    console.log(`Enhanced prompt: ${enhancedPrompt}`);

    // Pour la génération d'image réelle, on utilise Replicate (gratuit pour commencer)
    // ou on retourne l'image originale avec un watermark
    // TODO: Intégrer Replicate API ou Stability AI pour la génération réelle
    
    // Pour l'instant, on retourne une image de placeholder avec le prompt amélioré
    const placeholderImage = await generatePlaceholderImage(
      enhancedPrompt || request.prompt,
      request.imageUrl
    );

    return {
      success: true,
      generatedImageUrl: placeholderImage,
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
 * Générer une image placeholder avec le prompt
 * TODO: Remplacer par une vraie API de génération d'images (Replicate, Stability AI)
 */
async function generatePlaceholderImage(
  prompt: string,
  originalImageUrl: string
): Promise<string> {
  // Pour l'instant, on retourne l'image originale
  // Dans une vraie implémentation, on utiliserait:
  // - Replicate API (Stable Diffusion, Flux, etc.)
  // - Stability AI
  // - Leonardo AI
  // - Midjourney API
  
  console.log('⚠️ Using placeholder - integrate Replicate or Stability AI for real generation');
  console.log(`Prompt: ${prompt}`);
  
  return originalImageUrl; // Retourne l'image originale en attendant
}

