/**
 * generate-editorial-cards
 *
 * Runs every Monday at 6am UTC via pg_cron.
 * Generates three editorial feed cards using the same multi-model
 * consensus pattern as generate-predictions:
 *
 *   1. History Card    — Perplexity finds a real "this week in golf history" moment
 *   2. Course of Week  — Claude picks the best course from your DB based on rules
 *   3. Weekly Debate   — GPT-4 generates a polarising golf opinion with two named courses
 *
 * Each card is stored in editorial_feed_cards with active_from = now(),
 * active_until = now() + 7 days. Previous week's cards are deactivated first.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface CourseCandidate {
  id: string;
  name: string;
  country: string;
  sub_country: string | null;
  global_rank: number | null;
  description: string | null;
  has_hosted_major: boolean | null;
  course_type: string | null;
  review_count: number;
  avg_rating: number | null;
  recent_review_count: number; // reviews in last 30 days
}

interface GeneratedHistoryCard {
  title: string;
  body: string;
  body_extended: string;
  history_year: number;
  history_date: string;
  linked_course_name: string | null; // used to look up course_id
}

interface GeneratedCourseCard {
  course_id: string;
  title: string;
  course_editorial_blurb: string;
}

interface GeneratedDebateCard {
  title: string;
  body: string;
  debate_option_a: string;
  debate_option_b: string;
  course_name_a: string | null; // used to look up course_id
  course_name_b: string | null;
}

// ─── API Callers (mirrors consensusEngine.ts pattern) ─────────────────────────

async function callPerplexity(prompt: string): Promise<string> {
  const apiKey = Deno.env.get('PERPLEXITY_API_KEY_1') || Deno.env.get('PERPLEXITY_API_KEY');
  if (!apiKey) throw new Error('PERPLEXITY_API_KEY not configured');

  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: 'You are a golf historian and journalist. Return only valid JSON with no markdown, no code fences, no explanation outside the JSON object.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 800,
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Perplexity error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callClaude(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text || '';
}

async function callGPT4(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 800,
      temperature: 0.4,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GPT-4 error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// ─── JSON Parser (robust — strips markdown fences if model adds them) ─────────

function parseJSON<T>(raw: string): T {
  const cleaned = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
  return JSON.parse(cleaned) as T;
}

// ─── Step 1: Generate History Card via Perplexity ─────────────────────────────

async function generateHistoryCard(weekDates: string, weekDaysList: string): Promise<GeneratedHistoryCard> {
  const prompt = `
STRICT DATE REQUIREMENT: You must find a golf history moment that occurred on one of these EXACT calendar dates (any year): ${weekDaysList}

This is not optional. The event MUST have happened on one of the dates listed above. Do not pick events from other dates even if they are more famous.

Search for real, verifiable golf history events on these specific dates. Good sources: major championship records, Ryder Cup results, PGA Tour history, golf world records.

If multiple events match, pick the most compelling one. If no Major championship events match, pick any significant professional golf event on those dates.

Week context: ${weekDates}

Return a JSON object with this exact structure:
{
  "title": "Short punchy headline — max 60 characters e.g. 'Tiger wins The Masters by 12 shots'",
  "body": "2-3 sentence summary suitable for a social feed. Compelling and factual. Max 200 characters.",
  "body_extended": "Full paragraph — 4-6 sentences with context, significance, and why it matters to golfers today. Max 500 characters.",
  "history_year": 1997,
  "history_date": "Mar 29",
  "linked_course_name": "Augusta National Golf Club"
}

Rules:
- history_date MUST be one of the dates from the list above — formatted as "Mon DD" e.g. "Mar 29"
- history_year must be the actual year the event occurred
- linked_course_name must be the exact name of the course where the event took place
- If unsure of exact course name, set linked_course_name to null
- Return ONLY the JSON object, no other text
`;

  const raw = await callPerplexity(prompt);
  return parseJSON<GeneratedHistoryCard>(raw);
}

// ─── Step 2: Generate Course of the Week via Claude ───────────────────────────

async function generateCourseOfWeek(
  candidates: CourseCandidate[],
  currentMonth: number,
  upcomingTournamentName: string | null,
): Promise<GeneratedCourseCard> {

  const systemPrompt = `You are the editorial director of a world-class golf platform. 
You select a featured "Course of the Week" that will excite golfers and drive them to read reviews and add courses to their bucket list.
Return only valid JSON with no markdown or explanation outside the JSON object.`;

  const candidateList = candidates.slice(0, 50).map(c => ({
    id: c.id,
    name: c.name,
    country: c.country,
    sub_country: c.sub_country,
    global_rank: c.global_rank,
    has_hosted_major: c.has_hosted_major,
    course_type: c.course_type,
    review_count: c.review_count,
    avg_rating: c.avg_rating ? Math.round(c.avg_rating * 10) / 10 : null,
    recent_activity: c.recent_review_count,
  }));

  const seasonalContext = getSeasonalContext(currentMonth);

  const userPrompt = `
Select the best "Course of the Week" from the candidates below.

CRITICAL RULE: Every course in this list already has at least 1 community review on Clbhouz. You MUST only select a course_id that appears in this exact list. Never invent or suggest a course not in the list.

Current month: ${currentMonth} (${seasonalContext.season})
Seasonal theme: ${seasonalContext.theme}
${upcomingTournamentName ? `Upcoming PGA tournament this week: ${upcomingTournamentName}` : ''}

Selection criteria (in priority order):
1. If there is an upcoming tournament, prioritise a thematically linked course (same country, same style) — but ONLY if it has review_count > 0 in the list
2. Seasonally appropriate — ${seasonalContext.theme}
3. Prefer courses with review_count between 1–20 — featuring underreviewed gems builds our content base
4. High global rank (lower number = better) combined with high avg_rating — only feature courses golfers love
5. Prefer variety across regions and countries

Course candidates (JSON array):
${JSON.stringify(candidateList, null, 2)}

Return this exact JSON structure:
{
  "course_id": "the exact uuid from the candidates list",
  "title": "Course of the Week",
  "course_editorial_blurb": "2-3 sentences of compelling editorial copy about why this course is special and why golfers should add it to their bucket list. Be evocative and specific. Max 250 characters."
}

Return ONLY the JSON object.
`;

  const raw = await callClaude(systemPrompt, userPrompt);
  const result = parseJSON<GeneratedCourseCard>(raw);

  // Validate course_id exists in candidates
  const valid = candidates.find(c => c.id === result.course_id);
  if (!valid) {
    // Fallback: pick highest ranked course with fewest reviews
    const fallback = candidates
      .filter(c => c.global_rank !== null)
      .sort((a, b) => {
        const rankScore = (a.global_rank ?? 999) - (b.global_rank ?? 999);
        const reviewScore = a.review_count - b.review_count;
        return rankScore + reviewScore * 2;
      })[0];

    if (!fallback) throw new Error('No valid course candidate found');

    return {
      course_id: fallback.id,
      title: 'Course of the Week',
      course_editorial_blurb: fallback.description?.slice(0, 250) ?? `${fallback.name} — one of the world's great golf courses.`,
    };
  }

  return result;
}

// ─── Step 3: Generate Weekly Debate via GPT-4 ─────────────────────────────────

async function generateDebateCard(
  topCourses: { id: string; name: string; country: string; global_rank: number | null }[],
  usedCourseIdThisWeek: string | null,
): Promise<GeneratedDebateCard> {

  const systemPrompt = `You are a golf commentator known for sparking passionate debate among golf fans. 
You craft questions that every golfer has an opinion on — questions with no obviously correct answer.
Return only valid JSON with no markdown or explanation outside the JSON object.`;

  // Give GPT a pool of top courses to pick from so debate options are real courses on the platform
  const coursePool = topCourses
    .filter(c => c.id !== usedCourseIdThisWeek) // don't reuse this week's featured course
    .slice(0, 40)
    .map(c => ({ name: c.name, country: c.country, rank: c.global_rank }));

  const userPrompt = `
Generate one "Weekly Debate" card for a golf social app. The debate must be genuinely polarising — something passionate golfers argue about with no clear right answer.

Debate types that work well:
- Head-to-head: "Best links course — Royal Portrush or Turnberry?"
- Would you rather: "One round at Augusta vs three rounds at Pebble Beach?"
- Hot take: "St Andrews is overrated — agree or disagree?"
- Regional rivalry: "Scotland or Ireland — who has the better golf?"
- Era debate: "Nicklaus or Tiger — who is the greatest?"

The debate MUST involve at least one of these actual courses from our platform (use exact names from this list):
${JSON.stringify(coursePool.slice(0, 20), null, 2)}

Return this exact JSON structure:
{
  "title": "The debate question — max 70 characters, punchy and direct",
  "body": "1 sentence of context or provocation — max 120 characters",
  "debate_option_a": "Option A label — max 40 characters",
  "debate_option_b": "Option B label — max 40 characters",
  "course_name_a": "Exact course name from the list above, or null if option A is not a specific course",
  "course_name_b": "Exact course name from the list above, or null if option B is not a specific course"
}

Rules:
- Options must be genuinely balanced — neither should be an obvious winner
- If it is a course head-to-head, both course_name_a and course_name_b must be exact names from the list
- Return ONLY the JSON object
`;

  const raw = await callGPT4(systemPrompt, userPrompt);
  return parseJSON<GeneratedDebateCard>(raw);
}

// ─── Seasonal context helper ──────────────────────────────────────────────────

function getSeasonalContext(month: number): { season: string; theme: string } {
  if (month >= 3 && month <= 5) return {
    season: 'Spring',
    theme: 'Major season — Augusta, parkland courses coming into condition, links courses in the UK/Ireland',
  };
  if (month >= 6 && month <= 8) return {
    season: 'Summer',
    theme: 'Peak links season — Scottish and Irish links, The Open Championship venues, coastal courses',
  };
  if (month >= 9 && month <= 11) return {
    season: 'Autumn',
    theme: 'FedEx Cup playoffs, Ryder Cup season, parkland and heathland courses in autumn colour',
  };
  return {
    season: 'Winter',
    theme: 'Desert and resort courses, warm weather destinations, Florida and Arizona swing',
  };
}

// ─── Course lookup helper (fuzzy match by name) ───────────────────────────────

function findCourseByName(
  name: string | null,
  courses: { id: string; name: string }[],
): string | null {
  if (!name) return null;
  const normalised = name.toLowerCase().trim();

  // Exact match first
  const exact = courses.find(c => c.name.toLowerCase().trim() === normalised);
  if (exact) return exact.id;

  // Partial match — course name contains the search term or vice versa
  const partial = courses.find(c =>
    c.name.toLowerCase().includes(normalised) ||
    normalised.includes(c.name.toLowerCase())
  );
  return partial?.id ?? null;
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Allow manual trigger with forceRegenerate flag
    let forceRegenerate = false;
    try {
      const body = await req.json();
      forceRegenerate = body.forceRegenerate || false;
    } catch { /* no body */ }

    console.log('[generate-editorial-cards] Starting weekly generation...');

    // ── Guard: don't regenerate if cards already exist for this week ──────────
    if (!forceRegenerate) {
      const { data: existing } = await supabase
        .from('editorial_feed_cards')
        .select('id')
        .eq('is_active', true)
        .gte('active_until', new Date().toISOString())
        .limit(1);

      if (existing && existing.length > 0) {
        console.log('[generate-editorial-cards] Active cards already exist for this week — skipping');
        return new Response(
          JSON.stringify({ success: true, skipped: true, reason: 'Cards already active for this week' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // ── Step 0: Deactivate previous week's cards ──────────────────────────────
    const { error: deactivateError } = await supabase
      .from('editorial_feed_cards')
      .update({ is_active: false })
      .eq('is_active', true);

    if (deactivateError) {
      console.error('[generate-editorial-cards] Failed to deactivate old cards:', deactivateError);
    } else {
      console.log('[generate-editorial-cards] Deactivated previous week cards');
    }

    // ── Step 0b: Get context data ─────────────────────────────────────────────
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12

    // Week date range for history prompt
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Sunday
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Saturday
    const weekDates = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    // Build individual days list for strict Perplexity date constraint
    const weekDaysList = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    }).join(', ');

    // Active from/until for new cards
    const activeFrom = now.toISOString();
    const activeUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Upcoming tournament (for course of week context)
    let upcomingTournamentName: string | null = null;
    try {
      const { data: seasons } = await supabase
        .from('sr_seasons')
        .select('id')
        .ilike('tour_name', 'pga')
        .order('year', { ascending: false })
        .limit(1);

      if (seasons?.[0]) {
        const { data: tourney } = await supabase
          .from('sr_tournaments')
          .select('name')
          .eq('season_id', seasons[0].id)
          .in('status', ['scheduled', 'inprogress'])
          .order('start_date', { ascending: true })
          .limit(1)
          .maybeSingle();

        upcomingTournamentName = tourney?.name ?? null;
      }
    } catch (err) {
      console.warn('[generate-editorial-cards] Could not fetch upcoming tournament:', err);
    }

    // Fetch course candidates for course of week + debate
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: coursesRaw } = await supabase
      .from('golf_courses')
      .select('id, name, country, sub_country, global_rank, description, has_hosted_major, course_type')
      .not('global_rank', 'is', null)
      .order('global_rank', { ascending: true })
      .limit(200);

    if (!coursesRaw || coursesRaw.length === 0) {
      throw new Error('No courses found in database');
    }

    // Enrich candidates with review counts
    const courseIds = coursesRaw.map(c => c.id);

    const { data: reviewAggs } = await supabase
      .from('course_ratings')
      .select('course_id, rating, created_at')
      .in('course_id', courseIds);

    const reviewMap = new Map<string, { total: number; sum: number; recent: number }>();
    for (const r of (reviewAggs || [])) {
      if (!reviewMap.has(r.course_id)) {
        reviewMap.set(r.course_id, { total: 0, sum: 0, recent: 0 });
      }
      const entry = reviewMap.get(r.course_id)!;
      entry.total++;
      entry.sum += r.rating || 0;
      if (r.created_at >= thirtyDaysAgo) entry.recent++;
    }

    const allCandidates: CourseCandidate[] = coursesRaw.map(c => {
      const agg = reviewMap.get(c.id) || { total: 0, sum: 0, recent: 0 };
      return {
        ...c,
        review_count: agg.total,
        avg_rating: agg.total > 0 ? agg.sum / agg.total : null,
        recent_review_count: agg.recent,
      };
    });

    // HARD FILTER: Course of the Week must only ever be a course with at least
    // 1 community review on Clbhouz. Courses with 0 reviews are excluded from
    // the candidate pool entirely so Claude cannot select them.
    const candidates: CourseCandidate[] = allCandidates.filter(c => c.review_count > 0);

    if (candidates.length === 0) {
      throw new Error('No reviewed courses found — cannot generate Course of the Week');
    }

    console.log(`[generate-editorial-cards] Course of Week candidates: ${candidates.length} reviewed courses (filtered from ${allCandidates.length} total)`);

    // Debate pool uses all courses (not filtered by reviews — debate just needs named courses)
    const topCoursesForDebate = coursesRaw
      .slice(0, 60)
      .map(c => ({ id: c.id, name: c.name, country: c.country, global_rank: c.global_rank }));

    console.log(`[generate-editorial-cards] Context ready — ${candidates.length} course candidates, week: ${weekDates}`);

    // ── Step 1: Generate all three cards in parallel ──────────────────────────
    console.log('[generate-editorial-cards] Generating cards in parallel...');

    const [historyResult, courseResult, debateResult] = await Promise.allSettled([
      generateHistoryCard(weekDates, weekDaysList),
      generateCourseOfWeek(candidates, currentMonth, upcomingTournamentName),
      generateDebateCard(topCoursesForDebate, null),
    ]);

    const results = {
      history: historyResult.status === 'fulfilled' ? historyResult.value : null,
      course: courseResult.status === 'fulfilled' ? courseResult.value : null,
      debate: debateResult.status === 'fulfilled' ? debateResult.value : null,
    };

    const errors = {
      history: historyResult.status === 'rejected' ? String(historyResult.reason) : null,
      course: courseResult.status === 'rejected' ? String(courseResult.reason) : null,
      debate: debateResult.status === 'rejected' ? String(debateResult.reason) : null,
    };

    console.log('[generate-editorial-cards] Generation complete:', {
      history: results.history ? 'OK' : `FAILED: ${errors.history}`,
      course: results.course ? 'OK' : `FAILED: ${errors.course}`,
      debate: results.debate ? 'OK' : `FAILED: ${errors.debate}`,
    });

    // ── Step 2: Resolve course IDs for linked courses ─────────────────────────
    const allCourses = coursesRaw.map(c => ({ id: c.id, name: c.name }));

    const historyCourseId = results.history
      ? findCourseByName(results.history.linked_course_name, allCourses)
      : null;

    const debateCourseAId = results.debate
      ? findCourseByName(results.debate.course_name_a, allCourses)
      : null;

    const debateCourseBId = results.debate
      ? findCourseByName(results.debate.course_name_b, allCourses)
      : null;

    // ── Step 3: Insert cards into editorial_feed_cards ────────────────────────
    const inserts: any[] = [];

    if (results.history) {
      inserts.push({
        card_type: 'history',
        active_from: activeFrom,
        active_until: activeUntil,
        is_active: true,
        title: results.history.title,
        body: results.history.body,
        body_extended: results.history.body_extended,
        history_year: results.history.history_year,
        history_date: results.history.history_date,
        course_id: historyCourseId,
        generation_metadata: {
          model: 'perplexity_sonar',
          generated_at: now.toISOString(),
          linked_course_name_raw: results.history.linked_course_name,
          week_dates: weekDates,
        },
      });
    }

    if (results.course) {
      inserts.push({
        card_type: 'course_of_week',
        active_from: activeFrom,
        active_until: activeUntil,
        is_active: true,
        title: results.course.title,
        course_id: results.course.course_id,
        course_editorial_blurb: results.course.course_editorial_blurb,
        generation_metadata: {
          model: 'claude-sonnet',
          generated_at: now.toISOString(),
          upcoming_tournament: upcomingTournamentName,
          seasonal_context: getSeasonalContext(currentMonth),
          candidates_considered: candidates.length,
        },
      });
    }

    if (results.debate) {
      inserts.push({
        card_type: 'debate',
        active_from: activeFrom,
        active_until: activeUntil,
        is_active: true,
        title: results.debate.title,
        body: results.debate.body,
        debate_option_a: results.debate.debate_option_a,
        debate_option_b: results.debate.debate_option_b,
        debate_option_a_course_id: debateCourseAId,
        debate_option_b_course_id: debateCourseBId,
        generation_metadata: {
          model: 'gpt-4o',
          generated_at: now.toISOString(),
          course_name_a_raw: results.debate.course_name_a,
          course_name_b_raw: results.debate.course_name_b,
          course_a_resolved: !!debateCourseAId,
          course_b_resolved: !!debateCourseBId,
        },
      });
    }

    if (inserts.length === 0) {
      throw new Error('All three card generations failed — nothing to insert');
    }

    const { error: insertError } = await supabase
      .from('editorial_feed_cards')
      .insert(inserts);

    if (insertError) {
      console.error('[generate-editorial-cards] Insert failed:', insertError);
      throw insertError;
    }

    console.log(`[generate-editorial-cards] Inserted ${inserts.length} cards in ${Date.now() - startTime}ms`);

    // ── Step 4: Return response ───────────────────────────────────────────────
    return new Response(
      JSON.stringify({
        success: true,
        cards_generated: inserts.length,
        active_from: activeFrom,
        active_until: activeUntil,
        results: {
          history: results.history ? { title: results.history.title, year: results.history.history_year, course_linked: !!historyCourseId } : null,
          course: results.course ? { course_id: results.course.course_id } : null,
          debate: results.debate ? { title: results.debate.title, course_a_resolved: !!debateCourseAId, course_b_resolved: !!debateCourseBId } : null,
        },
        errors,
        latency_ms: Date.now() - startTime,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[generate-editorial-cards] Fatal error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        latency_ms: Date.now() - startTime,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});