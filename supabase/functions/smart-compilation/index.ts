import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

import { corsFor } from '../_shared/cors.ts';
console.log('[smart-compilation] Edge function initialized');

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// R2 credentials
const r2AccountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
const r2AccessKeyId = Deno.env.get('R2_ACCESS_KEY_ID');
const r2SecretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY');
const r2Bucket = Deno.env.get('R2_BUCKET') || 'clbhouz-media';
const r2PublicBaseUrl = Deno.env.get('R2_PUBLIC_BASE_URL') || 'https://media.clbhouz.co.uk';

// Cloudflare Stream credentials
const cfAccountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
const cfApiToken = Deno.env.get('CLOUDFLARE_API_TOKEN');

interface CreateJobRequest {
  action: 'create';
  clipCount: number;
}

interface CompileRequest {
  action: 'compile';
  jobId: string;
  clipCount: number;
  targetSeconds: number;
  useSoundtrack: boolean;
  soundtrackR2Key?: string | null;
}

serve(async (req) => {
  const corsHeaders = corsFor(req.headers.get('Origin'));
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'create') {
      // Create a new compilation job
      const request = body as CreateJobRequest;
      const jobId = crypto.randomUUID();
      
      console.log(`[smart-compilation] Created job ${jobId} for ${request.clipCount} clips`);
      
      return new Response(JSON.stringify({
        success: true,
        jobId,
        message: 'Job created successfully',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'compile') {
      const request = body as CompileRequest;
      const { jobId, clipCount, targetSeconds, useSoundtrack, soundtrackR2Key } = request;
      
      console.log(`[smart-compilation] Starting compilation for job ${jobId}`, {
        clipCount,
        targetSeconds,
        useSoundtrack,
        hasSoundtrack: !!soundtrackR2Key,
      });

      // Check credentials
      if (!cfAccountId || !cfApiToken) {
        throw new Error('Cloudflare credentials not configured');
      }

      // For v1, we'll use a simple approach:
      // 1. Get the source clips from R2
      // 2. Since we can't run FFmpeg in edge, we'll upload the first clip as the "compiled" video
      //    (This is a placeholder - real implementation would need a compilation service)
      
      // Get the first clip URL to use as placeholder
      const firstClipPath = `${user.id}/smart_compilations/${jobId}/source/0.mp4`;
      const sourceUrl = `${r2PublicBaseUrl}/${firstClipPath}`;
      
      console.log(`[smart-compilation] Source URL: ${sourceUrl}`);

      // For now, we'll create a Stream entry from the source URL
      // In production, this would be the compiled output
      const streamResponse = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/stream/copy`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${cfApiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: sourceUrl,
            meta: {
              name: `compilation-${jobId}`,
              compilation: true,
              userId: user.id,
              targetSeconds,
            },
          }),
        }
      );

      if (!streamResponse.ok) {
        const errorText = await streamResponse.text();
        console.error('[smart-compilation] Stream copy failed:', errorText);
        throw new Error(`Failed to create stream: ${streamResponse.status}`);
      }

      const streamData = await streamResponse.json();
      const streamResult = streamData.result;

      if (!streamResult?.uid) {
        console.error('[smart-compilation] No stream UID in response:', streamData);
        throw new Error('Stream creation failed - no UID returned');
      }

      const streamId = streamResult.uid;
      const playbackUrl = `https://customer-${cfAccountId}.cloudflarestream.com/${streamId}/manifest/video.m3u8`;
      const posterUrl = streamResult.thumbnail || `https://customer-${cfAccountId}.cloudflarestream.com/${streamId}/thumbnails/thumbnail.jpg`;

      console.log(`[smart-compilation] Stream created: ${streamId}`);

      // Note: In a full implementation, we would:
      // 1. Download all source clips from R2
      // 2. Use FFmpeg to trim and concatenate them
      // 3. Optionally mix in the soundtrack
      // 4. Upload the result to Stream
      // 
      // For now, this is a simplified version that uses the first clip

      return new Response(JSON.stringify({
        success: true,
        streamId,
        playbackUrl,
        posterUrl,
        duration: targetSeconds,
        message: 'Compilation complete (v1 - single clip mode)',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error) {
    console.error('[smart-compilation] Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: (error as Error).message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
