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

    // Determine common regions/countries
    const regionCount = new Map<string, number>();
    const countryCount = new Map<string, number>();
    for (const r of rounds) {
      const golfId = whsToGolf.get(r.course_id);
      const gc = golfId ? golfById.get(golfId) : null;
      if (gc?.region) regionCount.set(gc.region, (regionCount.get(gc.region) || 0) + 1);
      const cc = gc?.country_code || whsById.get(r.course_id)?.country_code;
      if (cc) countryCount.set(cc, (countryCount.get(cc) || 0) + 1);
    }
    const topRegions = [...regionCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([r]) => r);
    const topCountries = [...countryCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([c]) => c);

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

    // Candidate pool: prefer regions, then country fallback
    let candidates: any[] = [];
    if (topRegions.length) {
      const { data: cand } = await admin
        .from("golf_courses")
        .select("id, name, region, country, country_code")
        .in("region", topRegions)
        .limit(120);
      candidates = (cand ?? []);
    }
    if (candidates.length < 20 && topCountries.length) {
      const { data: cand } = await admin
        .from("golf_courses")
        .select("id, name, region, country, country_code")
        .in("country_code", topCountries)
        .limit(120);
      const seen = new Set(candidates.map((c) => c.id));
      for (const c of cand ?? []) if (!seen.has(c.id)) candidates.push(c);
    }

    candidates = candidates
      .filter((c) => !recentlyPlayedGolfIds.has(c.id))
      .filter((c) => !recentlyRecommended.has(c.id))
      .slice(0, 60);

    if (candidates.length < 6) {
      // Top up ignoring recommendation history if we're starved
      const needed = 6 - candidates.length;
      const { data: cand } = await admin
        .from("golf_courses")
        .select("id, name, region, country, country_code")
        .in("country_code", topCountries.length ? topCountries : ["GB", "US"])
        .limit(60);
      const seen = new Set(candidates.map((c) => c.id));
      for (const c of cand ?? []) {
        if (candidates.length >= 6 + needed) break;
        if (!seen.has(c.id) && !recentlyPlayedGolfIds.has(c.id)) candidates.push(c);
      }
    }

    const roundsForPrompt = rounds.map((r: any) => {
      const golfId = whsToGolf.get(r.course_id);
      const gc = golfId ? golfById.get(golfId) : null;
      const wc = whsById.get(r.course_id);
      return {
        course_id: golfId ?? r.course_id,
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

    const latestScoreId = rounds[0].id as string;

    const prompt = buildPrompt(roundsForPrompt, candidates, dateKey);

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are Echo, the AI golf insights engine for Clbhouz. You analyse a player's WHS round history and recommend courses from a provided candidate pool. Reply with JSON only. Vary your recommendations day-to-day when given the same inputs." },
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

    const candidateIds = new Set(candidates.map((c) => c.id));
    const validate = (arr: any[]) =>
      Array.isArray(arr)
        ? arr
            .filter((x) => x && typeof x.id === "string" && candidateIds.has(x.id))
            .slice(0, 3)
            .map((x) => ({ id: x.id, rationale: String(x.rationale ?? "").slice(0, 240) }))
        : [];

    const suited = validate(parsed.suited_courses);
    const test = validate(parsed.test_courses);
    const scoringProfile = String(parsed.scoring_profile ?? "").slice(0, 800);
    const roundsPattern = String(parsed.rounds_pattern ?? "").slice(0, 400);

    if (!scoringProfile) return json({ error: "Empty profile" }, 500);

    await admin.from("whs_ai_insights").upsert({
      connection_id,
      scoring_profile: scoringProfile,
      rounds_pattern: roundsPattern,
      suited_courses: suited,
      test_courses: test,
      generated_from_score_id: latestScoreId,
      generated_at: new Date().toISOString(),
      date_key: dateKey,
    });

    // Track recommendation history (7-day no-dup window)
    const allRecIds = [...suited.map((s) => s.id), ...test.map((t) => t.id)];
    if (allRecIds.length) {
      await admin.from("whs_ai_recommendation_history").upsert({
        connection_id,
        date_key: dateKey,
        recommended_ids: allRecIds,
        generated_at: new Date().toISOString(),
      }, { onConflict: "connection_id,date_key" });
    }

    // Hydrate
    const { data: hydrated } = allRecIds.length
      ? await admin
          .from("golf_courses")
          .select("id, name, region, country")
          .in("id", allRecIds)
      : { data: [] as any[] };
    const hyMap = new Map((hydrated ?? []).map((c: any) => [c.id, c]));

    const shape = (arr: { id: string; rationale: string }[]) =>
      arr.map((r) => {
        const c = hyMap.get(r.id) || {};
        return {
          id: r.id,
          name: c.name ?? "",
          region: c.region ?? c.country ?? "",
          par: 72,
          holes: 18,
          slope: 0,
          rating: 0,
          yards: 0,
          rationale: r.rationale,
        };
      });

    return json({
      scoring_profile: scoringProfile,
      rounds_pattern: roundsPattern,
      suited_courses: shape(suited),
      test_courses: shape(test),
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
  return `Today is ${dateKey}. Analyse this player's recent WHS round history and produce daily insights about what kinds of courses suit their game.

PLAYER ROUND HISTORY (last ${rounds.length} rounds, newest first):
${JSON.stringify(rounds)}

CANDIDATE COURSES (${candidates.length} nearby courses they haven't played recently and haven't been recommended in the past 7 days):
${JSON.stringify(candidates)}

Produce a JSON response with this exact structure:
{
  "scoring_profile": "<2-3 sentences (50-70 words) characterising what kinds of courses suit this player's game. Reference a concrete best round (course + differential) and what kind of setup tends to produce higher differentials. Evidence-based.>",
  "rounds_pattern": "<1-2 sentences (max 30 words) describing a concrete observation about recent counter rounds. Reference specific numbers and wrap key values in **bold** markdown (e.g. **+0.6**, **+1.7**). No speculation.>",
  "suited_courses": [ { "id": "<golf_courses.id from CANDIDATE COURSES>", "rationale": "<one sentence, max 22 words, why this course matches their best scoring profile>" } ],
  "test_courses":   [ { "id": "<golf_courses.id from CANDIDATE COURSES>", "rationale": "<one sentence, max 22 words, why this course will push their game (frame as growth)>" } ]
}

Rules:
- Exactly 3 items in each array (or fewer only if candidates < 6).
- Only use IDs from CANDIDATE COURSES. Never invent IDs. Never reuse the same id across suited and test.
- If round sample < 15, prefix scoring_profile with "Early signal: ".
- rounds_pattern MUST wrap numeric values in **bold** markdown.
- Vary picks day-to-day when reasonable (today's date_key is ${dateKey}).
- Return JSON only.`;
}
