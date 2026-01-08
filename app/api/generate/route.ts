import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateWithNanoBanana } from '@/lib/api/nano-banana';
import { upscaleWithMagnific } from '@/lib/api/magnific';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { imageUrl, prompt } = body;

    if (!imageUrl || !prompt) {
      return NextResponse.json(
        { error: 'Missing imageUrl or prompt' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Créer un enregistrement dans la DB avec l'ID utilisateur
    const { data: render, error: dbError } = await supabase
      .from('renders')
      .insert({
        user_id: session.user.id,
        original_image_url: imageUrl,
        prompt,
        status: 'processing',
      })
      .select()
      .single();

    if (dbError || !render) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to create render record' },
        { status: 500 }
      );
    }

    // Lancer la génération en arrière-plan (dans une vraie app, utiliser une queue)
    processRender(render.id, imageUrl, prompt).catch(console.error);

    return NextResponse.json({
      success: true,
      renderId: render.id,
      status: 'processing',
      message: 'Render started successfully',
    });
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processRender(renderId: string, imageUrl: string, prompt: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Étape 1: Génération avec Nano Banana (Google Gemini)
    console.log(`[${renderId}] Starting Nano Banana generation...`);
    console.log(`[${renderId}] Image URL: ${imageUrl}`);
    console.log(`[${renderId}] Prompt: ${prompt.substring(0, 50)}...`);
    
    const nanoBananaResult = await generateWithNanoBanana({ imageUrl, prompt });

    if (!nanoBananaResult.success || !nanoBananaResult.generatedImageUrl) {
      throw new Error(nanoBananaResult.error || 'Nano Banana generation failed');
    }

    console.log(`[${renderId}] ✓ Nano Banana generation complete!`);
    console.log(`[${renderId}] Generated image URL: ${nanoBananaResult.generatedImageUrl.substring(0, 80)}...`);

    // Mettre à jour avec l'image générée
    const { error: updateError } = await supabase
      .from('renders')
      .update({
        generated_image_url: nanoBananaResult.generatedImageUrl,
      })
      .eq('id', renderId);

    if (updateError) {
      console.error(`[${renderId}] Database update error:`, updateError);
    } else {
      console.log(`[${renderId}] ✓ Database updated with generated image`);
    }

    // Étape 2: Upscaling avec Magnific AI (optionnel)
    console.log(`[${renderId}] Starting Magnific AI upscaling...`);
    
    // Si pas de clé Magnific, on skip l'upscaling
    if (!process.env.MAGNIFIC_API_KEY || process.env.MAGNIFIC_API_KEY === 'votre_cle_ici') {
      console.log(`[${renderId}] No Magnific API key, skipping upscaling`);
      await supabase
        .from('renders')
        .update({
          upscaled_image_url: nanoBananaResult.generatedImageUrl, // Utiliser l'image générée directement
          status: 'completed',
        })
        .eq('id', renderId);
      console.log(`[${renderId}] Render completed (without upscaling)!`);
      return;
    }

    try {
      console.log(`[${renderId}] Calling Magnific with image: ${nanoBananaResult.generatedImageUrl.substring(0, 80)}...`);
      
      const magnificResult = await upscaleWithMagnific({
        imageUrl: nanoBananaResult.generatedImageUrl,
        scale: 4,
      });

      console.log(`[${renderId}] Magnific result:`, {
        success: magnificResult.success,
        hasUrl: !!magnificResult.upscaledImageUrl,
        error: magnificResult.error
      });

      if (!magnificResult.success || !magnificResult.upscaledImageUrl) {
        console.warn(`[${renderId}] ⚠️ Magnific upscaling failed: ${magnificResult.error || 'Unknown error'}`);
        console.warn(`[${renderId}] Using generated image as fallback`);
        // Si Magnific échoue, utiliser l'image générée quand même
        await supabase
          .from('renders')
          .update({
            upscaled_image_url: nanoBananaResult.generatedImageUrl,
            status: 'completed',
          })
          .eq('id', renderId);
        console.log(`[${renderId}] Render completed (without upscaling)!`);
        return;
      }

      // Télécharger l'image upscalée depuis Magnific et l'uploader vers Supabase
      // (car l'URL de Magnific contient un token temporaire qui expire)
      console.log(`[${renderId}] Downloading upscaled image from Magnific...`);
      const magnificImageResponse = await fetch(magnificResult.upscaledImageUrl);
      
      if (!magnificImageResponse.ok) {
        throw new Error(`Failed to download upscaled image: ${magnificImageResponse.statusText}`);
      }
      
      const magnificImageBuffer = await magnificImageResponse.arrayBuffer();
      const magnificImageSizeKB = Math.round(magnificImageBuffer.byteLength / 1024);
      console.log(`[${renderId}] ✓ Upscaled image downloaded! Size: ${magnificImageSizeKB}KB`);

      // Upload vers Supabase Storage
      const upscaledFileName = `upscaled-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('upscaled-renders')
        .upload(`upscaled/${upscaledFileName}`, magnificImageBuffer, {
          contentType: 'image/png',
          upsert: false,
        });

      if (uploadError) {
        console.error(`[${renderId}] Upscaled image upload error:`, uploadError);
        // Fallback : utiliser l'image générée
        await supabase
          .from('renders')
          .update({
            upscaled_image_url: nanoBananaResult.generatedImageUrl,
            status: 'completed',
          })
          .eq('id', renderId);
        console.log(`[${renderId}] Render completed (without upscaled storage)!`);
        return;
      }

      // Récupérer l'URL publique
      const { data: publicUrlData } = supabase.storage
        .from('upscaled-renders')
        .getPublicUrl(`upscaled/${upscaledFileName}`);

      const finalUpscaledUrl = publicUrlData.publicUrl;
      console.log(`[${renderId}] ✓ Upscaled image uploaded to Supabase:`, finalUpscaledUrl.substring(0, 80) + '...');

      // Mettre à jour avec l'image upscalée
      const { error: finalUpdateError } = await supabase
        .from('renders')
        .update({
          upscaled_image_url: finalUpscaledUrl,
          status: 'completed',
        })
        .eq('id', renderId);

      if (finalUpdateError) {
        console.error(`[${renderId}] Final database update error:`, finalUpdateError);
      }

      console.log(`[${renderId}] ✓ Render completed successfully with upscaling!`);
    } catch (magnificError) {
      console.error(`[${renderId}] ⚠️ Magnific exception caught:`, magnificError);
      console.error(`[${renderId}] Error details:`, {
        message: magnificError instanceof Error ? magnificError.message : 'Unknown',
        stack: magnificError instanceof Error ? magnificError.stack : undefined
      });
      console.warn(`[${renderId}] Using generated image as fallback`);
      // En cas d'erreur Magnific, utiliser l'image générée quand même
      await supabase
        .from('renders')
        .update({
          upscaled_image_url: nanoBananaResult.generatedImageUrl,
          status: 'completed',
        })
        .eq('id', renderId);
      console.log(`[${renderId}] Render completed (without upscaling)!`);
    }
  } catch (error) {
    console.error(`[${renderId}] Render failed:`, error);
    
    await supabase
      .from('renders')
      .update({
        status: 'failed',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      })
      .eq('id', renderId);
  }
}

