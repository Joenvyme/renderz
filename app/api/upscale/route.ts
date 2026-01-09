import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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
    const { renderId, scale = 4 } = body as {
      renderId: string;
      scale?: number;
    };

    if (!renderId) {
      return NextResponse.json(
        { error: 'Missing renderId' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Récupérer le render et vérifier qu'il appartient à l'utilisateur
    const { data: render, error: fetchError } = await supabase
      .from('renders')
      .select('*')
      .eq('id', renderId)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError || !render) {
      return NextResponse.json(
        { error: 'Render not found or access denied' },
        { status: 404 }
      );
    }

    if (!render.generated_image_url) {
      return NextResponse.json(
        { error: 'No generated image to upscale' },
        { status: 400 }
      );
    }

    // Vérifier si déjà upscalé
    if (render.upscaled_image_url && render.upscaled_image_url !== render.generated_image_url) {
      return NextResponse.json(
        { error: 'Already upscaled', upscaled_image_url: render.upscaled_image_url },
        { status: 400 }
      );
    }

    // Vérifier si Magnific est configuré
    if (!process.env.MAGNIFIC_API_KEY || process.env.MAGNIFIC_API_KEY === 'votre_cle_ici') {
      return NextResponse.json(
        { error: 'Upscaling service not configured. Contact administrator.' },
        { status: 503 }
      );
    }

    // Marquer comme "upscaling" en cours
    await supabase
      .from('renders')
      .update({
        status: 'upscaling',
        metadata: { 
          ...(render.metadata as object || {}),
          upscale_started_at: new Date().toISOString(),
          upscale_scale: scale
        },
      })
      .eq('id', renderId);

    // Lancer l'upscaling en arrière-plan
    processUpscale(renderId, render.generated_image_url, scale).catch(console.error);

    return NextResponse.json({
      success: true,
      renderId,
      status: 'upscaling',
      message: 'Upscaling started successfully',
    });
  } catch (error) {
    console.error('Upscale error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processUpscale(renderId: string, imageUrl: string, scale: number) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    console.log(`[${renderId}] Starting Magnific AI upscaling (${scale}x)...`);
    console.log(`[${renderId}] Image URL: ${imageUrl.substring(0, 80)}...`);

    const magnificResult = await upscaleWithMagnific({
      imageUrl,
      scale,
    });

    console.log(`[${renderId}] Magnific result:`, {
      success: magnificResult.success,
      hasUrl: !!magnificResult.upscaledImageUrl,
      error: magnificResult.error
    });

    if (!magnificResult.success || !magnificResult.upscaledImageUrl) {
      throw new Error(magnificResult.error || 'Magnific upscaling failed');
    }

    // Télécharger l'image upscalée depuis Magnific et l'uploader vers Supabase
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
    const { error: uploadError } = await supabase.storage
      .from('upscaled-renders')
      .upload(`upscaled/${upscaledFileName}`, magnificImageBuffer, {
        contentType: 'image/png',
        upsert: false,
      });

    if (uploadError) {
      console.error(`[${renderId}] Upscaled image upload error:`, uploadError);
      throw new Error(`Failed to upload upscaled image: ${uploadError.message}`);
    }

    // Récupérer l'URL publique
    const { data: publicUrlData } = supabase.storage
      .from('upscaled-renders')
      .getPublicUrl(`upscaled/${upscaledFileName}`);

    const finalUpscaledUrl = publicUrlData.publicUrl;
    console.log(`[${renderId}] ✓ Upscaled image uploaded to Supabase:`, finalUpscaledUrl.substring(0, 80) + '...');

    // Récupérer les metadata existantes
    const { data: currentRender } = await supabase
      .from('renders')
      .select('metadata')
      .eq('id', renderId)
      .single();

    // Mettre à jour avec l'image upscalée
    const { error: finalUpdateError } = await supabase
      .from('renders')
      .update({
        upscaled_image_url: finalUpscaledUrl,
        status: 'completed',
        metadata: {
          ...(currentRender?.metadata as object || {}),
          upscale_completed_at: new Date().toISOString(),
          upscale_size_kb: magnificImageSizeKB,
        },
      })
      .eq('id', renderId);

    if (finalUpdateError) {
      console.error(`[${renderId}] Final database update error:`, finalUpdateError);
    }

    console.log(`[${renderId}] ✓ Upscaling completed successfully!`);
  } catch (error) {
    console.error(`[${renderId}] Upscaling failed:`, error);
    
    // Récupérer les metadata existantes pour ne pas les écraser
    const { data: existingRender } = await supabase
      .from('renders')
      .select('metadata')
      .eq('id', renderId)
      .single();
    
    await supabase
      .from('renders')
      .update({
        status: 'completed', // Retour à completed (pas failed car l'image générée existe)
        metadata: { 
          ...(existingRender?.metadata as object || {}),
          upscale_error: error instanceof Error ? error.message : 'Unknown error',
          upscale_failed_at: new Date().toISOString(),
        },
      })
      .eq('id', renderId);
  }
}

