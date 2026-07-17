import { serve } from "https://deno.land/std@0.220.0/http/server.ts";

import { corsFor } from '../_shared/cors.ts';
// R2 public bucket for audio tracks
const R2_PUBLIC_BASE = 'https://pub-9f6095ba86ef4833a86c1e06bec47b40.r2.dev';

serve(async (req) => {
  const corsHeaders = corsFor(req.headers.get('Origin'));
  const url = new URL(req.url);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('[audio-proxy] CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow GET and HEAD
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    // Get the r2Key from query params
    const r2Key = url.searchParams.get('key');
    
    if (!r2Key) {
      console.error('[audio-proxy] Missing key parameter');
      return new Response(JSON.stringify({ error: 'Missing key parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[audio-proxy] Proxying request for:', r2Key);

    // Encode the path segments properly
    const encodedPath = r2Key
      .split('/')
      .map(segment => encodeURIComponent(segment))
      .join('/');
    
    const r2Url = `${R2_PUBLIC_BASE}/${encodedPath}`;
    console.log('[audio-proxy] Fetching from R2:', r2Url);

    // Forward any Range header for seeking support
    const headers: HeadersInit = {};
    const rangeHeader = req.headers.get('Range');
    if (rangeHeader) {
      headers['Range'] = rangeHeader;
      console.log('[audio-proxy] Range header:', rangeHeader);
    }

    // Fetch from R2
    const r2Response = await fetch(r2Url, {
      method: req.method,
      headers,
    });

    if (!r2Response.ok && r2Response.status !== 206) {
      console.error('[audio-proxy] R2 error:', r2Response.status, await r2Response.text());
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch audio',
        status: r2Response.status 
      }), {
        status: r2Response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get content type from R2 or default to audio/mpeg
    const contentType = r2Response.headers.get('content-type') || 'audio/mpeg';
    const contentLength = r2Response.headers.get('content-length');
    const contentRange = r2Response.headers.get('content-range');
    const acceptRanges = r2Response.headers.get('accept-ranges');

    console.log('[audio-proxy] Success:', {
      status: r2Response.status,
      contentType,
      contentLength,
      contentRange,
      acceptRanges,
    });

    // Build response headers
    const responseHeaders: HeadersInit = {
      ...corsHeaders,
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    };

    if (contentLength) {
      responseHeaders['Content-Length'] = contentLength;
    }
    if (contentRange) {
      responseHeaders['Content-Range'] = contentRange;
    }
    if (acceptRanges) {
      responseHeaders['Accept-Ranges'] = acceptRanges;
    } else {
      responseHeaders['Accept-Ranges'] = 'bytes';
    }

    // Stream the response body
    return new Response(r2Response.body, {
      status: r2Response.status,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('[audio-proxy] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
