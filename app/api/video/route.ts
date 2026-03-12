import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { generateVideoWithGoogle } from "@/lib/api/google-video";

interface RenderMetadata {
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { renderId, prompt } = body as { renderId?: string; prompt?: string };

    if (!renderId) {
      return NextResponse.json({ error: "Missing renderId" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: render, error: fetchError } = await supabase
      .from("renders")
      .select("id, user_id, generated_image_url, metadata")
      .eq("id", renderId)
      .eq("user_id", session.user.id)
      .single();

    if (fetchError || !render) {
      return NextResponse.json({ error: "Render not found or access denied" }, { status: 404 });
    }

    if (!render.generated_image_url) {
      return NextResponse.json({ error: "Render has no generated image to animate" }, { status: 400 });
    }

    const metadata =
      render.metadata && typeof render.metadata === "object" && !Array.isArray(render.metadata)
        ? (render.metadata as RenderMetadata)
        : {};

    if (metadata.video_status === "processing") {
      return NextResponse.json({ error: "A video is already being generated for this render" }, { status: 409 });
    }

    const videoPrompt =
      prompt?.trim() ||
      "Create a smooth cinematic camera move with realistic lighting and subtle motion.";

    await supabase
      .from("renders")
      .update({
        metadata: {
          ...metadata,
          video_status: "processing",
          video_prompt: videoPrompt,
          video_error: null,
          video_started_at: new Date().toISOString(),
        },
      })
      .eq("id", renderId);

    processVideoGeneration(renderId, render.generated_image_url, videoPrompt).catch((error) => {
      console.error("Background video generation error:", error);
    });

    return NextResponse.json({
      success: true,
      status: "processing",
      message: "Video generation started",
    });
  } catch (error) {
    console.error("Video generation route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function processVideoGeneration(renderId: string, imageUrl: string, prompt: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const result = await generateVideoWithGoogle({
      imageUrl,
      prompt,
      durationSeconds: 5,
    });

    const { data: current } = await supabase
      .from("renders")
      .select("metadata")
      .eq("id", renderId)
      .single();

    const metadata =
      current?.metadata && typeof current.metadata === "object" && !Array.isArray(current.metadata)
        ? (current.metadata as RenderMetadata)
        : {};

    if (!result.success || (!result.videoUrl && !result.videoBytes)) {
      await supabase
        .from("renders")
        .update({
          metadata: {
            ...metadata,
            video_status: "failed",
            video_error: result.error || "Video generation failed",
            video_completed_at: new Date().toISOString(),
          },
        })
        .eq("id", renderId);
      return;
    }

    let finalVideoUrl = result.videoUrl;

    // If Gemini only returned bytes, upload to Supabase storage and use public URL.
    if (!finalVideoUrl && result.videoBytes) {
      const bucketName = "generated-videos";

      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some((bucket) => bucket.name === bucketName);
      if (!bucketExists) {
        await supabase.storage.createBucket(bucketName, { public: true });
      }

      const filePath = `videos/${renderId}-${Date.now()}.mp4`;
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, result.videoBytes, {
          contentType: "video/mp4",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Failed to upload generated video: ${uploadError.message}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      finalVideoUrl = publicUrlData.publicUrl;
    }

    await supabase
      .from("renders")
      .update({
        metadata: {
          ...metadata,
          video_status: "completed",
          video_url: finalVideoUrl,
          video_error: null,
          video_completed_at: new Date().toISOString(),
        },
      })
      .eq("id", renderId);
  } catch (error) {
    console.error("Video generation processing error:", error);
    const { data: current } = await supabase
      .from("renders")
      .select("metadata")
      .eq("id", renderId)
      .single();

    const metadata =
      current?.metadata && typeof current.metadata === "object" && !Array.isArray(current.metadata)
        ? (current.metadata as RenderMetadata)
        : {};

    await supabase
      .from("renders")
      .update({
        metadata: {
          ...metadata,
          video_status: "failed",
          video_error: error instanceof Error ? error.message : "Unknown video generation error",
          video_completed_at: new Date().toISOString(),
        },
      })
      .eq("id", renderId);
  }
}

