import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const imageUrl = url.searchParams.get('url');

    if (!imageUrl) {
      return new Response('Missing url parameter', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    console.log(`Proxying image: ${imageUrl.substring(0, 100)}...`);

    // Fetch the image, following all redirects
    const response = await fetch(imageUrl, { 
      redirect: 'follow',
      headers: {
        'User-Agent': 'Clbhouz/1.0',
        'Accept': 'image/*',
      },
    });

    if (!response.ok) {
      console.error(`Image fetch failed: ${response.status} ${response.statusText}`);
      return new Response(`Image fetch failed: ${response.status}`, { 
        status: response.status, 
        headers: corsHeaders 
      });
    }

    const imageData = await response.arrayBuffer();
    const contentType = response.headers.get('Content-Type') || 'image/jpeg';

    console.log(`Successfully proxied image: ${contentType}, ${imageData.byteLength} bytes`);

    return new Response(imageData, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=604800, immutable', // Cache 7 days
        'X-Proxy-Status': 'success',
      },
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(`Proxy error: ${error.message}`, { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
