// supabase/functions/cloudflare-stream-upload/index.ts
import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { normalizeError } from "../_shared/normalize-error.ts";

type DirectUploadRequest = {
  fileName: string;
  fileSize: number;
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const accountId = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
    // Accept either CLOUDFLARE_STREAM_API_TOKEN (preferred) or CLOUDFLARE_API_TOKEN (fallback)
    const streamToken =
      Deno.env.get("CLOUDFLARE_STREAM_API_TOKEN") ?? Deno.env.get("CLOUDFLARE_API_TOKEN");

    if (!accountId) {
      return new Response(JSON.stringify({ error: "Missing CLOUDFLARE_ACCOUNT_ID" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!streamToken) {
      return new Response(JSON.stringify({ error: "Missing CLOUDFLARE_STREAM_API_TOKEN or CLOUDFLARE_API_TOKEN" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --------------------
    // POST: Pattern A - create one-time direct upload URL
    // --------------------
    if (req.method === "POST") {
      let body: DirectUploadRequest;

      try {
        body = (await req.json()) as DirectUploadRequest;
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const fileName = String(body?.fileName ?? "").trim();
      const fileSize = Number(body?.fileSize ?? 0);

      if (!fileName || !Number.isFinite(fileSize) || fileSize <= 0) {
        return new Response(JSON.stringify({ error: "Missing or invalid fileName/fileSize" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(
        `🎬 Creating Cloudflare Stream direct upload URL for: ${fileName} (${Math.round(
          fileSize / 1024 / 1024,
        )}MB)`,
      );

      // Max video duration - configurable constant
      const MAX_VIDEO_DURATION_SECONDS = 3600; // 1 hour

      const cfResp = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${streamToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            maxDurationSeconds: MAX_VIDEO_DURATION_SECONDS,
            meta: { name: fileName },
          }),
        },
      );

      const cfJson = await cfResp.json();

      if (
        !cfResp.ok ||
        !cfJson?.success ||
        !cfJson?.result?.uploadURL ||
        !cfJson?.result?.uid
      ) {
        console.error("❌ Cloudflare direct_upload failed:", {
          status: cfResp.status,
          errors: cfJson?.errors,
          messages: cfJson?.messages,
        });

        return new Response(
          JSON.stringify({
            error:
              cfJson?.errors?.[0]?.message ||
              `Cloudflare direct upload failed (${cfResp.status})`,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const { uploadURL, uid } = cfJson.result;

      console.log("✅ Direct upload URL created. uid:", uid);

      // Client expects: { uploadURL, uid }
      return new Response(JSON.stringify({ uploadURL, uid }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --------------------
    // GET: fetch video status/details
    // /functions/v1/cloudflare-stream-upload?videoId=<uid>
    // --------------------
    if (req.method === "GET") {
      const url = new URL(req.url);
      const videoId = url.searchParams.get("videoId");

      if (!videoId) {
        return new Response(JSON.stringify({ error: "Video ID required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("📥 Fetching Cloudflare Stream video details for ID:", videoId);

      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${videoId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${streamToken}`,
          },
        },
      );

      const result = await response.json();
      console.log("📥 Video details response:", {
        ok: response.ok,
        success: result?.success,
        errors: result?.errors,
      });

      if (!response.ok || !result?.success || !result?.result) {
        return new Response(
          JSON.stringify({
            error: "Failed to fetch video details",
            details: result?.errors,
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const video = result.result;

      return new Response(
        JSON.stringify({
          success: true,
          video: {
            uid: video.uid,
            thumbnail: video.thumbnail,
            playback: video.playback,
            status: video.status,
          },
          urls: {
            hls: video?.playback?.hls,
            dash: video?.playback?.dash,
            thumbnail: video.thumbnail,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in cloudflare-stream-upload function:", error);
    return new Response(JSON.stringify({ error: normalizeError(error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
