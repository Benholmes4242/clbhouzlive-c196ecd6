import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MediaRecord {
  id: string;
  media_url: string;
  media_type: string;
  duration_seconds: number | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get batch size from query param (default 200)
    const url = new URL(req.url);
    const batchSize = parseInt(url.searchParams.get('batch_size') || '200', 10);
    const dryRun = url.searchParams.get('dry_run') === 'true';

    console.log(`Starting video duration backfill (batch_size: ${batchSize}, dry_run: ${dryRun})`);

    // Fetch videos without duration
    const { data: mediaRecords, error: fetchError } = await supabaseClient
      .from('post_media')
      .select('id, media_url, media_type, duration_seconds')
      .eq('media_type', 'video')
      .is('duration_seconds', null)
      .limit(batchSize);

    if (fetchError) {
      throw new Error(`Failed to fetch media records: ${fetchError.message}`);
    }

    if (!mediaRecords || mediaRecords.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No videos found without duration',
          processed: 0,
          failed: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${mediaRecords.length} videos without duration`);

    let processed = 0;
    let failed = 0;
    const failures: Array<{ id: string; url: string; error: string }> = [];

    // Process each video
    for (const media of mediaRecords as MediaRecord[]) {
      try {
        // For Cloudflare Stream videos, extract duration from the API
        if (media.media_url.includes('cloudflarestream.com') || media.media_url.includes('customer-')) {
          const streamId = extractStreamId(media.media_url);
          
          if (streamId) {
            const duration = await getCloudflareStreamDuration(streamId);
            
            if (duration && !dryRun) {
              const durationMs = Math.round(duration * 1000);
              const durationSeconds = Math.ceil(duration);

              await supabaseClient
                .from('post_media')
                .update({
                  duration_ms: durationMs,
                  duration_seconds: durationSeconds,
                })
                .eq('id', media.id);

              console.log(`Updated media ${media.id}: ${durationSeconds}s`);
              processed++;
            } else if (duration && dryRun) {
              console.log(`[DRY RUN] Would update media ${media.id}: ${Math.ceil(duration)}s`);
              processed++;
            }
          } else {
            throw new Error('Could not extract Stream ID');
          }
        } else {
          // For non-Stream videos, we'd need to probe the URL
          // This is a placeholder - in production, you'd probe the video file
          console.warn(`Skipping non-Stream video: ${media.media_url}`);
          failed++;
          failures.push({
            id: media.id,
            url: media.media_url,
            error: 'Non-Stream video probing not implemented'
          });
        }
      } catch (error) {
        console.error(`Failed to process media ${media.id}:`, error);
        failed++;
        failures.push({
          id: media.id,
          url: media.media_url,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        failed,
        total: mediaRecords.length,
        failures: failures.length > 0 ? failures : undefined,
        dry_run: dryRun
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Backfill error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function extractStreamId(url: string): string | null {
  // Extract Stream ID from various Cloudflare Stream URL formats
  const patterns = [
    /\/([a-f0-9]{32})\//, // Standard format
    /customer-[^\/]+\/([a-f0-9]{32})/, // Customer subdomain format
    /stream_id=([a-f0-9]{32})/, // Query param format
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

async function getCloudflareStreamDuration(streamId: string): Promise<number | null> {
  const accountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
  const apiToken = Deno.env.get('CLOUDFLARE_STREAM_API_TOKEN');

  if (!accountId || !apiToken) {
    console.error('Missing Cloudflare credentials');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${streamId}`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error(`Cloudflare API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    // Cloudflare returns duration in seconds
    return data.result?.duration || null;
  } catch (error) {
    console.error('Error fetching Stream metadata:', error);
    return null;
  }
}
