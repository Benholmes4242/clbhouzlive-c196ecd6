import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SYSTEM_USER_ID = 'b8437384-291a-4d85-b81f-24c1068235dd';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { tournamentId, tournamentName } = await req.json();

    if (!tournamentId) {
      return new Response(JSON.stringify({ error: 'tournamentId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role client to bypass RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Guard: verify system user exists before attempting insert
    const { data: systemUser } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', SYSTEM_USER_ID)
      .maybeSingle();

    if (!systemUser) {
      console.error('[upsert-live-tournament-post] System user not found — aborting');
      return new Response(JSON.stringify({ error: 'System user not found', postId: null }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if post already exists
    const { data: existing } = await supabase
      .from('posts')
      .select('id')
      .eq('post_type', 'tournament_live')
      .eq('content', tournamentId)
      .maybeSingle();

    if (existing?.id) {
      return new Response(JSON.stringify({ postId: existing.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create new post
    const { data: created, error } = await supabase
      .from('posts')
      .insert({
        user_id:       SYSTEM_USER_ID,
        actor_type:    'system',
        actor_id:      SYSTEM_USER_ID,
        post_type:     'tournament_live',
        content:       tournamentId,
        visibility:    'anyone',
        categories:    [],
        badges:        [],
        like_count:    0,
        comment_count: 0,
        status:        'published',
      })
      .select('id')
      .single();

    if (error || !created) {
      console.error('[upsert-live-tournament-post] Failed to create live post:', error);
      return new Response(JSON.stringify({ error: error?.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[upsert-live-tournament-post] Created post ${created.id} for ${tournamentName ?? tournamentId}`);

    return new Response(JSON.stringify({ postId: created.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
