import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessRequest {
  mediaId: string;
  mediaUrl: string;
  headerHeightPx?: number;
  dpr?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting profile media header processing...');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { 
      mediaId, 
      mediaUrl, 
      headerHeightPx = 200, 
      dpr = 1 
    }: ProcessRequest = await req.json();
    
    if (!mediaId || !mediaUrl) {
      throw new Error('Missing required fields: mediaId, mediaUrl');
    }

    console.log(`📋 Processing media ${mediaId} with header height ${headerHeightPx}px`);

    // Get media item details
    const { data: mediaItem, error: mediaError } = await supabase
      .from('profile_media')
      .select('*')
      .eq('id', mediaId)
      .single();

    if (mediaError) throw mediaError;
    
    if (!mediaItem) {
      throw new Error('Media item not found');
    }

    // Update status to processing
    await supabase
      .from('profile_media')
      .update({ header_processing_status: 'processing' })
      .eq('id', mediaId);

    // Check if this is mobile device (only process on mobile)
    const userAgent = req.headers.get('user-agent') || '';
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent) || dpr > 1;
    
    if (!isMobile) {
      console.log('📱 Skipping header processing - not a mobile device');
      await supabase
        .from('profile_media')
        .update({ header_processing_status: 'success' })
        .eq('id', mediaId);
      
      return new Response(JSON.stringify({ 
        success: true,
        skipped: true,
        reason: 'Desktop device - header extension not needed'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use the existing extend-header function
    const { data: extensionResult, error: extensionError } = await supabase.functions.invoke('extend-header', {
      body: {
        imageBase64: await urlToBase64(mediaUrl),
        extensionHeight: headerHeightPx,
        devicePixelRatio: dpr,
        containerWidth: 390, // Mobile width
        prompt: "Extend the background upwards to match the existing scene. No new subjects, seamless continuation."
      }
    });

    if (extensionError) throw extensionError;

    if (extensionResult?.success && extensionResult?.extendedImage) {
      // Save successful result
      const updateData = {
        header_processing_status: 'success' as const,
        [mediaItem.media_type === 'video' ? 'header_strip_url' : 'header_extended_url']: extensionResult.extendedImage,
        header_metadata: {
          sourceHash: btoa(mediaUrl.slice(-20)),
          headerHeightPx,
          generatedAt: new Date().toISOString(),
          method: extensionResult.method || 'ai',
          processingTime: extensionResult.processingTime || 0
        }
      };

      await supabase
        .from('profile_media')
        .update(updateData)
        .eq('id', mediaId);

      console.log(`✅ Header processing completed for ${mediaId}`);

      return new Response(JSON.stringify({ 
        success: true,
        mediaId,
        method: extensionResult.method,
        headerUrl: extensionResult.extendedImage
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      throw new Error(extensionResult?.error || 'Header extension failed');
    }

  } catch (error) {
    console.error('❌ Error in profile media header processing:', error.message);
    
    // Update media item with error status
    if (typeof error === 'object' && 'mediaId' in error) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      await supabase
        .from('profile_media')
        .update({
          header_processing_status: 'error',
          header_metadata: {
            method: 'fallback',
            error: error.message,
            generatedAt: new Date().toISOString()
          }
        })
        .eq('id', error.mediaId);
    }
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      fallback: true
    }), {
      status: 200, // Return 200 so client can handle gracefully
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to convert URL to base64
async function urlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    throw new Error(`Failed to fetch image from URL: ${error.message}`);
  }
}