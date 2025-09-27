import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { normalizeError } from '../_shared/normalize-error.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, optimize = true } = await req.json();

    if (!imageUrl) {
      throw new Error('Image URL is required');
    }

    console.log(`🖼️ Processing profile image for 4K quality: ${imageUrl}`);

    // For profile photos, we want maximum quality
    const optimizedUrl = optimize ? 
      // Add quality parameters for R2/Cloudflare Images if available
      `${imageUrl}?quality=100&format=auto&width=2048&height=2048&fit=cover` : 
      imageUrl;

    // For now, return the enhanced URL with quality parameters
    // Cloudflare R2 with Cloudflare Images can handle these transformations
    return new Response(JSON.stringify({ 
      success: true, 
      optimizedUrl,
      originalUrl: imageUrl,
      qualitySettings: {
        format: 'auto', // WebP for modern browsers, fallback to JPEG
        quality: 100,   // Maximum quality
        width: 2048,    // 4K-ready dimensions
        height: 2048,
        fit: 'cover'    // Maintain aspect ratio
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = normalizeError(error);
    console.error('Error in profile-image-optimizer:', err.message);
    return new Response(JSON.stringify({ 
      success: false, 
      error: err.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});