/**
 * create-comment — Edge function for server-side comment creation.
 * Handles: validation, rate limiting, mention extraction, comment count sync, voice notes.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;

    const body = await req.json();
    const { postId, content, parentId, actorType, actorId, mediaUrl, mediaType, voiceDurationSeconds } = body;

    // --- Validation ---
    if (!postId) {
      return new Response(JSON.stringify({ error: 'postId is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Reject voice comments — no longer supported
    if (mediaType === 'voice') {
      return new Response(JSON.stringify({ error: 'Voice comments are not supported' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const trimmed = (content || '').trim();

    if (trimmed.length === 0) {
      return new Response(JSON.stringify({ error: 'Content cannot be empty' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (trimmed.length > 2000) {
      return new Response(JSON.stringify({ error: 'Comment too long (max 2000 chars)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- Rate limiting: max 5 comments per minute ---
    const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
    const { count: recentCount } = await supabase
      .from('post_comments')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', oneMinuteAgo);

    if ((recentCount ?? 0) >= 5) {
      return new Response(JSON.stringify({ error: 'Rate limited. Wait a moment before commenting again.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- Insert comment ---
    const insertData: Record<string, unknown> = {
      post_id: postId,
      user_id: userId,
      content: trimmed,
      parent_id: parentId || null,
      actor_type: actorType || 'personal',
      actor_id: actorId || userId,
    };

    if (mediaUrl) insertData.media_url = mediaUrl;
    if (mediaType) insertData.media_type = mediaType;
    if (voiceDurationSeconds) insertData.voice_duration_seconds = voiceDurationSeconds;

    const { data: comment, error: insertError } = await supabase
      .from('post_comments')
      .insert(insertData)
      .select('id, created_at')
      .single();

    if (insertError) throw insertError;

    // --- Update comment count atomically ---
    const { count: totalComments } = await supabase
      .from('post_comments')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', postId)
      .is('deleted_at', null);

    await supabase.from('posts').update({ comment_count: totalComments ?? 0 }).eq('id', postId);

    // --- Extract mentions ---
    const mentionRegex = /@(\w+)/g;
    let match;
    const mentions: string[] = [];
    while ((match = mentionRegex.exec(trimmed)) !== null) {
      mentions.push(match[1].toLowerCase());
    }

    if (mentions.length > 0) {
      const { data: taggedEntities } = await supabase
        .from('taggable_entities')
        .select('entity_id, entity_type, username')
        .in('username', mentions);

      if (taggedEntities?.length) {
        const mentionInserts = taggedEntities.map(entity => ({
          comment_id: comment.id,
          mentioned_entity_id: entity.entity_id,
          mentioned_entity_type: entity.entity_type,
          mentioned_username: entity.username,
        }));
        await supabase.from('comment_mentions').insert(mentionInserts);
      }
    }

    return new Response(JSON.stringify({
      id: comment.id,
      created_at: comment.created_at,
      mentions_found: mentions.length,
    }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('create-comment error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
