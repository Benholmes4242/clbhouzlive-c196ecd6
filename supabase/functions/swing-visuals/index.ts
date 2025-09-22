import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateVisualsRequest {
  analysisId: string;
}

interface VisualPlan {
  caption: string;
  frameHint: string;
  overlays: {
    lines?: Array<{ x1: number; y1: number; x2: number; y2: number; label: string }>;
    angles?: Array<{ cx: number; cy: number; a: number; b: number; label: string }>;
    keypoints?: Array<{ x: number; y: number; label: string; conf: number }>;
  };
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

    // Parse request based on method
    if (req.method === 'GET') {
      // GET /api/swing/visuals?analysisId=...
      const url = new URL(req.url);
      const analysisId = url.searchParams.get('analysisId');
      
      if (!analysisId) {
        return new Response(JSON.stringify({ error: 'Missing analysisId parameter' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Authenticate user
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get existing visuals
      const { data: existingVisuals, error } = await supabase
        .from('swing_visuals')
        .select('*')
        .eq('analysis_id', analysisId);

      if (error) {
        console.error('Error fetching visuals:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch visuals' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify(existingVisuals || []), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (req.method === 'POST') {
      // POST /api/swing/visuals - Generate visuals
      const body: CreateVisualsRequest = await req.json();
      const { analysisId } = body;

      // Authenticate user
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check if visuals already exist (idempotent)
      const { data: existingVisuals } = await supabase
        .from('swing_visuals')
        .select('id')
        .eq('analysis_id', analysisId);

      if (existingVisuals && existingVisuals.length > 0) {
        // Already exists, just return the existing visuals
        const { data: visuals } = await supabase
          .from('swing_visuals')
          .select('*')
          .eq('analysis_id', analysisId);

        return new Response(JSON.stringify(visuals || []), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get analysis and verify ownership
      const { data: analysis, error: analysisError } = await supabase
        .from('pro_ai_analyses')
        .select('session_id, user_id')
        .eq('id', analysisId)
        .eq('user_id', user.id)
        .single();

      if (analysisError || !analysis) {
        return new Response(JSON.stringify({ error: 'Analysis not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get phase results with visual plans
      const { data: phaseResults, error: phaseError } = await supabase
        .from('swing_phase_results')
        .select('*')
        .eq('session_id', analysis.session_id)
        .eq('status', 'done');

      if (phaseError) {
        console.error('Error fetching phase results:', phaseError);
        return new Response(JSON.stringify({ error: 'Failed to fetch phase results' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!phaseResults || phaseResults.length === 0) {
        return new Response(JSON.stringify({ error: 'No completed phases found' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Select best phases for visuals (setup, top, impact, followThrough + others)
      const priorityPhases = ['setup', 'top', 'impact', 'followThrough', 'takeaway', 'backswing'];
      const selectedPhases = priorityPhases
        .map(phase => phaseResults.find(p => p.phase === phase))
        .filter(Boolean)
        .slice(0, 6); // Max 6 visuals

      const generatedVisuals = [];

      for (const phase of selectedPhases) {
        try {
          // Generate visual with overlays (mock implementation)
          const visualData = await generateVisualWithOverlays(phase, supabase);
          
          const { data: visual, error: insertError } = await supabase
            .from('swing_visuals')
            .insert({
              analysis_id: analysisId,
              frame_index: phase.used_frame_index,
              label: phase.phase,
              overlay: phase.visual_plan,
              url: visualData.url,
              width: visualData.width,
              height: visualData.height
            })
            .select()
            .single();

          if (insertError) {
            console.error(`Error inserting visual for ${phase.phase}:`, insertError);
            continue;
          }

          generatedVisuals.push(visual);
        } catch (error) {
          console.error(`Error generating visual for ${phase.phase}:`, error);
          continue;
        }
      }

      return new Response(JSON.stringify(generatedVisuals), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in swing visuals function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function generateVisualWithOverlays(phase: any, supabase: any): Promise<{ url: string; width: number; height: number }> {
  // Mock implementation - in reality this would:
  // 1. Load the frame image from storage via signed URL
  // 2. Use Canvas API or image processing to render overlays
  // 3. Upload the result to storage bucket
  // 4. Return the signed URL and dimensions
  
  // For now, generate a mock visual with realistic data
  const mockVisuals = {
    setup: 'https://via.placeholder.com/1280x720/4f46e5/ffffff?text=Setup+Analysis',
    takeaway: 'https://via.placeholder.com/1280x720/059669/ffffff?text=Takeaway+Analysis',
    backswing: 'https://via.placeholder.com/1280x720/dc2626/ffffff?text=Backswing+Analysis',
    top: 'https://via.placeholder.com/1280x720/ea580c/ffffff?text=Top+Position',
    downswing: 'https://via.placeholder.com/1280x720/7c2d12/ffffff?text=Downswing+Analysis',
    impact: 'https://via.placeholder.com/1280x720/16a34a/ffffff?text=Impact+Position',
    followThrough: 'https://via.placeholder.com/1280x720/2563eb/ffffff?text=Follow+Through'
  };
  
  const url = mockVisuals[phase.phase as keyof typeof mockVisuals] || mockVisuals.setup;
  
  return {
    url,
    width: 1280,
    height: 720
  };
}