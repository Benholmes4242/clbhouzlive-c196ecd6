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
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response('Missing Authorization header', { 
        status: 401,
        headers: corsHeaders 
      });
    }

    const jwt = authHeader.replace('Bearer ', '');
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId');
    
    if (!sessionId) {
      return new Response('Missing sessionId parameter', { 
        status: 400,
        headers: corsHeaders 
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user token
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !user) {
      console.error('Auth verification failed:', authError);
      return new Response('Unauthorized', { 
        status: 401,
        headers: corsHeaders 
      });
    }

    console.log(`[Proxy] Authenticated user ${user.id} for session ${sessionId}`);

    // Create upstream connection to swing-session-stream with proper auth
    const upstreamUrl = `${supabaseUrl}/functions/v1/swing-session-stream?sessionId=${encodeURIComponent(sessionId)}&access_token=${encodeURIComponent(jwt)}`;
    
    const upstreamResponse = await fetch(upstreamUrl, {
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });

    if (!upstreamResponse.ok || !upstreamResponse.body) {
      console.error('Upstream connection failed:', upstreamResponse.status, upstreamResponse.statusText);
      return new Response(`Upstream error: ${upstreamResponse.status}`, { 
        status: upstreamResponse.status,
        headers: corsHeaders 
      });
    }

    console.log(`[Proxy] Connected to upstream SSE for session ${sessionId}`);

    // Create transform stream to pipe upstream to client
    const { readable, writable } = new TransformStream();
    
    // Start piping in the background
    upstreamResponse.body.pipeTo(writable).catch(error => {
      console.error('Pipe error:', error);
    });

    return new Response(readable, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable proxy buffering
      },
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return new Response('Proxy error', { 
      status: 500,
      headers: corsHeaders 
    });
  }
});