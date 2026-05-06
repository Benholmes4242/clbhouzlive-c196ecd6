// deno-lint-ignore-file
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const todayKey = () => {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const SYSTEM_PROMPT = `You are Echo, the AI caddie inside Clbhouz, a golf social platform.

Voice rules — these are absolute:
- Speak directly to the user (the golfer whose data you're analysing) in second person — "you", "your", "you've".
- Never refer to the user in third person ("this player", "they", "their").
- Never expose internal IDs, UUIDs, or technical references in your prose. Only use human-readable course names.

Output rules:
- Reply with JSON only. No prose around the JSON.
- Be concrete and evidence-based. Reference specific scores, courses, and dates from the round history.
- When you cite a course in prose, use its name from the round history. Never write "course <uuid>" or any other identifier.
- Vary your recommendations day-to-day when given the same inputs.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { connection_id } = await req.json();
    if (!connection_id || typeof connection_id !== "string") {
      return json({ error: "connection_id required" }, 400);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
    if (!LOVABLE_API_KEY) return json({ error: "AI not configured" }, 500);

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Verify ownership
    const { data: conn, error: connErr } = await admin
      .from("whs_connections")
      .select("id, user_id")
      .eq("id", connection_id)
      .maybeSingle();
    if (connErr || !conn || conn.user_id !== userId) {
      return json({ error: "Not found" }, 404);
    }

    const dateKey = todayKey();

    // Same-day cache check — return cached insights without invoking AI.
    const { data: cached } = await admin
      .from("whs_ai_insights")
      .select("*")
      .eq("connection_id", connection_id)
      .maybeSingle();

    if (cached && (cached as any).date_key === dateKey) {
      return json(shapeResponseFromCache(cached));
    }

    // Last 30 rounds (course_id here is a whs_courses.id)
    const { data: rounds, error: rErr } = await admin
      .from("whs_scores")
      .select(
        "id, adjusted_gross, handicap_differential, play_date, course_id, course_rating, slope_rating, total_holes",
      )
      .eq("connection_id", connection_id)
      .order("play_date", { ascending: false })
      .limit(30);
    if (rErr) return json({ error: rErr.message }, 500);

    if (!rounds || rounds.length < 8) {
      return json({ error: "Not enough rounds" }, 400);
    }

    const whsCourseIds = Array.from(
      new Set(rounds.map((r: any) => r.course_id).filter(Boolean)),
    );

    // Bridge WHS courses → golf_courses
    const { data: bridge } = await admin
      .from("whs_to_golf_course_map")
      .select("whs_course_id, golf_course_id, match_confidence")
      .in("whs_course_id", whsCourseIds.length ? whsCourseIds : ["00000000-0000-0000-0000-000000000000"]);

    const whsToGolf = new Map<string, string>();
    for (const b of bridge ?? []) {
      if (b.golf_course_id) whsToGolf.set(b.whs_course_id, b.golf_course_id);
    }

    // Hydrate WHS courses (for names when bridge missing)
    const { data: whsCourses } = await admin
      .from("whs_courses")
      .select("id, name, country_code, country_name")
      .in("id", whsCourseIds.length ? whsCourseIds : ["00000000-0000-0000-0000-000000000000"]);
    const whsById = new Map((whsCourses ?? []).map((c: any) => [c.id, c]));

    // Hydrate mapped golf_courses
    const playedGolfIds = Array.from(new Set([...whsToGolf.values()]));
    const { data: playedGolfCourses } = playedGolfIds.length
      ? await admin
          .from("golf_courses")
          .select("id, name, region, country, country_code")
          .in("id", playedGolfIds)
      : { data: [] as any[] };
    const golfById = new Map((playedGolfCourses ?? []).map((c: any) => [c.id, c]));

    // Recently recommended IDs (7-day window, exclude)
    const sevenAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const { data: recentRecs } = await admin
      .from("whs_ai_recommendation_history")
      .select("recommended_ids, date_key")
      .eq("connection_id", connection_id)
      .gte("date_key", sevenAgo);
    const recentlyRecommended = new Set<string>();
    for (const row of recentRecs ?? []) {
      for (const id of (row.recommended_ids ?? []) as string[]) recentlyRecommended.add(id);
    }
    const recentlyPlayedGolfIds = new Set(
      rounds.slice(0, 5).map((r: any) => whsToGolf.get(r.course_id)).filter(Boolean) as string[],
    );

    // GB&I candidate pool — full country, daily-rotated, no geographic narrowing.
    const GBI_COUNTRY = "Britain & Ireland";
    const ROTATION_POOL_SIZE = 50;

    const { data: allGbiCourses } = await admin
      .from("golf_courses")
      .select("id, name, region, country")
      .eq("country", GBI_COUNTRY);

    let pool = (allGbiCourses ?? []).filter((c: any) =>
      !recentlyPlayedGolfIds.has(c.id) && !recentlyRecommended.has(c.id)
    );

    // Edge case: pool exhausted. Fall back to ignoring the played filter only —
    // recommendations may overlap with played courses but stay within GB&I.
    if (pool.length === 0) {
      pool = (allGbiCourses ?? []).filter((c: any) => !recentlyRecommended.has(c.id));
    }

    // Deterministic shuffle seeded on (userId, dateKey).
    const seed = stringToSeed(`${userId}:${dateKey}`);
    const candidates = seededShuffle(pool, seed).slice(0, ROTATION_POOL_SIZE);

    const roundsForPrompt = rounds.map((r: any) => {
      const golfId = whsToGolf.get(r.course_id);
      const gc = golfId ? golfById.get(golfId) : null;
      const wc = whsById.get(r.course_id);
      return {
        course_name: gc?.name ?? wc?.name ?? null,
        region: gc?.region ?? null,
        country: gc?.country ?? wc?.country_name ?? null,
        play_date: r.play_date,
        adjusted_gross: r.adjusted_gross,
        differential: r.handicap_differential,
        course_rating: r.course_rating,
        slope_rating: r.slope_rating,
        holes: r.total_holes,
      };
    });

    // Compute deterministic expected_differential per candidate.
    // user_recent_avg_diff = mean differential of the latest up-to-8 rounds.
    const recentDiffs = rounds
      .slice(0, 8)
      .map((r: any) => (typeof r.handicap_differential === "number" ? r.handicap_differential : null))
      .filter((v: number | null): v is number => v != null);
    const userRecentAvgDiff = recentDiffs.length
      ? recentDiffs.reduce((a: number, b: number) => a + b, 0) / recentDiffs.length
      : null;

    // user_home_slope = slope of the most-played course in the rounds set.
    const slopeCounts = new Map<number, number>();
    for (const r of rounds as any[]) {
      const s = typeof r.slope_rating === "number" ? r.slope_rating : null;
      if (s == null) continue;
      slopeCounts.set(s, (slopeCounts.get(s) ?? 0) + 1);
    }
    let userHomeSlope: number | null = null;
    let bestCount = 0;
    for (const [s, c] of slopeCounts) {
      if (c > bestCount) {
        bestCount = c;
        userHomeSlope = s;
      }
    }

    // Pull slope_rating for candidate courses from whs_courses where mappable.
    // golf_courses doesn't carry slope, so we infer via whs_to_golf_course_map reverse lookup.
    const candidateGolfIds = candidates.map((c: any) => c.id);
    const { data: candidateBridge } = candidateGolfIds.length
      ? await admin
          .from("whs_to_golf_course_map")
          .select("golf_course_id, whs_course_id")
          .in("golf_course_id", candidateGolfIds)
      : { data: [] as any[] };
    const golfToWhs = new Map<string, string>();
    for (const b of candidateBridge ?? []) {
      if (!golfToWhs.has(b.golf_course_id)) golfToWhs.set(b.golf_course_id, b.whs_course_id);
    }
    const candWhsIds = Array.from(new Set([...golfToWhs.values()]));
    const { data: candWhs } = candWhsIds.length
      ? await admin
          .from("whs_courses")
          .select("id, last_seen_slope_rating")
          .in("id", candWhsIds)
      : { data: [] as any[] };
    const whsSlopeById = new Map((candWhs ?? []).map((c: any) => [c.id, c.last_seen_slope_rating]));

    const candidatesWithExpected = candidates.map((c: any) => {
      const whsId = golfToWhs.get(c.id);
      const candidateSlope = whsId ? (whsSlopeById.get(whsId) ?? null) : null;
      let expectedDiff: number | null = null;
      if (userRecentAvgDiff != null && userHomeSlope != null && candidateSlope != null) {
        const adj = (Number(candidateSlope) - userHomeSlope) * 0.04;
        expectedDiff = +(userRecentAvgDiff + adj).toFixed(1);
      }
      return { ...c, slope_rating: candidateSlope, expected_differential: expectedDiff };
    });

    const latestScoreId = rounds[0].id as string;

    const prompt = buildPrompt(roundsForPrompt, candidatesWithExpected, dateKey);

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI error", aiResp.status, t);
      if (aiResp.status === 429) return json({ error: "Rate limited" }, 429);
      if (aiResp.status === 402) return json({ error: "AI credits required" }, 402);
      return json({ error: "AI failed" }, 500);
    }

    const aiJson = await aiResp.json();
    const content = aiJson?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      return json({ error: "Invalid AI output" }, 500);
    }

    const candidateIds = new Set(candidatesWithExpected.map((c: any) => c.id));
    const candidateExpectedById = new Map<string, number | null>(
      candidatesWithExpected.map((c: any) => [c.id, c.expected_differential ?? null]),
    );
    const validate = (arr: any[]) =>
      Array.isArray(arr)
        ? arr
            .filter((x) => x && typeof x.id === "string" && candidateIds.has(x.id))
            .slice(0, 3)
            .map((x) => ({
              id: x.id,
              rationale: String(x.rationale ?? "").slice(0, 240),
              // Always use precomputed value — never trust LLM numerics.
              expected_differential: candidateExpectedById.get(x.id) ?? null,
            }))
        : [];

    const suited = validate(parsed.suited_courses);
    const test = validate(parsed.test_courses);
    const scoringProfile = String(parsed.scoring_profile ?? "").slice(0, 800);
    const roundsPattern = String(parsed.rounds_pattern ?? "").slice(0, 400);

    if (!scoringProfile) return json({ error: "Empty profile" }, 500);

    // Hydrate recommended IDs to enriched courses BEFORE persistence so the
    // JSONB row is self-contained — the hook can read it directly with no
    // second query, and the same-day cache path needs no re-hydration.
    const allRecIds = [...suited.map((s) => s.id), ...test.map((t) => t.id)];

    let hyMap = new Map<string, any>();
    if (allRecIds.length > 0) {
      const { data: hydrated } = await admin
        .from("golf_courses")
        .select("id, name, region, country")
        .in("id", allRecIds);
      hyMap = new Map((hydrated ?? []).map((c: any) => [c.id, c]));
    }

    const enrich = (
      arr: { id: string; rationale: string; expected_differential: number | null }[],
    ) =>
      arr.map((r) => {
        const c: any = hyMap.get(r.id) || {};
        return {
          id: r.id,
          name: c.name ?? "",
          region: c.region ?? c.country ?? "",
          rationale: r.rationale,
          expected_differential: r.expected_differential,
        };
      });

    const enrichedSuited = enrich(suited);
    const enrichedTest = enrich(test);

    await admin.from("whs_ai_insights").upsert({
      connection_id,
      scoring_profile: scoringProfile,
      rounds_pattern: roundsPattern,
      suited_courses: enrichedSuited,
      test_courses: enrichedTest,
      generated_from_score_id: latestScoreId,
      generated_at: new Date().toISOString(),
      date_key: dateKey,
    });

    // Track recommendation history (7-day no-dup window)
    if (allRecIds.length) {
      await admin.from("whs_ai_recommendation_history").upsert({
        connection_id,
        date_key: dateKey,
        recommended_ids: allRecIds,
        generated_at: new Date().toISOString(),
      }, { onConflict: "connection_id,date_key" });
    }

    return json({
      scoring_profile: scoringProfile,
      rounds_pattern: roundsPattern,
      suited_courses: enrichedSuited,
      test_courses: enrichedTest,
      generated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildPrompt(rounds: any[], candidates: any[], dateKey: string) {
  return `Today is ${dateKey}. Analyse the user's recent WHS round history and recommend courses from a provided candidate pool.

USER'S ROUND HISTORY (last ${rounds.length} rounds, newest first):
${JSON.stringify(rounds)}

CANDIDATE COURSES (${candidates.length} courses across Britain & Ireland — daily-rotated; you haven't played any of these recently and they haven't been recommended to you in the past 7 days):
${JSON.stringify(candidates)}

Produce a JSON response with this exact structure:
{
  "scoring_profile": "<2-3 sentences (50-70 words) characterising what kinds of courses suit your game. Reference your best counter and the specific course (by name) where you shot it. Mention what kind of course produces higher differentials. Use 'you' and 'your', never 'this player' or 'they'.>",
  "rounds_pattern": "<1-2 sentences (max 30 words) about your recent counter rounds. Reference specific numbers and wrap key values in **bold** markdown (e.g. **+0.6**, **+1.7**). Use 'you' and 'your'. No speculation.>",
  "suited_courses": [ { "id": "<golf_courses.id from CANDIDATE COURSES>", "rationale": "<one sentence, max 22 words, why this course matches your best scoring profile. Reference the course by name in your rationale.>" } ],
  "test_courses": [ { "id": "<golf_courses.id from CANDIDATE COURSES>", "rationale": "<one sentence, max 22 words, why this course will push your game (frame as growth). Reference the course by name.>" } ]
}

Rules:
- Exactly 3 items in each array (or fewer only if candidates < 6).
- Only use IDs from CANDIDATE COURSES. Never invent IDs. Never reuse the same id across suited and test.
- IDs go in the "id" field only — never write a UUID in any prose ("scoring_profile", "rounds_pattern", "rationale"). Use the course name instead.
- If round sample < 15, prefix scoring_profile with "Early signal: ".
- rounds_pattern MUST wrap numeric values in **bold** markdown.
- Use second-person voice throughout. "you", "your", "you've". Never "this player", "they", "their".
- Vary picks day-to-day when reasonable (today's date_key is ${dateKey}).
- Return JSON only.`;
}

function shapeResponseFromCache(cached: any) {
  // Cached rows now contain enriched courses ({id, name, region, rationale})
  // by virtue of the write-side hydration in the fresh-generation path.
  // No re-hydration needed.
  return {
    scoring_profile: cached.scoring_profile,
    rounds_pattern: cached.rounds_pattern,
    suited_courses: cached.suited_courses ?? [],
    test_courses: cached.test_courses ?? [],
    generated_at: cached.generated_at,
    cached: true,
  };
}

// FNV-1a 32-bit string hash — used to seed the per-user-per-day shuffle.
function stringToSeed(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h >>> 0;
}

// xorshift32-seeded Fisher-Yates shuffle. Same seed → same output order.
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = arr.slice();
  let s = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s = s >>> 0;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
