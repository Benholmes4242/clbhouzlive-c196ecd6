// TUS Resumable Upload Endpoint for Cloudflare Stream
// Provides a TUS-compatible upload URL for resumable video uploads
// Reference: https://developers.cloudflare.com/stream/uploading-videos/upload-video-file/#tus-specification

import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { normalizeError } from "../_shared/normalize-error.ts";

interface TusEndpointRequest {
  fileName: string;
  fileSizeBytes: number;
  maxDurationSeconds?: number;
  metadata?: Record<string, string>;
}

function jsonResponse(status: number, body: Record<string, unknown>) {
  console.log("Returning:", status, body);
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  try {
    const accountId = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
    const streamToken = Deno.env.get("CLOUDFLARE_STREAM_API_TOKEN");
    const apiToken = Deno.env.get("CLOUDFLARE_API_TOKEN");

    console.log("Env check:", {
      hasAccountId: !!accountId,
      hasStreamToken: !!streamToken,
      hasApiToken: !!apiToken,
    });

    if (!accountId || !streamToken) {
      return jsonResponse(500, { error: "Missing Cloudflare credentials" });
    }

    const body: TusEndpointRequest = await req.json();
    console.log("[TUS] Request body:", body);

    const { fileName, fileSizeBytes, maxDurationSeconds = 3600, metadata = {} } = body;

    if (!fileName || !fileSizeBytes) {
      return jsonResponse(400, { error: "Missing fileName or fileSizeBytes" });
    }

    console.log(
      `🎬 [TUS] Creating TUS upload for: ${fileName} (${Math.round(fileSizeBytes / 1024 / 1024)}MB)`
    );

    const encodedMetadata = encodeMetadata({
      name: fileName,
      maxDurationSeconds: maxDurationSeconds.toString(),
      ...metadata,
    });

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream?direct_user=true`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${streamToken}`,
          "Tus-Resumable": "1.0.0",
          "Upload-Length": fileSizeBytes.toString(),
          "Upload-Metadata": encodedMetadata,
        },
      }
    );

    const uploadUrl = response.headers.get("Location");
    const streamMediaId = response.headers.get("stream-media-id");

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [TUS] Cloudflare error:", response.status, errorText);

      return jsonResponse(response.status, {
        error: `Cloudflare TUS error: ${response.status}`,
        details: errorText,
      });
    }

    if (!uploadUrl) {
      console.error("❌ [TUS] No Location header in response");
      return jsonResponse(500, { error: "No upload URL returned from Cloudflare" });
    }

    console.log(`✅ [TUS] Upload URL created. streamId: ${streamMediaId}`);

    return jsonResponse(200, {
      success: true,
      uploadUrl,
      streamId: streamMediaId,
    });
  } catch (error) {
    console.error("❌ [TUS] Error:", error);
    return jsonResponse(500, { error: normalizeError(error).message });
  }
});

/**
 * Encode metadata for TUS Upload-Metadata header
 * Format: key1 base64value1,key2 base64value2
 */
function encodeMetadata(metadata: Record<string, string>): string {
  return Object.entries(metadata)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key} ${btoa(String(value))}`)
    .join(",");
}
