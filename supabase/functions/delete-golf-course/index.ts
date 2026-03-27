import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { courseId } = await req.json();
    if (!courseId) {
      return new Response(JSON.stringify({ error: 'courseId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Safety checks — block deletion if real user data exists ────────────────

    const [ratingsResult, postsResult, shortlistsResult] = await Promise.all([
      supabase
        .from('course_ratings')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', courseId),
      supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', courseId),
      supabase
        .from('course_shortlists')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', courseId),
    ]);

    const ratingCount = ratingsResult.count ?? 0;
    const postCount = postsResult.count ?? 0;
    const shortlistCount = shortlistsResult.count ?? 0;

    if (ratingCount > 0 || postCount > 0) {
      return new Response(JSON.stringify({
        error: 'Cannot delete',
        reason: `This course has ${ratingCount} rating${ratingCount !== 1 ? 's' : ''} and ${postCount} post${postCount !== 1 ? 's' : ''} from users. Remove all user data first or merge this course with a duplicate instead.`,
        counts: { ratings: ratingCount, posts: postCount, shortlists: shortlistCount },
      }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Safe to delete — cascade in dependency order ───────────────────────────

    const deletions = [
      supabase.from('sr_course_map').delete().eq('golf_course_id', courseId),
      supabase.from('course_top100_memberships').delete().eq('course_id', courseId),
      supabase.from('business_claimed_courses').delete().eq('course_id', courseId),
      supabase.from('user_top10_exclusions').delete().eq('course_id', courseId),
      supabase.from('course_shortlists').delete().eq('course_id', courseId),
      supabase.from('user_courses').delete().eq('course_id', courseId),
    ];

    for (const deletion of deletions) {
      const { error } = await deletion;
      if (error) {
        console.error('Deletion step failed:', error);
      }
    }

    // ── Finally delete the course itself ──────────────────────────────────────

    const { error: courseError } = await supabase
      .from('golf_courses')
      .delete()
      .eq('id', courseId);

    if (courseError) {
      return new Response(JSON.stringify({
        error: 'Failed to delete course',
        detail: courseError.message,
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
