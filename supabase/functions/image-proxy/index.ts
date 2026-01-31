import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

const SUPABASE_URL = 'https://ybxkehyomcakqjvuhnna.supabase.co';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

/**
 * Generate a cache key from the image URL
 * Extracts player ID from SportRadar URL or creates a hash
 */
function getCacheKey(url: string): string {
  // Try to extract player UUID from SportRadar URLs
  // Format: .../players/{uuid}/...
  const playerIdMatch = url.match(/players\/([a-f0-9-]{36})\//i);
  if (playerIdMatch) {
    return playerIdMatch[1];
  }
  
  // Try to extract asset ID from SportRadar URLs
  const assetIdMatch = url.match(/([a-f0-9-]{36})/i);
  if (assetIdMatch) {
    return assetIdMatch[1];
  }
  
  // Fallback: create a simple hash from URL
  const hash = btoa(url).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  return hash;
}

/**
 * Check if image exists in cache and return it, or fetch from source
 */
async function getCachedOrFetchImage(
  supabase: ReturnType<typeof createClient>,
  imageUrl: string,
  cacheKey: string
): Promise<{ data: ArrayBuffer; contentType: string } | null> {
  const cachePath = `cache/${cacheKey}.jpg`;
  
  // 1. Check if already cached in storage
  const { data: existingFile, error: downloadError } = await supabase.storage
    .from('player-headshots')
    .download(cachePath);
  
  if (existingFile && !downloadError) {
    console.log(`[Cache HIT] ${cacheKey}`);
    const arrayBuffer = await existingFile.arrayBuffer();
    return { data: arrayBuffer, contentType: 'image/jpeg' };
  }
  
  console.log(`[Cache MISS] ${cacheKey}, fetching from SportRadar...`);
  
  // 2. Fetch from SportRadar
  try {
    const response = await fetch(imageUrl, { 
      redirect: 'follow',
      headers: {
        'User-Agent': 'Clbhouz/1.0',
        'Accept': 'image/*',
      },
    });
    
    if (!response.ok) {
      // If rate limited, return null gracefully
      if (response.status === 429) {
        console.error(`[Rate Limited] SportRadar returned 429 for ${cacheKey}`);
        return null;
      }
      console.error(`[Fetch Failed] ${response.status} ${response.statusText}`);
      return null;
    }
    
    const imageData = await response.arrayBuffer();
    const contentType = response.headers.get('Content-Type') || 'image/jpeg';
    
    // 3. Save to storage for next time (async, don't block return)
    const uploadPromise = supabase.storage
      .from('player-headshots')
      .upload(cachePath, imageData, {
        contentType,
        upsert: true,
      })
      .then(({ error: uploadError }) => {
        if (uploadError) {
          console.error(`[Cache Save Failed] ${cacheKey}: ${uploadError.message}`);
        } else {
          console.log(`[Cached] ${cacheKey} (${imageData.byteLength} bytes)`);
        }
      });
    
    // Fire and forget - don't await the upload
    uploadPromise.catch(console.error);
    
    return { data: imageData, contentType };
  } catch (error) {
    console.error(`[Fetch Error] ${cacheKey}: ${error.message}`);
    return null;
  }
}

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

    console.log(`[Proxy] Requested: ${imageUrl.substring(0, 80)}...`);

    // Initialize Supabase client with service role for storage access
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false }
    });

    // Generate cache key from URL
    const cacheKey = getCacheKey(imageUrl);
    
    // Try to get from cache or fetch
    const result = await getCachedOrFetchImage(supabase, imageUrl, cacheKey);
    
    if (!result) {
      // Return a transparent 1x1 pixel as fallback
      const transparentPixel = new Uint8Array([
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 
        0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 
        0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 
        0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 
        0x01, 0x00, 0x3b
      ]);
      
      return new Response(transparentPixel, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'image/gif',
          'Cache-Control': 'public, max-age=60', // Short cache for failures
          'X-Proxy-Status': 'fallback',
        },
      });
    }

    return new Response(result.data, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': result.contentType,
        'Cache-Control': 'public, max-age=604800, immutable', // Cache 7 days
        'X-Proxy-Status': 'success',
      },
    });

  } catch (error) {
    console.error('[Proxy Error]', error);
    return new Response(`Proxy error: ${error.message}`, { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
