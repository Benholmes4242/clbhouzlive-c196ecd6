import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

import { corsFor } from '../_shared/cors.ts';
import { requireInternalSecret } from '../_shared/internalAuth.ts';

type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  profile_photo_url: string | null;
  bio: string | null;
  home_club: string | null;
  handicap: number | null;
  website: string | null;
  instagram: string | null;
  twitter: string | null;
  tiktok: string | null;
  youtube: string | null;
  is_verified_golfer: boolean | null;
};

type SignalsUpsert = {
  user_id: string;
  profile_completeness_score: number;
  has_external_links: boolean;
  mentions_30d: number;
  unique_mentioners_30d: number;
  course_tags_30d: number;
  top100_course_tags_30d: number;
  followers_count: number;
  engagement_score_30d: number;
  candidate_state: "monitor" | "notable_candidate" | "high_confidence_candidate";
  last_computed_at: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function calcCompleteness(p: Profile): number {
  const checks: boolean[] = [
    !!p.profile_photo_url,
    !!p.display_name || !!p.username,
    !!(p.bio && p.bio.trim().length >= 10),
    !!p.home_club,
    p.handicap !== null && p.handicap !== undefined,
    !!(p.website || p.instagram || p.twitter || p.tiktok || p.youtube),
  ];
  const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  return clamp(score, 0, 100);
}

function hasExternalLinks(p: Profile): boolean {
  return !!(p.website || p.instagram || p.twitter || p.tiktok || p.youtube);
}

function calcEngagementScore30d(input: {
  mentions30d: number;
  uniqueMentioners30d: number;
  courseTags30d: number;
  top100Tags30d: number;
  followers: number;
  completeness: number;
  hasLinks: boolean;
}): number {
  const score =
    input.completeness * 0.25 +
    (input.hasLinks ? 8 : 0) +
    clamp(input.mentions30d, 0, 20) * 1.2 +
    clamp(input.uniqueMentioners30d, 0, 10) * 2.0 +
    clamp(input.courseTags30d, 0, 20) * 0.8 +
    clamp(input.top100Tags30d, 0, 10) * 3.0 +
    clamp(Math.log10(Math.max(input.followers, 1)) * 10, 0, 30);

  return clamp(Math.round(score), 0, 100);
}

function deriveCandidateState(input: {
  completeness: number;
  hasLinks: boolean;
  mentions30d: number;
  uniqueMentioners30d: number;
  courseTags30d: number;
  top100Tags30d: number;
  followers: number;
  engagementScore30d: number;
}): "monitor" | "notable_candidate" | "high_confidence_candidate" {
  // High confidence thresholds
  const highConfidence =
    input.top100Tags30d >= 3 ||
    input.uniqueMentioners30d >= 5 ||
    (input.hasLinks && input.mentions30d >= 5) ||
    input.engagementScore30d >= 60;

  if (highConfidence) return "high_confidence_candidate";

  // Notable thresholds
  const notable =
    input.mentions30d >= 3 ||
    input.courseTags30d >= 5 ||
    input.hasLinks ||
    (input.followers >= 500 && input.engagementScore30d >= 30);

  if (notable) return "notable_candidate";

  return "monitor";
}

// Get followers count from follows table
async function getFollowersCount(supabase: any, userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("follows")
    .select("id", { count: "exact", head: true })
    .eq("following_profile_id", userId);
  
  if (error) {
    console.log(`Error fetching followers for ${userId}:`, error.message);
    return 0;
  }
  return count ?? 0;
}

// Get course ratings as "course tags" from course_ratings table
async function getCourseTags30d(supabase: any, userId: string, sinceIso: string): Promise<{ courseTags: number; top100CourseTags: number }> {
  // Get all ratings by user in last 30 days
  const { data: ratings, error } = await supabase
    .from("course_ratings")
    .select("course_id")
    .eq("user_id", userId)
    .gte("created_at", sinceIso);

  if (error || !ratings) {
    console.log(`Error fetching course tags for ${userId}:`, error?.message);
    return { courseTags: 0, top100CourseTags: 0 };
  }

  const courseTags = ratings.length;
  
  // Check how many are Top 100 courses
  if (courseTags === 0) return { courseTags: 0, top100CourseTags: 0 };

  const courseIds = ratings.map((r: any) => r.course_id);
  const { data: top100Memberships, error: top100Error } = await supabase
    .from("course_top100_memberships")
    .select("course_id")
    .in("course_id", courseIds);

  if (top100Error) {
    console.log(`Error fetching top100 memberships:`, top100Error.message);
    return { courseTags, top100CourseTags: 0 };
  }

  const top100CourseIds = new Set(top100Memberships?.map((m: any) => m.course_id) || []);
  const top100CourseTags = ratings.filter((r: any) => top100CourseIds.has(r.course_id)).length;

  return { courseTags, top100CourseTags };
}

// Mentions — read from the canonical `mentions` table via the security-definer
// helper `get_user_mention_signals_30d(user_id, since)`. Returns 30-day totals
// (any mentioned_type='user' rows) and the distinct mentioner count.
async function getMentions30d(supabase: any, userId: string, sinceIso: string): Promise<{ mentions: number; uniqueMentioners: number }> {
  const { data, error } = await supabase.rpc('get_user_mention_signals_30d', {
    p_user_id: userId,
    p_since: sinceIso,
  });
  if (error) {
    console.warn('get_user_mention_signals_30d failed:', error.message);
    return { mentions: 0, uniqueMentioners: 0 };
  }
  const row = Array.isArray(data) ? data[0] : data;
  return {
    mentions: Number(row?.mentions_count ?? 0),
    uniqueMentioners: Number(row?.unique_mentioners_count ?? 0),
  };
}

serve(async (req) => {
  const corsHeaders = corsFor(req.headers.get('Origin'));
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Batch maintenance job, not a member-facing endpoint: guard with the shared
  // internal secret rather than a user JWT. Fail-closed if the secret is unset.
  const gate = requireInternalSecret(req, corsHeaders);
  if (gate) return gate;



  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // Parse URL params for batching
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") ?? "500");
    const offset = Number(url.searchParams.get("offset") ?? "0");

    // 30 days ago
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const nowIso = new Date().toISOString();

    console.log(`Computing signals: limit=${limit}, offset=${offset}, since=${since}`);

    // Fetch profiles (personal, not already verified)
    const { data: profiles, error: profErr } = await supabase
      .from("user_profiles")
      .select("id, username, display_name, profile_photo_url, bio, home_club, handicap, website, instagram, twitter, tiktok, youtube, is_verified_golfer")
      .eq("profile_type", "personal")
      .eq("is_verified_golfer", false)
      .order("id", { ascending: true })
      .range(offset, offset + limit - 1);

    if (profErr) {
      console.error("Error fetching profiles:", profErr);
      throw profErr;
    }

    console.log(`Processing ${profiles?.length || 0} profiles`);

    const upserts: SignalsUpsert[] = [];

    for (const p of (profiles ?? []) as Profile[]) {
      const completeness = calcCompleteness(p);
      const links = hasExternalLinks(p);

      const followers = await getFollowersCount(supabase, p.id);
      const mentionStats = await getMentions30d(supabase, p.id, since);
      const courseStats = await getCourseTags30d(supabase, p.id, since);

      const engagementScore = calcEngagementScore30d({
        mentions30d: mentionStats.mentions,
        uniqueMentioners30d: mentionStats.uniqueMentioners,
        courseTags30d: courseStats.courseTags,
        top100Tags30d: courseStats.top100CourseTags,
        followers,
        completeness,
        hasLinks: links,
      });

      const state = deriveCandidateState({
        completeness,
        hasLinks: links,
        mentions30d: mentionStats.mentions,
        uniqueMentioners30d: mentionStats.uniqueMentioners,
        courseTags30d: courseStats.courseTags,
        top100Tags30d: courseStats.top100CourseTags,
        followers,
        engagementScore30d: engagementScore,
      });

      upserts.push({
        user_id: p.id,
        profile_completeness_score: completeness,
        has_external_links: links,
        mentions_30d: mentionStats.mentions,
        unique_mentioners_30d: mentionStats.uniqueMentioners,
        course_tags_30d: courseStats.courseTags,
        top100_course_tags_30d: courseStats.top100CourseTags,
        followers_count: followers,
        engagement_score_30d: engagementScore,
        candidate_state: state,
        last_computed_at: nowIso,
      });
    }

    // Upsert in batches
    const batchSize = 100;
    let upsertedCount = 0;

    for (let i = 0; i < upserts.length; i += batchSize) {
      const batch = upserts.slice(i, i + batchSize);
      const { error: upErr } = await supabase
        .from("golfer_eligibility_signals")
        .upsert(batch, { onConflict: "user_id" });

      if (upErr) {
        console.error(`Error upserting batch ${i / batchSize}:`, upErr);
      } else {
        upsertedCount += batch.length;
      }
    }

    console.log(`Computation complete. Upserted ${upsertedCount} signals.`);

    return new Response(
      JSON.stringify({
        ok: true,
        processed: profiles?.length ?? 0,
        upserted: upsertedCount,
        since,
        now: nowIso,
        limit,
        offset,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Error in compute-golfer-eligibility-signals:", e);
    return new Response(
      JSON.stringify({ ok: false, error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
