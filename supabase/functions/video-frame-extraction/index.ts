import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const formData = await req.formData();
    const videoFile = formData.get('video') as File;

    if (!videoFile) {
      return new Response(JSON.stringify({ error: 'No video file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For now, return a placeholder response since Deno edge functions don't have FFmpeg
    // In production, you would use a service like Cloudflare Stream or AWS Lambda with FFmpeg
    console.log('Video file received:', videoFile.name, videoFile.size);

    return new Response(JSON.stringify({
      message: 'Frame extraction not available in edge functions. Please use client-side extraction.',
      videoInfo: {
        name: videoFile.name,
        size: videoFile.size,
        type: videoFile.type
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in video-frame-extraction function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process video',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});