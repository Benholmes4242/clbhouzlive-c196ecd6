import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const imageUrl = url.searchParams.get('url');

    if (!imageUrl) {
      return new Response('Missing url parameter', { status: 400, headers: corsHeaders });
    }

    console.log(`[image-proxy] Fetching: ${imageUrl}`);

    // Fetch the image, following redirects
    const response = await fetch(imageUrl, { 
      redirect: 'follow',
      headers: {
        'User-Agent': 'ClbhouzApp/1.0',
      },
    });

    if (!response.ok) {
      console.error(`[image-proxy] Fetch failed: ${response.status}`);
      return new Response(`Image fetch failed: ${response.status}`, { 
        status: response.status, 
        headers: corsHeaders 
      });
    }

    const imageData = await response.arrayBuffer();
    const contentType = response.headers.get('Content-Type') || 'image/jpeg';

    console.log(`[image-proxy] Success - ${imageData.byteLength} bytes, type: ${contentType}`);

    return new Response(imageData, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=604800', // Cache for 7 days
      },
    });

  } catch (error) {
    console.error('[image-proxy] Error:', error);
    return new Response('Proxy error', { status: 500, headers: corsHeaders });
  }
});
