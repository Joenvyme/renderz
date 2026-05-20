import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { generateWithNanoBanana } from '@/lib/api/nano-banana';
import {
  AspectRatio,
  ImageInput,
  ImageRole,
  ImageOutputSize,
  DEFAULT_IMAGE_OUTPUT_SIZE,
  MAX_INPUT_IMAGES,
  isValidAspectRatio,
  isValidImageOutputSize,
} from '@/lib/api/gemini-image-config';
import { upscaleWithMagnific } from '@/lib/api/magnific';
import {
  type GenerationPipeline,
  type MagnificAdjustMode,
  type MagnificScaleFactor,
  clampMagnificStyleValue,
  parseGenerationPipeline,
  parseMagnificAdjustMode,
  parseMagnificScale,
} from '@/lib/generation-pipeline';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getOrgContext } from '@/lib/org-context';
import { notifyRenderCompleted } from '@/lib/api/notifications';
import {
  assertCanStartImageRender,
  getMonthlyUsage,
  getOrCreateBillingAccountForUser,
  recordSuccessfulImageRender,
  type BillingAccountRow,
} from '@/lib/billing/service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification + récupérer le contexte d'organisation actif.
    const ctx = await getOrgContext();
    if (!ctx) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }
    // Cible Better Auth pour les helpers internes qui attendent encore `session`.
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Support pour l'ancien format (imageUrl) et le nouveau (images[])
    const {
      imageUrl,
      images,
      prompt,
      aspectRatio,
      imageSize,
      projectId,
      pipeline,
      /** @deprecated — préférer magnificResemblanceValue + magnificCreativityValue */
      magnificCreativity,
      magnificScale,
      magnificAdjustMode,
      magnificStyleValue,
      magnificResemblanceValue,
      magnificCreativityValue,
    } = body as {
      imageUrl?: string;
      images?: ImageInput[];
      prompt: string;
      aspectRatio?: AspectRatio;
      imageSize?: ImageOutputSize;
      projectId?: string;
      pipeline?: GenerationPipeline;
      magnificCreativity?: number;
      magnificScale?: number;
      magnificAdjustMode?: MagnificAdjustMode;
      magnificStyleValue?: number;
      magnificResemblanceValue?: number;
      magnificCreativityValue?: number;
    };

    const resolvedAspect: AspectRatio =
      aspectRatio && isValidAspectRatio(aspectRatio) ? aspectRatio : '1:1';
    const resolvedImageSize: ImageOutputSize =
      imageSize && isValidImageOutputSize(imageSize) ? imageSize : DEFAULT_IMAGE_OUTPUT_SIZE;
    const resolvedPipeline = parseGenerationPipeline(pipeline);

    let resolvedMagnificAdjustMode: MagnificAdjustMode = parseMagnificAdjustMode(magnificAdjustMode);
    let resolvedMagnificResemblance = clampMagnificStyleValue(magnificResemblanceValue ?? 0);
    let resolvedMagnificCreativity = clampMagnificStyleValue(magnificCreativityValue ?? 0);

    const hasDualAxes =
      magnificResemblanceValue !== undefined || magnificCreativityValue !== undefined;
    if (!hasDualAxes) {
      if (
        magnificStyleValue === undefined &&
        magnificAdjustMode === undefined &&
        magnificCreativity !== undefined
      ) {
        resolvedMagnificAdjustMode = 'creativity';
        resolvedMagnificCreativity = clampMagnificStyleValue(magnificCreativity);
        resolvedMagnificResemblance = 0;
      } else if (magnificStyleValue !== undefined || magnificCreativity !== undefined) {
        const single = clampMagnificStyleValue(magnificStyleValue ?? magnificCreativity ?? 0);
        if (resolvedMagnificAdjustMode === 'creativity') {
          resolvedMagnificCreativity = single;
          resolvedMagnificResemblance = 0;
        } else {
          resolvedMagnificResemblance = single;
          resolvedMagnificCreativity = 0;
        }
      }
    }
    const resolvedMagnificScale: MagnificScaleFactor = parseMagnificScale(magnificScale);

    // Normaliser: si imageUrl est fourni, le convertir en tableau images
    let normalizedImages: ImageInput[];
    if (images && images.length > 0) {
      normalizedImages = images;
    } else if (imageUrl) {
      normalizedImages = [{ url: imageUrl, role: 'main' as ImageRole }];
    } else {
      return NextResponse.json(
        { error: 'Missing images or imageUrl' },
        { status: 400 }
      );
    }

    /** Rôles uniquement par position (1 → main, 2 → style, 3 → reference) — l’UI ne les expose plus. */
    const ORDERED_ROLES: ImageRole[] = ['main', 'style', 'reference'];
    normalizedImages = normalizedImages.map((img, i) => ({
      url: img.url,
      role: ORDERED_ROLES[i] ?? 'reference',
    }));

    const promptTrimmed = typeof prompt === 'string' ? prompt.trim() : '';
    if (resolvedPipeline !== 'magnific' && !promptTrimmed) {
      return NextResponse.json(
        { error: 'Missing prompt' },
        { status: 400 }
      );
    }
    const promptForDb =
      promptTrimmed ||
      (resolvedPipeline === 'magnific' ? '3D render enhancement' : '');

    if (normalizedImages.length > MAX_INPUT_IMAGES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_INPUT_IMAGES} images autorisées` },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const billingAccount = await getOrCreateBillingAccountForUser(supabase, session.user.id);
    const usage = await getMonthlyUsage(supabase, billingAccount.id);
    const quota = assertCanStartImageRender(billingAccount, usage, session.user.email);
    if (quota) {
      return NextResponse.json(
        { error: quota.error, code: quota.code },
        { status: quota.status }
      );
    }

    if (resolvedPipeline === 'magnific') {
      const k = process.env.MAGNIFIC_API_KEY;
      if (!k || k === 'votre_cle_ici') {
        return NextResponse.json(
          {
            error:
              '3D render enhancement is not available. The administrator must configure the enhancement service.',
          },
          { status: 503 }
        );
      }
    }

    // Créer un enregistrement dans la DB avec l'ID utilisateur
    // Stocker l'URL de la première image comme original_image_url pour compatibilité
    const { data: render, error: dbError } = await supabase
      .from('renders')
      .insert({
        user_id: ctx.userId,
        organization_id: ctx.activeOrgId,
        visibility: 'private',
        original_image_url: normalizedImages[0].url,
        prompt: promptForDb,
        status: 'processing',
        project_id: projectId || null,
        metadata: {
          pipeline: resolvedPipeline,
          aspectRatio: resolvedAspect,
          imageSize: resolvedImageSize,
          ...(resolvedPipeline === 'magnific'
            ? {
                magnificScale: resolvedMagnificScale,
                magnificResemblanceValue: resolvedMagnificResemblance,
                magnificCreativityValue: resolvedMagnificCreativity,
                optimizedFor: '3d_renders',
              }
            : {}),
          images: normalizedImages,
          imageCount: normalizedImages.length,
        },
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

    // Matérialiser chaque image source dans la table `source_images` (best-effort, ne bloque pas la génération).
    // Dédoublonné par contrainte UNIQUE (user_id, url) — pas d'erreur si déjà présent.
    if (ctx.activeOrgId) {
      try {
        const rows = Array.from(
          new Set(
            normalizedImages
              .map((img) => img.url)
              .filter((u): u is string => typeof u === 'string' && u.length > 0)
          )
        ).map((url) => ({
          user_id: ctx.userId,
          organization_id: ctx.activeOrgId,
          visibility: 'private' as const,
          url,
        }));
        if (rows.length > 0) {
          const { error: srcErr } = await supabase
            .from('source_images')
            .upsert(rows, { onConflict: 'user_id,url', ignoreDuplicates: true });
          if (srcErr) console.warn('source_images upsert:', srcErr.message);
        }
      } catch (srcCatch) {
        console.warn('source_images upsert exception:', srcCatch);
      }
    }

    // Lancer la génération en arrière-plan (SANS upscaling automatique)
    processRender(render.id, normalizedImages, promptTrimmed, resolvedAspect, resolvedImageSize, {
      pipeline: resolvedPipeline,
      magnificScale: resolvedMagnificScale,
      magnificResemblanceValue: resolvedMagnificResemblance,
      magnificCreativityValue: resolvedMagnificCreativity,
      userName: session.user.name || '',
      userEmail: session.user.email || '',
      billingAccount,
    }).catch(console.error);

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

async function uploadRemoteUrlToGeneratedRendersBucket(
  supabase: SupabaseClient,
  sourceUrl: string
): Promise<string> {
  const res = await fetch(sourceUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch result image: ${res.statusText}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const fileName = `generated-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
  const filePath = `renders/${fileName}`;
  const { error } = await supabase.storage.from('generated-renders').upload(filePath, buf, {
    contentType: 'image/png',
    cacheControl: '3600',
  });
  if (error) {
    throw new Error(`Failed to upload generated image: ${error.message}`);
  }
  const { data: pub } = supabase.storage.from('generated-renders').getPublicUrl(filePath);
  return pub.publicUrl;
}

async function processRender(
  renderId: string,
  images: ImageInput[],
  prompt: string,
  aspectRatio: AspectRatio,
  imageSize: ImageOutputSize,
  userInfo: {
    pipeline: GenerationPipeline;
    magnificScale: MagnificScaleFactor;
    magnificResemblanceValue: number;
    magnificCreativityValue: number;
    userName: string;
    userEmail: string;
    billingAccount: BillingAccountRow;
  }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    let generatedUrl: string;

    if (userInfo.pipeline === 'magnific') {
      const creativity = userInfo.magnificCreativityValue;
      const resemblance = userInfo.magnificResemblanceValue;
      console.log(
        `[${renderId}] Magnific 3D — scale ${userInfo.magnificScale}x, resemblance ${resemblance}, creativity ${creativity} (Freepik: both params sent)`
      );
      const firstImage = images[0];
      console.log(`[${renderId}] Using image 1/primary: ${firstImage.url.substring(0, 60)}...`);

      const magnificResult = await upscaleWithMagnific({
        imageUrl: firstImage.url,
        scale: userInfo.magnificScale,
        creativity,
        resemblance,
        prompt,
        optimizedFor: '3d_renders',
      });

      if (!magnificResult.success || !magnificResult.upscaledImageUrl) {
        throw new Error(magnificResult.error || 'Magnific enhancement failed');
      }

      generatedUrl = await uploadRemoteUrlToGeneratedRendersBucket(
        supabase,
        magnificResult.upscaledImageUrl
      );
      console.log(`[${renderId}] ✓ Magnific result stored: ${generatedUrl.substring(0, 80)}...`);
    } else {
      console.log(`[${renderId}] Gemini (plan/sketch/photo) generation...`);
      console.log(`[${renderId}] Images: ${images.length} image(s)`);
      images.forEach((img, i) =>
        console.log(`[${renderId}]   ${i + 1}. ${img.url.substring(0, 50)}...`)
      );
      console.log(`[${renderId}] Prompt: ${prompt.substring(0, 50)}...`);
      console.log(`[${renderId}] Aspect Ratio: ${aspectRatio}`);
      console.log(`[${renderId}] Image size: ${imageSize}`);

      const nanoBananaResult = await generateWithNanoBanana({
        images,
        prompt,
        aspectRatio,
        imageSize,
      });

      if (!nanoBananaResult.success || !nanoBananaResult.generatedImageUrl) {
        throw new Error(nanoBananaResult.error || 'Nano Banana generation failed');
      }

      generatedUrl = nanoBananaResult.generatedImageUrl;
      console.log(`[${renderId}] ✓ Gemini generation complete!`);
    }

    console.log(`[${renderId}] Updating database...`);

    const { data: updateData, error: updateError } = await supabase
      .from('renders')
      .update({
        generated_image_url: generatedUrl,
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
        has_generated_url: !!updateData?.generated_image_url,
      });

      notifyRenderCompleted({
        userName: userInfo.userName,
        userEmail: userInfo.userEmail,
        renderId,
        imageUrl: generatedUrl,
      }).catch(() => {});

      await recordSuccessfulImageRender(
        supabase,
        userInfo.billingAccount,
        userInfo.userEmail
      );
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

