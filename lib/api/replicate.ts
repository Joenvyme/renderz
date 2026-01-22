/**
 * Replicate API Client
 * https://replicate.com/
 * Génération d'images avec Flux, Stable Diffusion, etc.
 */

import { MOCK_MODE, delay, MOCK_GENERATED_IMAGE } from './mock-mode';

interface ReplicateGenerateRequest {
  imageUrl: string;
  prompt: string;
}

interface ReplicateGenerateResponse {
  success: boolean;
  generatedImageUrl?: string;
  error?: string;
}

export async function generateWithReplicate(
  request: ReplicateGenerateRequest
): Promise<ReplicateGenerateResponse> {
  // MODE MOCK pour tester sans API
  if (MOCK_MODE) {
    console.log('🎨 [MOCK] Replicate (Flux) generation simulated...');
    await delay(2000);
    return {
      success: true,
      generatedImageUrl: MOCK_GENERATED_IMAGE,
    };
  }

  try {
    const apiKey = process.env.REPLICATE_API_TOKEN;

    if (!apiKey) {
      throw new Error('Replicate API token not configured. Get one free at https://replicate.com/');
    }

    // Utiliser Flux Schnell (gratuit et rapide) pour la génération
    // Modèle: black-forest-labs/flux-schnell
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'f2ab8a5569279d9b84458b7c6cf31124eb1cbd9c0e000ec84bd3c1ba08b69caa', // flux-schnell
        input: {
          prompt: request.prompt,
          // Image de référence pour img2img
          image: request.imageUrl,
          // Paramètres
          num_outputs: 1,
          guidance_scale: 7.5,
          num_inference_steps: 4, // Schnell = rapide (4 steps)
          output_format: 'png',
          output_quality: 100,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Replicate API error: ${response.statusText} - ${JSON.stringify(errorData)}`
      );
    }

    const prediction = await response.json();

    // Attendre que la génération soit terminée
    let result = prediction;
    while (result.status !== 'succeeded' && result.status !== 'failed') {
      await delay(1000);
      
      const statusResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${result.id}`,
        {
          headers: {
            'Authorization': `Token ${apiKey}`,
          },
        }
      );

      if (!statusResponse.ok) {
        throw new Error('Failed to check prediction status');
      }

      result = await statusResponse.json();
    }

    if (result.status === 'failed') {
      throw new Error(result.error || 'Replicate generation failed');
    }

    const imageUrl = result.output?.[0];
    
    if (!imageUrl) {
      throw new Error('No image returned from Replicate');
    }

    return {
      success: true,
      generatedImageUrl: imageUrl,
    };
  } catch (error) {
    console.error('Replicate generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}






