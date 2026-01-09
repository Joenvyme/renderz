import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateWithNanoBanana, AspectRatio } from '@/lib/api/nano-banana';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// Limite de rendus par utilisateur
const MAX_RENDERS_PER_USER = 10;

// Utilisateurs sans limite de rendus
const UNLIMITED_USERS = [
  'joey.montani@gmail.com',
];

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
    const { imageUrl, prompt, aspectRatio } = body as {
      imageUrl: string;
      prompt: string;
      aspectRatio?: AspectRatio;
    };

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

    // Vérifier le nombre de rendus de l'utilisateur
    const { count, error: countError } = await supabase
      .from('renders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id);

    if (countError) {
      console.error('Error counting renders:', countError);
      return NextResponse.json(
        { error: 'Erreur lors de la vérification des limites' },
        { status: 500 }
      );
    }

    // Vérifier si l'utilisateur a des rendus illimités
    const hasUnlimitedRenders = UNLIMITED_USERS.includes(session.user.email || '');

    if (!hasUnlimitedRenders && count !== null && count >= MAX_RENDERS_PER_USER) {
      return NextResponse.json(
        { 
          error: 'Limite atteinte',
          message: `Vous avez atteint la limite de ${MAX_RENDERS_PER_USER} rendus. Supprimez des rendus existants ou passez à un plan supérieur.`,
          currentCount: count,
          maxAllowed: MAX_RENDERS_PER_USER
        },
        { status: 403 }
      );
    }

    // Créer un enregistrement dans la DB avec l'ID utilisateur
    const { data: render, error: dbError } = await supabase
      .from('renders')
      .insert({
        user_id: session.user.id,
        original_image_url: imageUrl,
        prompt,
        status: 'processing',
        metadata: { aspectRatio: aspectRatio || '1:1' },
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

    // Lancer la génération en arrière-plan (SANS upscaling automatique)
    processRender(render.id, imageUrl, prompt, aspectRatio).catch(console.error);

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

async function processRender(renderId: string, imageUrl: string, prompt: string, aspectRatio?: AspectRatio) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Génération avec Nano Banana (Google Gemini) - SANS upscaling automatique
    console.log(`[${renderId}] Starting Nano Banana generation...`);
    console.log(`[${renderId}] Image URL: ${imageUrl}`);
    console.log(`[${renderId}] Prompt: ${prompt.substring(0, 50)}...`);
    console.log(`[${renderId}] Aspect Ratio: ${aspectRatio || '1:1'}`);
    
    const nanoBananaResult = await generateWithNanoBanana({ 
      imageUrl, 
      prompt,
      aspectRatio: aspectRatio || '1:1'
    });

    if (!nanoBananaResult.success || !nanoBananaResult.generatedImageUrl) {
      throw new Error(nanoBananaResult.error || 'Nano Banana generation failed');
    }

    console.log(`[${renderId}] ✓ Nano Banana generation complete!`);
    console.log(`[${renderId}] Generated image URL: ${nanoBananaResult.generatedImageUrl.substring(0, 80)}...`);

    // Mettre à jour avec l'image générée et marquer comme complété
    // L'utilisateur pourra choisir d'upscaler plus tard
    console.log(`[${renderId}] Updating database...`);
    
    const { data: updateData, error: updateError } = await supabase
      .from('renders')
      .update({
        generated_image_url: nanoBananaResult.generatedImageUrl,
        status: 'completed',
      })
      .eq('id', renderId)
      .select()
      .single();

    if (updateError) {
      console.error(`[${renderId}] ❌ Database update error:`, updateError);
    } else {
      console.log(`[${renderId}] ✓ Database updated successfully!`);
      console.log(`[${renderId}] Updated data:`, {
        id: updateData?.id,
        status: updateData?.status,
        has_generated_url: !!updateData?.generated_image_url
      });
    }
    
    // Vérifier immédiatement que la mise à jour a fonctionné
    const { data: verifyData } = await supabase
      .from('renders')
      .select('status, generated_image_url')
      .eq('id', renderId)
      .single();
    
    console.log(`[${renderId}] Verification after update:`, {
      status: verifyData?.status,
      has_generated_url: !!verifyData?.generated_image_url
    });
  } catch (error) {
    console.error(`[${renderId}] Render failed:`, error);
    
    // Récupérer les metadata existantes pour ne pas les écraser
    const { data: existingRender } = await supabase
      .from('renders')
      .select('metadata')
      .eq('id', renderId)
      .single();
    
    await supabase
      .from('renders')
      .update({
        status: 'failed',
        metadata: { 
          ...((existingRender?.metadata as object) || {}),
          error: error instanceof Error ? error.message : 'Unknown error' 
        },
      })
      .eq('id', renderId);
  }
}

