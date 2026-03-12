/**
 * Google Gemini Video Generation (Veo) — REST-based.
 * Uses the same fetch + API-key pattern that already works for image generation.
 *
 * Docs: https://ai.google.dev/gemini-api/docs/video
 */

import { MOCK_MODE, delay } from "./mock-mode";

const BASE = "https://generativelanguage.googleapis.com/v1beta";

interface GoogleVideoRequest {
  imageUrl: string;
  prompt: string;
  durationSeconds?: number;
}

interface GoogleVideoResponse {
  success: boolean;
  videoUrl?: string;
  videoBytes?: Buffer;
  error?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getApiKey(): string {
  const key = process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) throw new Error("Missing GOOGLE_GEMINI_API_KEY for Gemini Veo.");
  return key;
}

function getModel(): string {
  return process.env.GOOGLE_VIDEO_MODEL || "veo-3.1-fast-generate-preview";
}

/**
 * Download an image from a URL and return it as a base64-encoded string.
 */
async function fetchImageAsBase64(url: string): Promise<{ bytesBase64Encoded: string; mimeType: string } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const mimeType = res.headers.get("content-type") || "image/jpeg";
    const bytesBase64Encoded = Buffer.from(buffer).toString("base64");
    return { bytesBase64Encoded, mimeType };
  } catch {
    console.warn("[Veo] Could not fetch reference image, will use text-to-video.");
    return null;
  }
}

/** POST to start the long-running video generation operation. */
async function startGeneration(prompt: string, imageUrl?: string): Promise<any> {
  const apiKey = getApiKey();
  const model = getModel();
  const url = `${BASE}/models/${model}:predictLongRunning?key=${apiKey}`;

  // Build the instance — add image as base64 if available
  const instance: any = { prompt };

  if (imageUrl) {
    const imageData = await fetchImageAsBase64(imageUrl);
    if (imageData) {
      instance.image = {
        bytesBase64Encoded: imageData.bytesBase64Encoded,
        mimeType: imageData.mimeType,
      };
      console.log(`[Veo] Starting image-to-video generation with model=${model}`);
    } else {
      console.log(`[Veo] Starting text-to-video generation (image fetch failed) with model=${model}`);
    }
  } else {
    console.log(`[Veo] Starting text-to-video generation with model=${model}`);
  }

  const body = {
    instances: [instance],
    parameters: {
      sampleCount: 1,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    // If the image format is rejected, retry without image (text-to-video)
    if (text.toLowerCase().includes("image") && instance.image) {
      console.log("[Veo] Image not supported by this model/format, retrying text-to-video...");
      delete instance.image;
      const retryRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instances: [instance], parameters: { sampleCount: 1 } }),
      });
      if (!retryRes.ok) {
        const retryText = await retryRes.text();
        throw new Error(`Veo start failed (${retryRes.status}): ${retryText}`);
      }
      return retryRes.json();
    }
    throw new Error(`Veo start failed (${res.status}): ${text}`);
  }

  return res.json();
}

/** Poll a long-running operation by name until it's done. */
async function pollOperation(operationName: string, maxAttempts = 80): Promise<any> {
  const apiKey = getApiKey();

  for (let i = 0; i < maxAttempts; i++) {
    await delay(5000);
    console.log(`[Veo] Polling operation (attempt ${i + 1}/${maxAttempts})...`);

    const res = await fetch(`${BASE}/${operationName}?key=${apiKey}`);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Veo poll failed (${res.status}): ${text}`);
    }

    const op = await res.json();
    if (op.done) {
      console.log("[Veo] Operation complete!");
      return op;
    }
  }

  throw new Error("Video generation timed out after polling.");
}

/**
 * Download video from a Google-signed URI and return as a Buffer.
 * This avoids storing the Google URL (which contains the API key) in the DB.
 */
async function downloadVideoFromGoogle(videoUri: string): Promise<Buffer> {
  const apiKey = getApiKey();
  const downloadUrl = videoUri.includes("?")
    ? `${videoUri}&key=${apiKey}`
    : `${videoUri}?key=${apiKey}`;

  console.log("[Veo] Downloading generated video from Google...");
  const res = await fetch(downloadUrl);
  if (!res.ok) {
    throw new Error(`Failed to download video from Google (${res.status})`);
  }
  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer);
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function generateVideoWithGoogle(
  request: GoogleVideoRequest
): Promise<GoogleVideoResponse> {
  // ---- Mock mode (local testing without real API) ----
  if (MOCK_MODE) {
    await delay(4000);
    return {
      success: true,
      videoUrl:
        "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    };
  }

  try {
    // Build a rich prompt optimized for architectural / interior render animation
    const basePrompt = request.prompt?.trim() || "";
    const videoPrompt = basePrompt
      ? `${basePrompt}. Animate this architectural render with a smooth cinematic camera dolly, realistic lighting and subtle ambient motion. Keep the scene photorealistic.`
      : "Smooth cinematic camera dolly through a photorealistic architectural interior with realistic lighting, soft shadows, and subtle ambient motion.";

    // 1. Start the generation job (image-to-video if image provided, text-to-video fallback)
    const startResult = await startGeneration(videoPrompt, request.imageUrl);

    // Google returns an operation name for long-running jobs
    const operationName: string | undefined = startResult.name;
    let result = startResult;

    // 2. Poll if the operation is not done yet
    if (operationName && !startResult.done) {
      result = await pollOperation(operationName);
    }

    // 3. Extract the video URI from the response
    const videoUri =
      result?.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ||
      result?.response?.generatedVideos?.[0]?.video?.uri ||
      result?.response?.generatedVideos?.[0]?.video?.url ||
      result?.generatedVideos?.[0]?.video?.uri ||
      null;

    if (!videoUri) {
      console.error("[Veo] Full response (no video URI found):", JSON.stringify(result, null, 2));
      throw new Error("No video URI returned by Gemini Veo API.");
    }

    // 4. Download the video bytes so we don't store the Google URL (contains API key)
    const videoBytes = await downloadVideoFromGoogle(videoUri);
    console.log(`[Veo] Video downloaded successfully (${(videoBytes.length / 1024 / 1024).toFixed(1)} MB)`);

    return { success: true, videoBytes };
  } catch (error) {
    console.error("Google video generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown video generation error",
    };
  }
}
