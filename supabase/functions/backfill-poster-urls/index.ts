import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { normalizeError } from '../_shared/normalize-error.ts';
import { generateStreamThumbnailUrl } from '../_shared/cloudflare-config.ts';

import { corsFor } from '../_shared/cors.ts';
function getStreamIdFromUrl(url: string): string | null {
  if (!url) return null;
  
  // Match various Cloudflare Stream URL patterns (detection only)
  const patterns = [
    /\/([a-f0-9]{32})\/manifest\/video\.m3u8/i,
    /\/([a-f0-9]{32})\/thumbnails\//i,
    /videodelivery\.net\/([a-f0-9]{32})/i, // Detection only - for parsing legacy URLs
    /customer-[^.]+\.cloudflarestream\.com\/([a-f0-9]{32})/i
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

Deno.serve(async (req) => {
  const corsHeaders = corsFor(req.headers.get('Origin'));
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting poster URL backfill...');

    // Backfill post_media table
    console.log('Processing post_media table...');
    const { data: postMedia, error: postMediaError } = await supabaseClient
      .from('post_media')
      .select('id, media_url, media_type, poster_url')
      .eq('media_type', 'video')
      .or('poster_url.is.null,poster_url.eq.');

    if (postMediaError) {
      throw new Error(`Error fetching post_media: ${postMediaError.message}`);
    }

    let postMediaUpdated = 0;
    for (const row of postMedia ?? []) {
      const streamId = getStreamIdFromUrl(row.media_url);
      if (!streamId) {
        console.log(`No stream ID found for post_media ${row.id}: ${row.media_url}`);
        continue;
      }

      // Use centralized URL generator - always uses customer subdomain
      const posterUrl = generateStreamThumbnailUrl(streamId, { time: '1s' });
      
      const { error: updateError } = await supabaseClient
        .from('post_media')
        .update({ 
          stream_id: streamId, 
          poster_url: posterUrl 
        })
        .eq('id', row.id);

      if (updateError) {
        console.error(`Failed to update post_media ${row.id}:`, updateError);
      } else {
        postMediaUpdated++;
        console.log(`Updated post_media ${row.id} with stream_id: ${streamId}`);
      }
    }

    // Backfill course_review_media table
    console.log('Processing course_review_media table...');
    const { data: reviewMedia, error: reviewMediaError } = await supabaseClient
      .from('course_review_media')
      .select('id, media_url, media_type, poster_url')
      .eq('media_type', 'video')
      .or('poster_url.is.null,poster_url.eq.');

    if (reviewMediaError) {
      throw new Error(`Error fetching course_review_media: ${reviewMediaError.message}`);
    }

    let reviewMediaUpdated = 0;
    for (const row of reviewMedia ?? []) {
      const streamId = getStreamIdFromUrl(row.media_url);
      if (!streamId) {
        console.log(`No stream ID found for course_review_media ${row.id}: ${row.media_url}`);
        continue;
      }

      // Use centralized URL generator - always uses customer subdomain
      const posterUrl = generateStreamThumbnailUrl(streamId, { time: '1s' });
      
      const { error: updateError } = await supabaseClient
        .from('course_review_media')
        .update({ 
          stream_id: streamId, 
          poster_url: posterUrl 
        })
        .eq('id', row.id);

      if (updateError) {
        console.error(`Failed to update course_review_media ${row.id}:`, updateError);
      } else {
        reviewMediaUpdated++;
        console.log(`Updated course_review_media ${row.id} with stream_id: ${streamId}`);
      }
    }

    const result = {
      success: true,
      message: 'Poster URL backfill completed successfully',
      stats: {
        post_media_updated: postMediaUpdated,
        course_review_media_updated: reviewMediaUpdated,
        total_updated: postMediaUpdated + reviewMediaUpdated
      }
    };

    console.log('Backfill complete:', result);

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    const err = normalizeError(error);
    console.error('Backfill error:', err.name, err.message, err.stack);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})