import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Current ISO week label e.g. '2026-W14'
  const now = new Date();
  const week = `${now.getFullYear()}-W${String(getISOWeek(now)).padStart(2, '0')}`;

  // Don't re-run if already selected this week
  const { count } = await supabase
    .from('course_ratings')
    .select('id', { count: 'exact', head: true })
    .eq('review_of_week_week', week);

  if ((count ?? 0) > 0) {
    return new Response(JSON.stringify({ message: 'Already selected for this week' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Fetch candidates — reviews from past 30 days with text
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: candidates } = await supabase
    .from('course_ratings')
    .select('id, rating, review, design_score, condition_score, clubhouse_score, facilities_score, helpful_count, user_id, course_id')
    .not('review', 'is', null)
    .not('review', 'eq', '')
    .gte('created_at', thirtyDaysAgo)
    .eq('is_review_of_week', false);

  if (!candidates || candidates.length === 0) {
    return new Response(JSON.stringify({ message: 'No candidates found' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Fetch media counts for all candidates
  const ids = candidates.map((c: any) => c.id);
  const { data: mediaRows } = await supabase
    .from('course_review_media')
    .select('review_id')
    .in('review_id', ids);

  const mediaCountMap = new Map<string, number>();
  for (const row of (mediaRows ?? [])) {
    mediaCountMap.set(row.review_id, (mediaCountMap.get(row.review_id) ?? 0) + 1);
  }

  // Score each candidate
  const scored = candidates.map((r: any) => {
    let score = 0;
    // Text length: up to 40 points (max at 400+ chars)
    score += Math.min((r.review?.length ?? 0) / 10, 40);
    // Has all 4 breakdowns: 20 points
    const breakdowns = [r.design_score, r.condition_score, r.clubhouse_score, r.facilities_score];
    const hasAllBreakdowns = breakdowns.every((b: any) => b != null);
    score += hasAllBreakdowns ? 20 : breakdowns.filter((b: any) => b != null).length * 4;
    // Photos: 5 points each, up to 20
    score += Math.min((mediaCountMap.get(r.id) ?? 0) * 5, 20);
    // Helpful votes: 2 points each, up to 20
    score += Math.min((r.helpful_count ?? 0) * 2, 20);
    // Rating richness (avoid extremes — 7–9.5 scores well)
    const rating = r.rating ?? 0;
    if (rating >= 7 && rating <= 9.5) score += 10;
    return { ...r, score };
  });

  // Pick winner
  scored.sort((a: any, b: any) => b.score - a.score);
  const winner = scored[0];

  // Clear previous week's winner
  await supabase
    .from('course_ratings')
    .update({ is_review_of_week: false, review_of_week_week: null })
    .eq('is_review_of_week', true);

  // Mark new winner
  await supabase
    .from('course_ratings')
    .update({ is_review_of_week: true, review_of_week_week: week })
    .eq('id', winner.id);

  return new Response(JSON.stringify({ selected: winner.id, score: winner.score, week }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
