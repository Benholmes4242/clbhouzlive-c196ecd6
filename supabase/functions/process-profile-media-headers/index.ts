import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessHeaderRequest {
  mediaId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  headerHeightPx: number;
  devicePixelRatio: number;
  containerWidth: number;
  isMobile: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      mediaId, 
      mediaUrl, 
      mediaType, 
      headerHeightPx, 
      devicePixelRatio, 
      containerWidth, 
      isMobile 
    }: ProcessHeaderRequest = await req.json();

    console.log(`🚀 Processing header for media ${mediaId}, type: ${mediaType}, mobile: ${isMobile}`);

    // Only process for mobile devices
    if (!isMobile) {
      console.log('📱 Desktop view - skipping header processing');
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Header processing only enabled for mobile devices',
        mediaId 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update status to processing
    await supabase
      .from('profile_media')
      .update({ header_processing_status: 'processing' })
      .eq('id', mediaId);

    let headerResult = null;
    let processingMethod = 'fallback';

    if (mediaType === 'image') {
      // For images, call the existing extend-header function
      try {
        console.log('🎨 Calling extend-header function for image processing');
        
        // Convert media URL to base64 for processing
        const imageResponse = await fetch(mediaUrl);
        const imageBuffer = await imageResponse.arrayBuffer();
        const base64Image = `data:image/jpeg;base64,${btoa(String.fromCharCode(...new Uint8Array(imageBuffer)))}`;

        const { data: headerData } = await supabase.functions.invoke('extend-header', {
          body: {
            imageBase64: base64Image,
            extensionHeight: headerHeightPx,
            devicePixelRatio,
            containerWidth,
            fallbackOnly: false
          }
        });

        if (headerData?.success && headerData?.extendedImage) {
          headerResult = headerData.extendedImage;
          processingMethod = headerData.method || 'ai';
          console.log(`✅ Header processing successful using method: ${processingMethod}`);
        } else {
          console.log('🔧 AI processing failed, will use fallback');
          processingMethod = 'fallback';
        }
      } catch (error) {
        console.error('❌ Error in AI header processing:', error);
        processingMethod = 'fallback';
      }
    } else if (mediaType === 'video') {
      // For videos, use Tier-1 approach: static strip from first frame
      console.log('🎬 Processing video - using Tier-1 static frame approach');
      
      // For now, we'll mark as needing fallback processing
      // In a full implementation, this would extract the first frame and process it
      processingMethod = 'fallback';
    }

    // Generate metadata
    const metadata = {
      headerHeightPx,
      devicePixelRatio,
      containerWidth,
      processingMethod,
      generatedAt: new Date().toISOString(),
      sourceHash: btoa(mediaUrl.slice(-20)), // Simple hash
    };

    // Update the profile media with results
    const updateData: any = {
      header_processing_status: headerResult ? 'completed' : 'fallback',
      header_metadata: metadata
    };

    if (headerResult) {
      if (mediaType === 'image') {
        updateData.header_extended_url = headerResult;
      } else if (mediaType === 'video') {
        updateData.header_strip_url = headerResult;
      }
    }

    const { error: updateError } = await supabase
      .from('profile_media')
      .update(updateData)
      .eq('id', mediaId);

    if (updateError) {
      console.error('❌ Error updating profile media:', updateError);
      throw updateError;
    }

    console.log(`🎉 Profile media header processing completed for ${mediaId}`);

    // Log telemetry
    console.log(`📊 Telemetry - Media: ${mediaId}, Method: ${processingMethod}, Mobile: ${isMobile}, DPR: ${devicePixelRatio}`);

    return new Response(JSON.stringify({ 
      success: true,
      mediaId,
      processingMethod,
      hasExtendedHeader: !!headerResult,
      metadata
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in process-profile-media-headers function:', error.message);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});