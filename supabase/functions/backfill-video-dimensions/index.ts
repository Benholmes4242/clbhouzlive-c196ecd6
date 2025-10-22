import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CF_ACCOUNT_ID = 'a1b264d44ddbe2b5127bb6ff5c274108';

interface PostMediaRow {
  id: string;
  media_type: string;
  media_url: string | null;
  stream_id: string | null;
  width: number | null;
  height: number | null;
  aspect_ratio: number | null;
  duration_seconds: number | null;
}

interface CloudflareStreamResponse {
  success: boolean;
  result?: {
    uid: string;
    input?: {
      width: number;
      height: number;
    };
    playback?: {
      hls?: string;
      dash?: string;
    };
    preview?: string;
    thumbnail?: string;
    status?: {
      state: string;
      errorReasonCode?: string;
      errorReasonText?: string;
    };
    meta?: {
      name?: string;
    };
    duration?: number;
  };
  errors?: Array<{ message: string }>;
}

// Extract Cloudflare Stream UID from various URL formats
function extractStreamId(url: string | null, streamId: string | null): string | null {
  if (streamId) return streamId;
  if (!url) return null;
  
  // Match patterns:
  // - https://customer-xxx.cloudflarestream.com/{uid}/manifest/video.m3u8
  // - https://videodelivery.net/{uid}/manifest/video.m3u8
  // - https://customer-xxx.cloudflarestream.com/{uid}/...
  const patterns = [
    /cloudflarestream\.com\/([a-f0-9]+)\//i,
    /videodelivery\.net\/([a-f0-9]+)\//i,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  
  return null;
}

// Fetch video metadata from Cloudflare Stream API
async function getCloudflareStreamMetadata(uid: string, apiToken: string): Promise<CloudflareStreamResponse> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/${uid}`;
  
  console.log(`[Cloudflare Stream API] Fetching metadata for ${uid}`);
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    console.error(`[Cloudflare Stream API] Failed: ${response.status} ${response.statusText}`);
    throw new Error(`Cloudflare Stream API failed: ${response.status}`);
  }
  
  const data = await response.json();
  return data;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiToken = Deno.env.get('CLOUDFLARE_STREAM_API_TOKEN');
    if (!apiToken) {
      console.error('[Backfill] Missing CLOUDFLARE_STREAM_API_TOKEN secret');
      return new Response(
        JSON.stringify({ 
          error: 'CLOUDFLARE_STREAM_API_TOKEN not configured',
          message: 'Please add the Cloudflare Stream API token secret to continue'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for batch size (default 50)
    const body = await req.json().catch(() => ({}));
    const batchSize = Math.min(body.batchSize || 50, 100); // Max 100 per run
    const dryRun = body.dryRun === true;

    console.log(`[Backfill] Starting batch (size: ${batchSize}, dryRun: ${dryRun})`);

    // Fetch videos with missing dimensions
    const { data: rows, error: fetchError } = await supabase
      .from('post_media')
      .select('id, media_type, media_url, stream_id, width, height, aspect_ratio, duration_seconds')
      .eq('media_type', 'video')
      .or('width.is.null,height.is.null,aspect_ratio.is.null')
      .limit(batchSize);

    if (fetchError) {
      console.error('[Backfill] Fetch error:', fetchError);
      throw fetchError;
    }

    if (!rows || rows.length === 0) {
      console.log('[Backfill] No rows to process ✅');
      return new Response(
        JSON.stringify({ 
          processed: 0, 
          updated: 0, 
          skipped: 0, 
          failed: 0,
          message: 'All videos have dimensions - backfill complete!'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processed = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    const errors: Array<{ id: string; reason: string }> = [];

    // Process each row
    for (const row of rows as PostMediaRow[]) {
      processed++;
      
      try {
        // Extract stream ID
        const uid = extractStreamId(row.media_url, row.stream_id);
        if (!uid) {
          console.warn(`[Backfill] Row ${row.id}: No stream ID found`);
          skipped++;
          errors.push({ id: row.id, reason: 'No stream ID' });
          continue;
        }

        // Fetch metadata from Cloudflare
        const metadata = await getCloudflareStreamMetadata(uid, apiToken);
        
        if (!metadata.success || !metadata.result?.input) {
          console.warn(`[Backfill] Row ${row.id}: No input metadata from Cloudflare`);
          skipped++;
          errors.push({ id: row.id, reason: 'No input metadata' });
          continue;
        }

        const width = metadata.result.input.width;
        const height = metadata.result.input.height;
        const duration = metadata.result.duration;

        if (!width || !height) {
          console.warn(`[Backfill] Row ${row.id}: Missing width or height`);
          skipped++;
          errors.push({ id: row.id, reason: 'Missing dimensions' });
          continue;
        }

        // Calculate aspect ratio (width / height)
        const aspect_ratio = parseFloat((width / height).toFixed(4));

        console.log(`[Backfill] Row ${row.id}: ${width}x${height}, AR=${aspect_ratio}, duration=${duration}s`);

        // Update database (unless dry run)
        if (!dryRun) {
          const updateData: any = { 
            width, 
            height, 
            aspect_ratio 
          };
          
          // Also update duration if we got it and it's missing
          if (duration && !row.duration_seconds) {
            updateData.duration_seconds = Math.round(duration);
          }

          const { error: updateError } = await supabase
            .from('post_media')
            .update(updateData)
            .eq('id', row.id);

          if (updateError) {
            console.error(`[Backfill] Row ${row.id} update failed:`, updateError);
            failed++;
            errors.push({ id: row.id, reason: updateError.message });
            continue;
          }
        }

        updated++;

        // Rate limiting: ~200ms delay = ~5 req/sec to respect CF API limits
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`[Backfill] Row ${row.id} processing failed:`, error);
        failed++;
        errors.push({ id: row.id, reason: String(error) });
        // Longer delay on error
        await new Promise(resolve => setTimeout(resolve, 400));
      }
    }

    const result = {
      processed,
      updated: dryRun ? 0 : updated,
      skipped,
      failed,
      dryRun,
      errors: errors.length > 0 ? errors : undefined,
      message: dryRun 
        ? `Dry run complete - would update ${updated} rows`
        : `Backfill complete - updated ${updated}/${processed} rows`
    };

    console.log('[Backfill] Complete:', result);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Backfill] Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Backfill failed', 
        message: String(error),
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
