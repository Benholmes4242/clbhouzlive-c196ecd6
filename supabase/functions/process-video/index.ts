import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

/**
 * Video Processing Edge Function
 * 
 * Phase 2: Bakes filters, text overlays, and music into video files.
 * 
 * IMPLEMENTATION NOTE:
 * Full video processing with FFmpeg is not feasible in Edge Functions due to:
 * - Memory and CPU limits in edge runtime
 * - FFmpeg WASM is heavy and slow
 * - Cloudflare Stream doesn't support server-side filters
 * 
 * CURRENT APPROACH:
 * This function serves as a placeholder that marks videos for potential
 * future processing via external services (AWS MediaConvert, Mux, etc.)
 * 
 * For now, videos continue to use CSS-based rendering in the app, which
 * provides the same visual experience for in-app viewing. The limitation
 * is that downloaded/shared videos won't have edits baked in.
 * 
 * FUTURE OPTIONS:
 * 1. AWS MediaConvert integration
 * 2. Mux Video integration
 * 3. Self-hosted FFmpeg service
 * 4. Cloudflare Workers with FFmpeg WASM (limited)
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Video filter configurations for future FFmpeg processing
// Maps filter IDs to FFmpeg filter strings
const FFMPEG_FILTERS: Record<string, string> = {
  normal: '',
  vivid: 'eq=saturation=1.2:contrast=1.1',
  cool: 'colorbalance=bs=0.1:bm=0.05',
  warm: 'colorbalance=rs=0.1:rm=0.05',
  pop: 'eq=saturation=1.15:contrast=1.15',
  matte: 'eq=contrast=0.9:brightness=0.05',
  fade: 'eq=saturation=0.8:contrast=0.85:brightness=0.05',
  vintage: 'colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131,eq=saturation=0.7',
  dramatic: 'eq=contrast=1.3:brightness=-0.05',
  bw: 'hue=s=0',
};

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  scale: number;
  rotation?: number;
  style: string;
  color?: string;
}

interface StudioEdits {
  filter?: string;
  crop?: { ratio: string };
  rotate?: number;
  textOverlays?: TextOverlay[];
  music?: {
    trackId: string;
    title: string;
    artist?: string;
    url: string;
    startAt?: number;
    volume?: number;
  } | null;
  audioMode?: 'original' | 'music_only';
}

interface ProcessVideoRequest {
  mediaId: string;
  originalUrl: string;
  streamId: string;
  studioEdits: StudioEdits;
  filterId?: string;
  width?: number;
  height?: number;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  console.log('🎬 process-video function called');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const body: ProcessVideoRequest = await req.json();
    const { mediaId, originalUrl, streamId, studioEdits, filterId } = body;

    console.log('📋 Video processing request:', { mediaId, streamId, filterId });

    // Check if video needs processing
    const filter = filterId || studioEdits?.filter;
    const hasTextOverlays = studioEdits?.textOverlays && studioEdits.textOverlays.length > 0;
    const hasRotation = studioEdits?.rotate && studioEdits.rotate !== 0;
    const hasCrop = studioEdits?.crop?.ratio && studioEdits.crop.ratio !== 'original';
    const hasMusic = studioEdits?.music?.url;

    const needsProcessing = (filter && filter !== 'normal') || hasTextOverlays || hasRotation || hasCrop || hasMusic;

    if (!needsProcessing) {
      console.log('⏭️ No video processing needed, skipping');
      
      await supabase
        .from('post_media')
        .update({
          processing_status: 'skipped',
          processed_at: new Date().toISOString(),
        })
        .eq('id', mediaId);

      return new Response(JSON.stringify({ 
        success: true, 
        skipped: true,
        reason: 'No edits to apply'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mark as pending for future processing
    // Video processing requires external infrastructure not yet configured
    console.log('📝 Video marked for future processing');
    
    await supabase
      .from('post_media')
      .update({
        processing_status: 'pending_video',
        original_media_url: originalUrl,
      })
      .eq('id', mediaId);

    // Log the processing requirements for future implementation
    const processingRequirements = {
      mediaId,
      streamId,
      filter: filter || 'none',
      ffmpegFilter: filter ? FFMPEG_FILTERS[filter] || '' : '',
      hasTextOverlays,
      textOverlayCount: studioEdits?.textOverlays?.length || 0,
      hasRotation,
      rotation: studioEdits?.rotate || 0,
      hasCrop,
      cropRatio: studioEdits?.crop?.ratio || 'original',
      hasMusic,
      musicUrl: studioEdits?.music?.url || null,
      audioMode: studioEdits?.audioMode || 'original',
    };

    console.log('📋 Video processing requirements:', JSON.stringify(processingRequirements, null, 2));

    // Return success with notice that full processing is deferred
    return new Response(JSON.stringify({
      success: true,
      deferred: true,
      reason: 'Video processing requires external service integration (AWS MediaConvert, Mux, etc.). CSS-based rendering is used in-app for now.',
      requirements: processingRequirements,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Video processing error:', error);

    // Try to update the database with error status
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { mediaId } = await req.clone().json();
      if (mediaId) {
        await supabase
          .from('post_media')
          .update({
            processing_status: 'failed',
            processing_error: (error as Error).message,
          })
          .eq('id', mediaId);
      }
    } catch (updateError) {
      console.error('Failed to update error status:', updateError);
    }

    return new Response(JSON.stringify({
      success: false,
      error: (error as Error).message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
