import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const url = new URL(req.url);
    const analysisId = url.searchParams.get('analysisId');

    if (!analysisId) {
      return new Response(JSON.stringify({ error: 'Missing analysisId parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'GET') {
      // Get visuals for analysis
      const { data: visuals, error } = await supabase
        .from('swing_visuals')
        .select('*')
        .eq('analysis_id', analysisId)
        .order('frame_index');

      if (error) {
        console.error('Error fetching visuals:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch visuals' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ visuals }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      // Generate visuals for analysis
      const { frames, visualPlan } = await req.json();

      if (!frames || !visualPlan) {
        return new Response(JSON.stringify({ error: 'Missing frames or visualPlan' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if visuals already exist
      const { data: existingVisuals } = await supabase
        .from('swing_visuals')
        .select('id')
        .eq('analysis_id', analysisId)
        .limit(1);

      if (existingVisuals && existingVisuals.length > 0) {
        // Return existing visuals
        const { data: visuals } = await supabase
          .from('swing_visuals')
          .select('*')
          .eq('analysis_id', analysisId)
          .order('frame_index');

        return new Response(JSON.stringify({ visuals, cached: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Generate new visuals (placeholder response for now)
      // In a full implementation, this would process frames and create annotated images
      console.log('Would generate visuals for analysis:', analysisId);
      console.log('Frames count:', frames.length);
      console.log('Visual plan items:', visualPlan.length);

      return new Response(JSON.stringify({ 
        message: 'Visual generation started',
        analysisId,
        frameCount: frames.length,
        planCount: visualPlan.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in swing visuals function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});