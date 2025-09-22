import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StartSessionRequest {
  uploadId?: string;
  videoUrl?: string;
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

    // Get user from auth header
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

    const body: StartSessionRequest = await req.json();
    const sessionId = crypto.randomUUID();
    
    // Mock frame extraction for now - in real implementation this would extract frames
    const frames = Array.from({ length: 20 }, (_, i) => ({
      index: i + 1,
      t: (i + 1) * 0.5, // timestamp in seconds
      url: `https://example.com/frame-${i + 1}.jpg`, // placeholder
      width: 1280,
      height: 720,
      hash: `frame-${i + 1}-hash`
    }));

    const phases = ['setup', 'takeaway', 'backswing', 'top', 'downswing', 'impact', 'followThrough'];
    
    // Store session in database
    const { error: insertError } = await supabase
      .from('swing_sessions')
      .insert({
        id: sessionId,
        user_id: user.id,
        upload_id: body.uploadId,
        video_url: body.videoUrl,
        frames: frames,
        status: 'started'
      });

    if (insertError) {
      console.error('Error inserting session:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to create session' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Enqueue all phases immediately (simplified - in reality this would be more sophisticated)
    const phasePromises = phases.map(async (phase) => {
      const { error } = await supabase
        .from('swing_phase_results')
        .insert({
          session_id: sessionId,
          phase,
          status: 'queued',
          started_at: new Date().toISOString()
        });
      
      if (error) {
        console.error(`Error queuing phase ${phase}:`, error);
      }
    });

    await Promise.all(phasePromises);

    const response = {
      sessionId,
      userId: user.id,
      frames,
      phases,
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in swing-session-start:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});