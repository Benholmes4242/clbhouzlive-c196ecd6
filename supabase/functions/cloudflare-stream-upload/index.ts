import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';

// Runtime verification logging
console.log('🔧 RUNTIME CHECK - CLOUDFLARE_ACCOUNT_ID accessible:', Boolean(Deno.env.get('CLOUDFLARE_ACCOUNT_ID')));
console.log('🔧 RUNTIME CHECK - Available tokens:', {
  hasR2Token: Boolean(Deno.env.get('CLOUDFLARE_R2_API_TOKEN')),
  hasApiToken: Boolean(Deno.env.get('CLOUDFLARE_API_TOKEN')),
  hasStreamToken: Boolean(Deno.env.get('CLOUDFLARE_STREAM_API_TOKEN'))
});

// Log the actual values for debugging (first few chars only for security)
const accountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
const streamToken = Deno.env.get('CLOUDFLARE_STREAM_API_TOKEN');
console.log('🔧 DEBUGGING - Account ID exists:', !!accountId, accountId ? `starts with: ${accountId.substring(0, 8)}...` : 'null');
console.log('🔧 DEBUGGING - Stream Token exists:', !!streamToken, streamToken ? `starts with: ${streamToken.substring(0, 8)}...` : 'null');

interface CloudflareStreamResponse {
  success: boolean;
  result?: {
    uid: string;
    thumbnail: string;
    playback: {
      hls: string;
      dash: string;
    };
    preview: string;
    status: {
      state: string;
    };
  };
  errors?: Array<{
    code: number;
    message: string;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Processing Cloudflare Stream upload request');
    
    // Use fallback for account ID if not in environment
    const accountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID') || 'ybxkehyomcakqjvuhnna';
    
    // For now, let's try without an API token to see what happens
    console.log('🔧 Upload function starting with account ID:', accountId);

    if (req.method === 'POST') {
      // Handle file upload to Cloudflare Stream
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const metadata = formData.get('metadata') ? JSON.parse(formData.get('metadata') as string) : {};

      if (!file) {
        console.error('❌ No file provided in request');
        return new Response(
          JSON.stringify({ error: 'No file provided' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`📤 Uploading video to Cloudflare Stream: ${file.name}, size: ${file.size}`);

      // Since we're having API token issues, let's return a mock response for now
      // to verify the function structure is working
      console.log('⚠️ MOCK MODE: Returning fake response until API tokens are configured');
      
      // Generate a fake video ID for testing
      const fakeVideoId = `mock-video-${Date.now()}`;
      
      return new Response(
        JSON.stringify({
          success: true,
          videoId: fakeVideoId,
          thumbnail: `https://customer-4ah4gni80ytefpck.cloudflarestream.com/${fakeVideoId}/thumbnails/thumbnail.jpg`,
          playback: {
            hls: `https://customer-4ah4gni80ytefpck.cloudflarestream.com/${fakeVideoId}/manifest/video.m3u8`,
            dash: `https://customer-4ah4gni80ytefpck.cloudflarestream.com/${fakeVideoId}/manifest/video.mpd`
          },
          preview: `https://customer-4ah4gni80ytefpck.cloudflarestream.com/${fakeVideoId}/preview`,
          status: 'ready',
          urls: {
            hls: `https://customer-4ah4gni80ytefpck.cloudflarestream.com/${fakeVideoId}/manifest/video.m3u8`,
            dash: `https://customer-4ah4gni80ytefpck.cloudflarestream.com/${fakeVideoId}/manifest/video.mpd`,
            thumbnail: `https://customer-4ah4gni80ytefpck.cloudflarestream.com/${fakeVideoId}/thumbnails/thumbnail.jpg`
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'GET') {
      // Get video status/details - Mock mode for now
      const url = new URL(req.url);
      const videoId = url.searchParams.get('videoId');

      if (!videoId) {
        return new Response(
          JSON.stringify({ error: 'Video ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('⚠️ MOCK MODE: Returning fake video details for ID:', videoId);

      // Return mock video details
      return new Response(
        JSON.stringify({
          success: true,
          video: {
            uid: videoId,
            thumbnail: `https://customer-4ah4gni80ytefpck.cloudflarestream.com/${videoId}/thumbnails/thumbnail.jpg`,
            playback: {
              hls: `https://customer-4ah4gni80ytefpck.cloudflarestream.com/${videoId}/manifest/video.m3u8`,
              dash: `https://customer-4ah4gni80ytefpck.cloudflarestream.com/${videoId}/manifest/video.mpd`
            },
            status: { state: 'ready' }
          },
          urls: {
            hls: `https://customer-4ah4gni80ytefpck.cloudflarestream.com/${videoId}/manifest/video.m3u8`,
            dash: `https://customer-4ah4gni80ytefpck.cloudflarestream.com/${videoId}/manifest/video.mpd`,
            thumbnail: `https://customer-4ah4gni80ytefpck.cloudflarestream.com/${videoId}/thumbnails/thumbnail.jpg`
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in cloudflare-stream-upload function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});