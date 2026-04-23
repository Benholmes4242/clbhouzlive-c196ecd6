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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const accountId = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
    const streamToken = Deno.env.get("CLOUDFLARE_STREAM_API_TOKEN");

    if (!accountId || !streamToken) {
      return new Response(JSON.stringify({ error: "Missing Cloudflare credentials" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: TusEndpointRequest = await req.json();
    const { fileName, fileSizeBytes, maxDurationSeconds = 3600, metadata = {} } = body;

    if (!fileName || !fileSizeBytes) {
      return new Response(JSON.stringify({ error: "Missing fileName or fileSizeBytes" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

      return new Response(
        JSON.stringify({
          error: `Cloudflare TUS error: ${response.status}`,
          details: errorText,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!uploadUrl) {
      console.error("❌ [TUS] No Location header in response");
      return new Response(JSON.stringify({ error: "No upload URL returned from Cloudflare" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`✅ [TUS] Upload URL created. streamId: ${streamMediaId}`);

    return new Response(
      JSON.stringify({
        success: true,
        uploadUrl,
        streamId: streamMediaId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [TUS] Error:", error);
    return new Response(JSON.stringify({ error: normalizeError(error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/**
 * UTF-8 safe base64 encoding. btoa() throws on chars outside Latin-1
 * (e.g. emoji, smart quotes), so we encode to UTF-8 bytes first.
 */
function safeB64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/**
 * Encode metadata for TUS Upload-Metadata header
 * Format: key1 base64value1,key2 base64value2
 * Keys are ASCII (TUS spec); values are UTF-8 base64 encoded.
 */
function encodeMetadata(metadata: Record<string, string>): string {
  return Object.entries(metadata)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key} ${safeB64(String(value))}`)
    .join(",");
}
