import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { review_id, course_id, reviewer_id, course_name, rating } = await req.json();

    if (!review_id || !course_id || !reviewer_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role to bypass RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Deduplicate — don't re-notify if notifications for this review already exist
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('type', 'friend_course_review')
      .eq('actor_id', reviewer_id)
      .eq('entity_id', course_id)
      .contains('data', { review_id })
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ skipped: true, reason: 'already_notified' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all accepted friends of the reviewer
    const { data: friendships, error: friendsError } = await supabase
      .from('user_friends')
      .select('user_id, friend_id')
      .or(`user_id.eq.${reviewer_id},friend_id.eq.${reviewer_id}`)
      .eq('status', 'accepted');

    if (friendsError) {
      console.error('[notify-friend-review] Error fetching friends:', friendsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch friends' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!friendships || friendships.length === 0) {
      return new Response(JSON.stringify({ inserted: 0, reason: 'no_friends' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Derive friend IDs (the other side of each friendship)
    const friendIds = friendships.map(f =>
      f.user_id === reviewer_id ? f.friend_id : f.user_id
    );

    // Build one notification row per friend
    const notifications = friendIds.map(friendId => ({
      user_id: friendId,
      recipient_actor_type: 'personal',
      recipient_actor_id: friendId,
      type: 'friend_course_review',
      title: 'reviewed a course',
      actor_id: reviewer_id,
      entity_type: 'course',
      entity_id: course_id,
      is_read: false,
      is_deleted: false,
      data: {
        course_id,
        course_name: course_name || 'a course',
        rating: rating ?? null,
        review_id,
      },
    }));

    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (insertError) {
      console.error('[notify-friend-review] Insert error:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to insert notifications' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ inserted: notifications.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[notify-friend-review] Unexpected error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
