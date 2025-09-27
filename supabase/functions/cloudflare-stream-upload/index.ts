import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
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

      const streamToken = Deno.env.get('CLOUDFLARE_STREAM_API_TOKEN');
      
      if (!streamToken) {
        console.error('❌ Missing CLOUDFLARE_STREAM_API_TOKEN');
        return new Response(
          JSON.stringify({ error: 'Stream API token not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        // Create form data for Cloudflare Stream API
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        
        // Add metadata if provided
        if (metadata.title) {
          uploadFormData.append('meta', JSON.stringify({ name: metadata.title }));
        }

        // Upload to Cloudflare Stream
        const uploadResponse = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${streamToken}`,
            },
            body: uploadFormData,
          }
        );

        const uploadResult: CloudflareStreamResponse = await uploadResponse.json();
        console.log('📥 Cloudflare Stream response:', { success: uploadResult.success, errors: uploadResult.errors });

        if (!uploadResult.success || !uploadResult.result) {
          console.error('❌ Upload failed:', uploadResult.errors);
          return new Response(
            JSON.stringify({ 
              error: 'Upload failed', 
              details: uploadResult.errors 
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const video = uploadResult.result;
        console.log('✅ Video uploaded successfully:', video.uid);

        return new Response(
          JSON.stringify({
            success: true,
            videoId: video.uid,
            thumbnail: video.thumbnail,
            playback: video.playback,
            preview: video.preview,
            status: video.status.state,
            urls: {
              hls: video.playback.hls,
              dash: video.playback.dash,
              thumbnail: video.thumbnail
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('❌ Error uploading to Cloudflare Stream:', error);
        return new Response(
          JSON.stringify({ error: 'Upload failed', details: normalizeError(error).message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (req.method === 'GET') {
      // Get video status/details from Cloudflare Stream
      const url = new URL(req.url);
      const videoId = url.searchParams.get('videoId');

      if (!videoId) {
        return new Response(
          JSON.stringify({ error: 'Video ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const streamToken = Deno.env.get('CLOUDFLARE_STREAM_API_TOKEN');
      
      if (!streamToken) {
        console.error('❌ Missing CLOUDFLARE_STREAM_API_TOKEN');
        return new Response(
          JSON.stringify({ error: 'Stream API token not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        console.log('📥 Fetching video details for ID:', videoId);

        // Fetch video details from Cloudflare Stream
        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${videoId}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${streamToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const result: CloudflareStreamResponse = await response.json();
        console.log('📥 Video details response:', { success: result.success, errors: result.errors });

        if (!result.success || !result.result) {
          console.error('❌ Failed to fetch video details:', result.errors);
          return new Response(
            JSON.stringify({ 
              error: 'Failed to fetch video details', 
              details: result.errors 
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
              status: video.status
            },
            urls: {
              hls: video.playback.hls,
              dash: video.playback.dash,
              thumbnail: video.thumbnail
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('❌ Error fetching video details:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch video details', details: normalizeError(error).message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in cloudflare-stream-upload function:', error);
    return new Response(
      JSON.stringify({ error: normalizeError(error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});