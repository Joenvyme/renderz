import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { upscaleWithMagnific } from '@/lib/api/magnific';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { isBillingUnlimitedEmail } from '@/lib/billing/constants';
import {
  assertCanUpscale,
  getMonthlyUsage,
  getOrCreateBillingAccountForUser,
  recordSuccessfulUpscale,
  type BillingAccountRow,
} from '@/lib/billing/service';
import {
  type MagnificAdjustMode,
  clampMagnificStyleValue,
  parseMagnificAdjustMode,
  parseMagnificScale,
} from '@/lib/generation-pipeline';

function resolveUpscaleResemblanceCreativity(body: {
  scale?: number;
  creativity?: number;
  magnificAdjustMode?: MagnificAdjustMode;
  magnificStyleValue?: number;
  magnificResemblanceValue?: number;
  magnificCreativityValue?: number;
}): { res: number; cre: number } {
  const {
    creativity: bodyCreativity,
    magnificAdjustMode,
    magnificStyleValue,
    magnificResemblanceValue,
    magnificCreativityValue,
  } = body;

  const hasDual =
    magnificResemblanceValue !== undefined || magnificCreativityValue !== undefined;
  if (hasDual) {
    return {
      res: clampMagnificStyleValue(magnificResemblanceValue ?? 0),
      cre: clampMagnificStyleValue(magnificCreativityValue ?? 0),
    };
  }

  let mode = parseMagnificAdjustMode(magnificAdjustMode);
  let style = clampMagnificStyleValue(magnificStyleValue);
  if (
    magnificStyleValue === undefined &&
    magnificAdjustMode === undefined &&
    bodyCreativity !== undefined
  ) {
    mode = 'creativity';
    style = clampMagnificStyleValue(bodyCreativity);
  }
  if (mode === 'creativity') {
    return { res: 0, cre: style };
  }
  return { res: style, cre: 0 };
}

export const dynamic = 'force-dynamic';

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
    const { renderId, scale = 4, ...rest } = body as {
      renderId: string;
      scale?: number;
      creativity?: number;
      magnificAdjustMode?: MagnificAdjustMode;
      magnificStyleValue?: number;
      magnificResemblanceValue?: number;
      magnificCreativityValue?: number;
    };

    const { res: upscaleRes, cre: upscaleCre } = resolveUpscaleResemblanceCreativity({
      scale,
      ...rest,
    });
    const resolvedScale = parseMagnificScale(scale);

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

    const billingAccount = await getOrCreateBillingAccountForUser(supabase, session.user.id);
    const usage = await getMonthlyUsage(supabase, billingAccount.id);
    const quota = assertCanUpscale(billingAccount, usage, session.user.email);
    if (quota) {
      return NextResponse.json({ error: quota.error, code: quota.code }, { status: quota.status });
    }

    if (!render.generated_image_url) {
      return NextResponse.json(
        { error: 'No generated image to upscale' },
        { status: 400 }
      );
    }

    if (render.status === 'upscaling') {
      return NextResponse.json(
        { error: 'Upscale déjà en cours pour ce rendu.', code: 'UPSCALE_IN_PROGRESS' },
        { status: 409 }
      );
    }

    const billingUnlimited = isBillingUnlimitedEmail(session.user.email);
    // Comptes illimités : nouvel upscale possible (réglages différents, nouvelle sortie) ; les autres : 1× 4K par rendu.
    if (
      !billingUnlimited &&
      render.upscaled_image_url &&
      render.upscaled_image_url !== render.generated_image_url
    ) {
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
          upscale_scale: resolvedScale,
          upscale_resemblance: upscaleRes,
          upscale_creativity: upscaleCre,
        },
      })
      .eq('id', renderId);

    // Lancer l'upscaling en arrière-plan
    processUpscale(renderId, render.generated_image_url, resolvedScale, upscaleRes, upscaleCre, {
      billingAccount,
      userEmail: session.user.email || '',
      prompt: typeof render.prompt === 'string' ? render.prompt : null,
    }).catch(console.error);

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

async function processUpscale(
  renderId: string,
  imageUrl: string,
  scale: number,
  resemblance: number,
  creativity: number,
  billingCtx: {
    billingAccount: BillingAccountRow;
    userEmail: string;
    prompt: string | null;
  }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    console.log(
      `[${renderId}] Starting Magnific upscaling (${scale}x, resemblance ${resemblance}, creativity ${creativity})...`
    );
    console.log(`[${renderId}] Image URL: ${imageUrl.substring(0, 80)}...`);

    const magnificResult = await upscaleWithMagnific({
      imageUrl,
      scale,
      creativity,
      resemblance,
      prompt: billingCtx.prompt?.trim() || undefined,
      optimizedFor: '3d_renders',
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

    const { data: parent, error: parentErr } = await supabase
      .from('renders')
      .select('*')
      .eq('id', renderId)
      .single();

    if (parentErr || !parent) {
      throw new Error(parentErr?.message || 'Parent render missing after upscale');
    }

    const baseMeta =
      parent.metadata && typeof parent.metadata === 'object' && !Array.isArray(parent.metadata)
        ? { ...(parent.metadata as Record<string, unknown>) }
        : {};

    const childMeta: Record<string, unknown> = { ...baseMeta };
    delete childMeta.favorite;
    delete childMeta.upscale_started_at;
    delete childMeta.upscale_error;
    delete childMeta.upscale_failed_at;
    delete childMeta.upscale_exported_render_id;
    delete childMeta.upscale_exported_at;
    childMeta.upscale_source_render_id = parent.id;
    childMeta.upscale_completed_at = new Date().toISOString();
    childMeta.upscale_size_kb = magnificImageSizeKB;
    childMeta.magnificScale = scale;
    childMeta.upscale_resemblance = resemblance;
    childMeta.upscale_creativity = creativity;

    const { data: inserted, error: insertErr } = await supabase
      .from('renders')
      .insert({
        user_id: parent.user_id,
        project_id: parent.project_id,
        original_image_url: parent.generated_image_url || parent.original_image_url,
        prompt: typeof parent.prompt === 'string' ? parent.prompt : '',
        generated_image_url: finalUpscaledUrl,
        upscaled_image_url: null,
        status: 'completed',
        metadata: childMeta,
      })
      .select('id')
      .single();

    if (insertErr || !inserted?.id) {
      console.error(`[${renderId}] Insert upscale render:`, insertErr);
      throw new Error(insertErr?.message || 'Failed to create portfolio render for upscale');
    }

    const parentMeta: Record<string, unknown> = { ...baseMeta };
    delete parentMeta.upscale_started_at;
    delete parentMeta.upscale_scale;
    delete parentMeta.upscale_resemblance;
    delete parentMeta.upscale_creativity;
    parentMeta.upscale_exported_render_id = inserted.id;
    parentMeta.upscale_exported_at = new Date().toISOString();

    const { error: finalUpdateError } = await supabase
      .from('renders')
      .update({
        upscaled_image_url: null,
        status: 'completed',
        metadata: parentMeta,
      })
      .eq('id', renderId);

    if (finalUpdateError) {
      console.error(`[${renderId}] Final parent update error:`, finalUpdateError);
    } else {
      await recordSuccessfulUpscale(
        supabase,
        billingCtx.billingAccount,
        billingCtx.userEmail
      );
    }

    console.log(
      `[${renderId}] ✓ Upscaling completed — new render ${inserted.id} (portfolio), parent kept as HD.`
    );
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




