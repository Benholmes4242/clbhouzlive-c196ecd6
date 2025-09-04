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
    // Use fallback for account ID if not in environment
    const apiToken = Deno.env.get('CLOUDFLARE_STREAM_API_TOKEN') || Deno.env.get('CLOUDFLARE_API_TOKEN');
    const accountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID') || 'ybxkehyomcakqjvuhnna';

    console.log('🔧 Upload function credentials check:', {
      hasApiToken: !!apiToken,
      hasAccountId: !!accountId,
      accountIdValue: accountId,
      tokenPreview: apiToken ? apiToken.substring(0, 8) + '...' : 'null'
    });

    if (!apiToken) {
      console.error('Missing Cloudflare Stream API token');
      return new Response(
        JSON.stringify({ error: 'Cloudflare Stream API token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      // Handle file upload to Cloudflare Stream
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const metadata = formData.get('metadata') ? JSON.parse(formData.get('metadata') as string) : {};

      if (!file) {
        return new Response(
          JSON.stringify({ error: 'No file provided' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Uploading video to Cloudflare Stream: ${file.name}, size: ${file.size}`);

      // Create form data for Cloudflare Stream
      const streamFormData = new FormData();
      streamFormData.append('file', file);
      
      // Add metadata
      if (metadata.title) streamFormData.append('meta[name]', metadata.title);
      if (metadata.description) streamFormData.append('meta[description]', metadata.description);
      
      // Set upload options
      streamFormData.append('requireSignedURLs', 'false'); // Make videos publicly accessible
      streamFormData.append('allowedOrigins', '*'); // Allow embedding anywhere
      
      // Upload to Cloudflare Stream
      const uploadResponse = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
          },
          body: streamFormData,
        }
      );

      const result: CloudflareStreamResponse = await uploadResponse.json();
      
      if (!result.success) {
        console.error('Cloudflare Stream upload failed:', result.errors);
        return new Response(
          JSON.stringify({ 
            error: 'Upload failed', 
            details: result.errors 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Video uploaded successfully to Cloudflare Stream:', result.result?.uid);

      return new Response(
        JSON.stringify({
          success: true,
          videoId: result.result?.uid,
          thumbnail: result.result?.thumbnail,
          playback: result.result?.playback,
          preview: result.result?.preview,
          status: result.result?.status?.state,
          // Return URLs for immediate use
          urls: {
            hls: result.result?.playback?.hls,
            dash: result.result?.playback?.dash,
            thumbnail: result.result?.thumbnail,
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'GET') {
      // Get video status/details
      const url = new URL(req.url);
      const videoId = url.searchParams.get('videoId');

      if (!videoId) {
        return new Response(
          JSON.stringify({ error: 'Video ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${videoId}`,
        {
          headers: {
            'Authorization': `Bearer ${apiToken}`,
          },
        }
      );

      const result: CloudflareStreamResponse = await response.json();

      if (!result.success) {
        return new Response(
          JSON.stringify({ error: 'Video not found', details: result.errors }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          video: result.result,
          urls: {
            hls: result.result?.playback?.hls,
            dash: result.result?.playback?.dash,
            thumbnail: result.result?.thumbnail,
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