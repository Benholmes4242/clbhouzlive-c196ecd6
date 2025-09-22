import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SummarizeRequest {
  sessionId: string;
}

interface PhaseResult {
  phase: string;
  used_frame_index: number;
  metrics: Record<string, any>;
  tips: string[];
  visual_plan: any;
  status: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    const body: SummarizeRequest = await req.json();
    const { sessionId } = body;

    // Verify session ownership
    const { data: session, error: sessionError } = await supabase
      .from('swing_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Load phase results
    const { data: phaseResults, error: phaseError } = await supabase
      .from('swing_phase_results')
      .select('*')
      .eq('session_id', sessionId);

    if (phaseError) {
      console.error('Error loading phase results:', phaseError);
      return new Response(JSON.stringify({ error: 'Failed to load phase results' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if we have enough completed phases
    const completedPhases = phaseResults?.filter(p => p.status === 'done') || [];
    if (completedPhases.length < 3) {
      console.log(`Session ${sessionId}: Insufficient phase data - ${completedPhases.length}/7 phases completed`);
      return new Response(JSON.stringify({ 
        error: 'Insufficient phase data', 
        retryAfterMs: 3000,
        doneCount: completedPhases.length,
        completedPhases: completedPhases.length 
      }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Build summarize prompt (strict JSON)
    const systemPrompt = `Compose a concise golf swing review. Return STRICT JSON only:
{
  "summary": string,
  "keyFindings": string[],
  "byPhase": {
    "setup": string, "takeaway": string, "backswing": string, "top": string,
    "downswing": string, "impact": string, "followThrough": string
  },
  "drills": string[],
  "confidence": number
}
No extra text.`;

    // Format phase data for the prompt
    const phaseData = completedPhases.map(phase => ({
      phase: phase.phase,
      metrics: phase.metrics || {},
      tips: phase.tips || [],
      usedFrameIndex: phase.used_frame_index,
      confidence: phase.metrics?.conf || 0.8
    }));

    const userPrompt = {
      club: null,
      cameraAngle: null,
      miss: null,
      phases: phaseData.map((p: any) => ({
        phase: p.phase,
        metrics: p.metrics ?? {},
        tips: p.tips ?? [],
        usedFrameIndex: p.usedFrameIndex
      }))
    };

    console.log('Calling OpenAI with phase data for session:', sessionId);

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(userPrompt) }
        ],
        max_completion_tokens: 700,
        response_format: { type: 'json_object' }
      }),
    });

    if (!openaiResponse.ok) {
      console.error('OpenAI API error:', await openaiResponse.text());
      return new Response(JSON.stringify({ error: 'Analysis generation failed' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const openaiData = await openaiResponse.json();
    const analysisResults = JSON.parse(openaiData.choices[0].message.content);

    // Add metadata to analysis results
    const enhancedResults = {
      ...analysisResults,
      metadata: {
        sessionId,
        completedPhases: completedPhases.length,
        totalPhases: phaseResults?.length || 0,
        processedAt: new Date().toISOString(),
        modelUsed: 'gpt-4.1-2025-04-14'
      }
    };

    // Check if analysis already exists for this session
    const { data: existingAnalysis } = await supabase
      .from('pro_ai_analyses')
      .select('id')
      .eq('session_id', sessionId)
      .single();

    let analysisId: string;

    if (existingAnalysis) {
      // Update existing analysis
      const { data, error } = await supabase
        .from('pro_ai_analyses')
        .update({
          analysis_results: enhancedResults,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingAnalysis.id)
        .select('id')
        .single();

      if (error) {
        console.error('Error updating analysis:', error);
        return new Response(JSON.stringify({ error: 'Failed to save analysis' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      analysisId = data.id;
    } else {
      // Create new analysis
      const { data, error } = await supabase
        .from('pro_ai_analyses')
        .insert({
          user_id: user.id,
          session_id: sessionId,
          analysis_results: enhancedResults,
          video_url: session.video_url
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating analysis:', error);
        return new Response(JSON.stringify({ error: 'Failed to save analysis' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      analysisId = data.id;
    }

    console.log(`Analysis completed for session ${sessionId}, saved as ${analysisId}`);

    return new Response(JSON.stringify({
      analysisId,
      analysisResults: enhancedResults,
      createdAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in swing-summarize function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});