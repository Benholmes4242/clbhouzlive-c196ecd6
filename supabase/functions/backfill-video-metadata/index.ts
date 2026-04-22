import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CloudflareStreamMetadata {
  uid: string;
  input?: {
    width?: number;
    height?: number;
  };
  duration?: number;
  preview?: string;
}

async function fetchStreamMetadata(streamId: string, accountId: string, token: string, retries = 0): Promise<CloudflareStreamMetadata | null> {
  const maxRetries = 5;
  const baseDelay = 1000;

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${streamId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (response.status === 429 || response.status >= 500) {
      if (retries < maxRetries) {
        const jitter = Math.random() * 500;
        const delay = baseDelay * Math.pow(2, retries) + jitter;
        console.log(`[backfill] Rate limited or server error, retry ${retries + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchStreamMetadata(streamId, accountId, token, retries + 1);
      }
      throw new Error(`Failed after ${maxRetries} retries: ${response.status}`);
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error(`[backfill] CF Stream API error for ${streamId}:`, response.status, errorText);
      return null;
    }

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error(`[backfill] Error fetching stream metadata for ${streamId}:`, error);
    return null;
  }
}

function extractStreamId(mediaUrl: string): string | null {
  // Handle various Cloudflare Stream URL formats
  const patterns = [
    /videodelivery\.net\/([a-f0-9]+)\//i,
    /cloudflarestream\.com\/([a-f0-9]+)\//i,
    /customer-[^.]+\.cloudflarestream\.com\/([a-f0-9]+)\//i,
  ];

  for (const pattern of patterns) {
    const match = mediaUrl.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

// Helper: build absolute URL from possibly relative path
function toAbsoluteUrl(base: string, path: string) {
  try {
    return new URL(path, base).href;
  } catch (_) {
    return path;
  }
}

// Helper: extract customer domain from a media URL
function getCustomerHostname(mediaUrl: string): string | null {
  try {
    const u = new URL(mediaUrl);
    return u.hostname || null;
  } catch (_) {
    return null;
  }
}

// Fallback: parse HLS playlists to infer width/height and duration
async function fetchHLSMetadata(mediaUrl: string, streamId: string): Promise<{ width: number; height: number; durationSeconds: number | null; posterUrl: string | null } | null> {
  try {
    // Master playlist URL
    const masterUrl = mediaUrl.includes('/manifest/')
      ? mediaUrl
      : `https://${getCustomerHostname(mediaUrl) ?? 'customer.cloudflarestream.com'}/${streamId}/manifest/video.m3u8`;

    const masterRes = await fetch(masterUrl);
    if (!masterRes.ok) {
      console.warn(`[backfill][HLS] Failed to fetch master m3u8 for ${streamId}: ${masterRes.status}`);
      return null;
    }
    const masterText = await masterRes.text();
    const lines = masterText.split(/\r?\n/);

    type Variant = { width: number; height: number; url: string };
    const variants: Variant[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('#EXT-X-STREAM-INF:')) {
        const next = lines[i + 1] || '';
        const resMatch = line.match(/RESOLUTION=(\d+)x(\d+)/i);
        if (resMatch) {
          const w = parseInt(resMatch[1], 10);
          const h = parseInt(resMatch[2], 10);
          const variantUrl = toAbsoluteUrl(masterUrl, next.trim());
          variants.push({ width: w, height: h, url: variantUrl });
        }
      }
    }

    if (variants.length === 0) {
      console.warn(`[backfill][HLS] No variants found in master for ${streamId}`);
      return null;
    }

    // Pick the highest width variant
    variants.sort((a, b) => b.width - a.width);
    const chosen = variants[0];

    // Sum durations from variant playlist
    let durationSeconds: number | null = null;
    try {
      const varRes = await fetch(chosen.url);
      if (varRes.ok) {
        const varText = await varRes.text();
        const durMatches = varText.match(/#EXTINF:([0-9.]+)/g) || [];
        const total = durMatches.reduce((acc, m) => acc + parseFloat(m.split(':')[1]), 0);
        durationSeconds = Math.round(total);
      }
    } catch (e) {
      console.warn(`[backfill][HLS] Failed to parse variant durations for ${streamId}:`, e);
    }

    const hostname = getCustomerHostname(mediaUrl);
    const posterUrl = hostname 
      ? `https://${hostname}/${streamId}/thumbnails/thumbnail.jpg?time=1s&height=720`
      : null;

    return { width: chosen.width, height: chosen.height, durationSeconds, posterUrl };
  } catch (e) {
    console.error('[backfill][HLS] Unexpected error:', e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const cfAccountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
    const cfApiToken = Deno.env.get('CLOUDFLARE_API_TOKEN') || Deno.env.get('CLOUDFLARE_STREAM_API_TOKEN');

    if (!cfAccountId || !cfApiToken) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing Cloudflare credentials',
          message: 'Please configure CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN (or CLOUDFLARE_STREAM_API_TOKEN) secrets'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all videos missing metadata
    const { data: videos, error: fetchError } = await supabase
      .from('post_media')
      .select('id, media_url, stream_id')
      .eq('media_type', 'video')
      .or('width.is.null,height.is.null,aspect_ratio.is.null,duration_seconds.is.null,duration_ms.is.null');

    if (fetchError) {
      throw fetchError;
    }

    if (!videos || videos.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No videos need metadata backfill',
          processed: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`[backfill] Starting backfill for ${videos.length} videos`);

    let successCount = 0;
    let failureCount = 0;
    const results = [];

    // Process videos with rate limiting (5 per second max)
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      
      // Extract stream ID from URL or use stored stream_id
      let streamId = video.stream_id;
      if (!streamId) {
        streamId = extractStreamId(video.media_url);
      }

      if (!streamId) {
        console.warn(`[backfill] No stream ID found for video ${video.id}`);
        failureCount++;
        results.push({ id: video.id, status: 'failed', reason: 'No stream ID' });
        continue;
      }

      // Fetch metadata from Cloudflare
      const metadata = await fetchStreamMetadata(streamId, cfAccountId, cfApiToken);

      let width: number | undefined;
      let height: number | undefined;
      let durationSeconds: number | null = null;
      let posterUrl: string | null = null;

      if (metadata?.input?.width && metadata?.input?.height) {
        width = metadata.input.width;
        height = metadata.input.height;
        durationSeconds = metadata.duration ? Math.round(metadata.duration) : null;
        posterUrl = metadata.preview || null;
      } else {
        // Fallback to HLS manifest parsing
        const hlsMeta = await fetchHLSMetadata(video.media_url, streamId);
        if (hlsMeta) {
          width = hlsMeta.width;
          height = hlsMeta.height;
          durationSeconds = hlsMeta.durationSeconds;
          posterUrl = hlsMeta.posterUrl;
        }
      }

      if (!width || !height) {
        console.warn(`[backfill] No dimensions for video ${video.id} (stream: ${streamId}) via CF or HLS`);
        failureCount++;
        results.push({ id: video.id, status: 'failed', reason: 'No dimensions from CF/HLS' });
        continue;
      }

      const aspectRatio = parseFloat((width / height).toFixed(4));

      // Update database
      const { error: updateError } = await supabase
        .from('post_media')
        .update({
          width,
          height,
          aspect_ratio: aspectRatio,
          duration_seconds: durationSeconds,
          duration_ms: durationSeconds != null ? durationSeconds * 1000 : null,
          poster_url: posterUrl,
          stream_id: streamId
        })
        .eq('id', video.id);

      if (updateError) {
        console.error(`[backfill] Error updating video ${video.id}:`, updateError);
        failureCount++;
        results.push({ id: video.id, status: 'failed', reason: updateError.message });
      } else {
        successCount++;
        results.push({ 
          id: video.id, 
          status: 'success',
          width,
          height,
          aspectRatio,
          durationSeconds
        });
      }

      // Rate limiting: 5 requests per second
      if ((i + 1) % 5 === 0 && i < videos.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`[backfill] Complete: ${successCount} success, ${failureCount} failures`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Backfill complete: ${successCount} videos updated, ${failureCount} failed`,
        total: videos.length,
        successCount,
        failureCount,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[backfill] Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
