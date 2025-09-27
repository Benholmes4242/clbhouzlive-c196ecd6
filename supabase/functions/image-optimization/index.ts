import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { normalizeError } from '../_shared/normalize-error.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, width, height, quality = 80, format = 'webp' } = await req.json();

    if (!imageUrl) {
      throw new Error('Image URL is required');
    }

    console.log(`🖼️ Optimizing image: ${imageUrl} to ${width}x${height}, quality: ${quality}, format: ${format}`);

    // For Supabase storage URLs, we can potentially transform them
    if (imageUrl.includes('supabase.co/storage/v1/object/public/')) {
      // Since Supabase doesn't have built-in image transformations,
      // we'll fetch the image and process it ourselves
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const imageBlob = await response.blob();
      const imageBuffer = await imageBlob.arrayBuffer();
      
      // For now, return the original image
      // In a production setup, you'd use an image processing library like ImageMagick or Sharp
      return new Response(imageBuffer, {
        headers: {
          ...corsHeaders,
          'Content-Type': imageBlob.type,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // For external URLs, return optimized URL with parameters
    const optimizedUrl = new URL(imageUrl);
    if (width) optimizedUrl.searchParams.set('w', width.toString());
    if (height) optimizedUrl.searchParams.set('h', height.toString());
    optimizedUrl.searchParams.set('q', quality.toString());
    optimizedUrl.searchParams.set('fm', format);

    return new Response(JSON.stringify({ optimizedUrl: optimizedUrl.toString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const err = normalizeError(error);
    console.error('Error in image-optimization function:', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});