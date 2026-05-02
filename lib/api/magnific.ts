/**
 * Magnific AI API Client
 * https://magnific.ai/
 */

import { MOCK_MODE, delay, MOCK_UPSCALED_IMAGE } from './mock-mode';

/** Profils `optimized_for` (API Freepik Image Upscaler Creative). */
export type MagnificOptimizedFor =
  | 'standard'
  | 'soft_portraits'
  | 'hard_portraits'
  | 'art_n_illustration'
  | 'videogame_assets'
  | 'nature_n_landscapes'
  | 'films_n_photography'
  | '3d_renders'
  | 'science_fiction_n_horror';

export interface MagnificUpscaleRequest {
  imageUrl: string;
  scale?: number; // 2, 4, 8, 16 → "2x"…
  /**
   * Freepik OpenAPI : « Increase or decrease AI's creativity ». [-10, 10], défaut 0.
   * @see https://docs.freepik.com/api-reference/image-upscaler-creative/post-image-upscaler
   */
  creativity?: number;
  /**
   * Freepik OpenAPI : « Adjust the level of resemblance to the original image ». [-10, 10], défaut 0.
   * Les deux axes sont indépendants ; le guide parle d’équilibrer fidélité vs créativité.
   */
  resemblance?: number;
  /** Guide l’upscale (souvent le prompt utilisateur). */
  prompt?: string;
  /** Défaut produit : rendus 3D (`3d_renders`). */
  optimizedFor?: MagnificOptimizedFor;
}

interface MagnificUpscaleResponse {
  success: boolean;
  upscaledImageUrl?: string;
  error?: string;
  taskId?: string;
}

interface MagnificTaskStatusResponse {
  data: {
    status: 'CREATED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
    task_id: string;
    generated?: string[]; // Tableau d'URLs générées (différentes tailles)
    url?: string; // Fallback si l'API change
    error?: string;
  };
}

/**
 * Vérifie le statut d'une tâche Magnific jusqu'à completion
 * Prend environ 30s-2min selon la taille de l'image
 */
async function pollMagnificTask(
  taskId: string,
  apiKey: string,
  maxAttempts: number = 40, // 40 tentatives * 3s = 2 minutes max
  intervalMs: number = 3000 // Vérifier toutes les 3 secondes
): Promise<string> {
  console.log(`🔄 Magnific: Début du polling pour task ${taskId} (max ${maxAttempts * intervalMs / 1000}s)`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Attendre avant de vérifier (sauf la première fois)
      if (attempt > 1) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
      
      console.log(`🔄 Magnific: Tentative ${attempt}/${maxAttempts}...`);
      
      const response = await fetch(`https://api.freepik.com/v1/ai/image-upscaler/${taskId}`, {
        method: 'GET',
        headers: {
          'x-freepik-api-key': apiKey,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`🔄 Magnific: Erreur polling (${response.status}):`, errorData);
        throw new Error(`Polling failed: ${response.status} - ${JSON.stringify(errorData)}`);
      }
      
      const data: MagnificTaskStatusResponse = await response.json();
      
      console.log(`🔄 Magnific: Statut tâche: ${data.data?.status}`);
      
      if (data.data?.status === 'COMPLETED') {
        // Logger la réponse complète pour debug
        console.log('🔍 Magnific: Réponse COMPLETED complète:', JSON.stringify(data, null, 2));
        
        // L'URL est dans data.data.generated[0] (tableau d'URLs)
        const generatedUrls = data.data?.generated;
        
        if (Array.isArray(generatedUrls) && generatedUrls.length > 0) {
          const upscaledUrl = generatedUrls[0]; // Prendre la première URL
          console.log(`✅ Magnific: Tâche terminée ! URL récupérée: ${upscaledUrl.substring(0, 80)}...`);
          console.log(`✅ Magnific: Total URLs disponibles: ${generatedUrls.length}`);
          return upscaledUrl;
        }
        
        // Fallback : vérifier d'autres champs possibles
        const dataAny = data.data as any;
        const possibleUrl = 
          data.data?.url || 
          dataAny?.output_url || 
          dataAny?.result_url || 
          dataAny?.image_url ||
          (data as any).url ||
          (data as any).output_url;
        
        if (possibleUrl) {
          console.log(`✅ Magnific: Tâche terminée ! URL (fallback): ${possibleUrl.substring(0, 80)}...`);
          return possibleUrl;
        }
        
        console.error('⚠️ Magnific: COMPLETED mais aucune URL trouvée dans la réponse !');
        throw new Error('Task completed but no URL found in response');
      }
      
      if (data.data?.status === 'FAILED') {
        throw new Error(`Task failed: ${data.data?.error || 'Erreur inconnue'}`);
      }
      
      // Status: CREATED ou IN_PROGRESS → continuer le polling
      console.log(`⏳ Magnific: En cours... (${data.data?.status})`);
      
    } catch (error) {
      console.error(`🔄 Magnific: Erreur tentative ${attempt}:`, error);
      // Si c'est la dernière tentative, throw l'erreur
      if (attempt === maxAttempts) {
        throw error;
      }
      // Sinon, continuer à essayer
    }
  }
  
  throw new Error(`Timeout: Task ${taskId} non terminée après ${maxAttempts * intervalMs / 1000}s`);
}

export async function upscaleWithMagnific(
  request: MagnificUpscaleRequest
): Promise<MagnificUpscaleResponse> {
  // MODE MOCK pour tester sans API
  if (MOCK_MODE) {
    console.log('✨ [MOCK] Magnific AI upscaling simulated...');
    await delay(2000); // Simule un délai de 2 secondes
    return {
      success: true,
      upscaledImageUrl: MOCK_UPSCALED_IMAGE,
    };
  }

  try {
    const apiKey = process.env.MAGNIFIC_API_KEY;

    if (!apiKey) {
      throw new Error('Magnific AI API credentials not configured. Set MOCK_MODE=true in .env.local to test without API keys.');
    }

    console.log('🔍 Magnific: Fetching image from URL:', request.imageUrl.substring(0, 80) + '...');
    
    // Télécharger l'image et la convertir en base64
    const imageResponse = await fetch(request.imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');
    
    console.log(`🔍 Magnific: Image downloaded, size: ${Math.round(imageBase64.length / 1024)}KB`);

    // API Magnific hébergée sur Freepik
    // Documentation: https://docs.freepik.com/api-reference/image-upscaler-creative/post-image-upscaler
    
    const clampTen = (x: unknown) =>
      Math.round(
        Math.min(
          10,
          Math.max(-10, typeof x === 'number' && Number.isFinite(x) ? x : Number(x) || 0)
        )
      );

    const creativity = clampTen(request.creativity ?? 0);
    const resemblance = clampTen(request.resemblance ?? 0);

    const requestBody: Record<string, unknown> = {
      image: imageBase64,
      scale_factor: `${request.scale || 4}x`,
      optimized_for: request.optimizedFor ?? '3d_renders',
      creativity,
      hdr: 0,
      resemblance,
      fractality: 0,
      engine: 'automatic',
    };

    const p = request.prompt?.trim();
    if (p) {
      requestBody.prompt = p;
    }
    
    console.log('🔍 Magnific: Calling Freepik API with params:', {
      scale_factor: requestBody.scale_factor,
      optimized_for: requestBody.optimized_for,
      creativity,
      resemblance,
      hasPrompt: Boolean(p),
      imageSizeKB: Math.round(imageBase64.length / 1024),
    });
    
    const response = await fetch('https://api.freepik.com/v1/ai/image-upscaler', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-freepik-api-key': apiKey, // Freepik API utilise x-freepik-api-key
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`🔍 Magnific: API response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('🔍 Magnific: API error details:', errorData);
      throw new Error(`Magnific AI API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('🔍 Magnific: API response data:', {
      status: data.data?.status,
      task_id: data.data?.task_id,
      hasUrl: !!data.data?.url
    });

    const taskId = data.data?.task_id;
    
    if (!taskId) {
      throw new Error('Pas de task_id retourné par l\'API Magnific');
    }
    
    // Si l'URL est déjà disponible (rare), la retourner directement
    if (data.data?.url) {
      console.log('✅ Magnific: URL disponible immédiatement !');
      return {
        success: true,
        upscaledImageUrl: data.data.url,
        taskId,
      };
    }
    
    // Sinon, poller jusqu'à ce que la tâche soit terminée
    console.log('🔄 Magnific: Tâche créée, début du polling...');
    const upscaledUrl = await pollMagnificTask(taskId, apiKey);
    
    return {
      success: true,
      upscaledImageUrl: upscaledUrl,
      taskId,
    };
  } catch (error) {
    console.error('Magnific AI upscale error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

