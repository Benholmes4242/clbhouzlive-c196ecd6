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
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId');
    const accessToken = url.searchParams.get('access_token');
    
    if (!sessionId || !accessToken) {
      return new Response('Missing sessionId or access_token', { 
        status: 400,
        headers: corsHeaders 
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user token
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return new Response('Unauthorized', { 
        status: 401,
        headers: corsHeaders 
      });
    }

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('swing_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return new Response('Session not found', { 
        status: 404,
        headers: corsHeaders 
      });
    }

    // Create SSE stream with proper headers and format
    const stream = new ReadableStream({
      start(controller) {
        const send = (obj: any, event?: string) => {
          try {
            if (event) {
              controller.enqueue(`event: ${event}\n`);
            }
            controller.enqueue(`data: ${JSON.stringify(obj)}\n\n`);
          } catch (error) {
            console.error('Error sending SSE event:', error);
          }
        };

        // Send initial status for each phase
        const phases = ['setup', 'takeaway', 'backswing', 'top', 'downswing', 'impact', 'followThrough'];
        
        phases.forEach(phase => {
          send({ type: 'status', sessionId, phase, status: 'started' }, 'status');
        });

        // Simulate phase processing with realistic timing
        let phaseIndex = 0;
        
        const processNextPhase = () => {
          if (phaseIndex >= phases.length) {
            send({ type: 'complete', sessionId, summaryReady: false }, 'complete');
            clearInterval(keepaliveInterval);
            controller.close();
            return;
          }

          const phase = phases[phaseIndex];
          const frameIndex = phaseIndex + 1; // Simple mapping for now
          
          // Send progress updates
          send({ type: 'progress', sessionId, phase, etaMs: 3000 }, 'progress');
          
          // Simulate processing time (2-4 seconds per phase)
          setTimeout(() => {
            try {
              // Send partial result with frame flick
              send({ 
                type: 'partial', 
                sessionId, 
                phase, 
                frameIndex,
                visualHint: { label: `${phase.charAt(0).toUpperCase() + phase.slice(1)} Analysis` }
              }, 'partial');

              // Complete phase after brief delay
              setTimeout(() => {
                try {
                  send({
                    type: 'done',
                    sessionId,
                    phase,
                    frameIndex,
                    metrics: generateMockMetrics(phase),
                    tips: [`Improve your ${phase} position by...`],
                    visualPlan: {
                      caption: `${phase.charAt(0).toUpperCase() + phase.slice(1)} analysis shows good form`,
                      frameHint: getFrameHint(phase),
                      overlays: {
                        lines: generateMockLines(phase),
                        angles: generateMockAngles(phase),
                        keypoints: generateMockKeypoints(phase)
                      }
                    }
                  }, 'done');

                  // Update database
                  supabase
                    .from('swing_phase_results')
                    .update({ 
                      status: 'done',
                      used_frame_index: frameIndex,
                      metrics: generateMockMetrics(phase),
                      tips: [`Improve your ${phase} position by...`],
                      finished_at: new Date().toISOString()
                    })
                    .eq('session_id', sessionId)
                    .eq('phase', phase)
                    .then(({ error }) => {
                      if (error) console.error(`Error updating ${phase}:`, error);
                    });

                  phaseIndex++;
                  setTimeout(processNextPhase, 500); // Brief pause between phases
                } catch (error) {
                  console.error(`Error completing phase ${phase}:`, error);
                  send({ type: 'error', sessionId, phase, message: String(error) }, 'error');
                  phaseIndex++;
                  setTimeout(processNextPhase, 500);
                }
              }, 1000);
            } catch (error) {
              console.error(`Error processing phase ${phase}:`, error);
              send({ type: 'error', sessionId, phase, message: String(error) }, 'error');
              phaseIndex++;
              setTimeout(processNextPhase, 500);
            }
          }, Math.random() * 2000 + 2000); // 2-4 second processing time
        };

        // Start processing phases
        setTimeout(processNextPhase, 1000);

        // Keepalive every 15 seconds
        const keepaliveInterval = setInterval(() => {
          try {
            controller.enqueue(`event: keepalive\ndata: {}\n\n`);
          } catch (error) {
            console.error('Error sending keepalive:', error);
            clearInterval(keepaliveInterval);
          }
        }, 15000);

        // Handle client disconnect
        req.signal?.addEventListener('abort', () => {
          clearInterval(keepaliveInterval);
          try {
            controller.close();
          } catch (error) {
            console.error('Error closing controller:', error);
          }
        });
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      }
    });

  } catch (error) {
    console.error('Error in swing-session-stream:', error);
    return new Response('Internal server error', { 
      status: 500,
      headers: corsHeaders 
    });
  }
});

function generateMockMetrics(phase: string): Record<string, any> {
  const baseMetrics = {
    conf: Math.random() * 0.3 + 0.7 // 0.7-1.0 confidence
  };

  switch (phase) {
    case 'setup':
      return { ...baseMetrics, spineAngle: 35, ballPos: 'forward', alignment: 'square' };
    case 'takeaway':
      return { ...baseMetrics, clubPath: 'on-plane', width: 'good' };
    case 'backswing':
      return { ...baseMetrics, depth: 'optimal', plane: 'on-track' };
    case 'top':
      return { ...baseMetrics, shoulderTurn: 90, wristSet: 'proper' };
    case 'downswing':
      return { ...baseMetrics, sequencing: 'good', shallowing: true };
    case 'impact':
      return { ...baseMetrics, shaftLeanDeg: 7, handsAheadCm: 5, headStability: 'stable' };
    case 'followThrough':
      return { ...baseMetrics, balance: 'stable', rotation: 'complete' };
    default:
      return baseMetrics;
  }
}

function getFrameHint(phase: string): string {
  const frameHints: Record<string, string> = {
    setup: 'P1',
    takeaway: 'P2', 
    backswing: 'P3',
    top: 'P4',
    downswing: 'P5',
    impact: 'P6',
    followThrough: 'P7'
  };
  return frameHints[phase] || 'P1';
}

function generateMockLines(phase: string): any[] {
  switch (phase) {
    case 'setup':
      return [{ x1: 640, y1: 200, x2: 640, y2: 600, label: 'spine_angle' }];
    case 'impact':
      return [{ x1: 600, y1: 300, x2: 800, y2: 250, label: 'shaft_lean' }];
    default:
      return [];
  }
}

function generateMockAngles(phase: string): any[] {
  switch (phase) {
    case 'top':
      return [{ cx: 500, cy: 300, a: 45, b: 135, label: 'shoulder_turn' }];
    case 'impact':
      return [{ cx: 550, cy: 400, a: 0, b: 30, label: 'hip_rotation' }];
    default:
      return [];
  }
}

function generateMockKeypoints(phase: string): any[] {
  switch (phase) {
    case 'setup':
      return [{ x: 520, y: 350, label: 'ball_position', conf: 0.9 }];
    case 'impact':
      return [
        { x: 480, y: 280, label: 'lead_wrist', conf: 0.85 },
        { x: 500, y: 350, label: 'club_head', conf: 0.92 }
      ];
    default:
      return [];
  }
}
