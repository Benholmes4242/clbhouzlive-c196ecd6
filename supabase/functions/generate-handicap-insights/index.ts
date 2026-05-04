// deno-lint-ignore-file
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

    // Last 30 rounds
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

    const courseIds = Array.from(
      new Set(rounds.map((r: any) => r.course_id).filter(Boolean)),
    );
    const { data: courses } = await admin
      .from("golf_courses")
      .select("id, name, region, country")
      .in("id", courseIds.length ? courseIds : ["00000000-0000-0000-0000-000000000000"]);
    const courseById = new Map((courses ?? []).map((c: any) => [c.id, c]));

    // Determine common regions and recently-played
    const regionCount = new Map<string, number>();
    for (const r of rounds) {
      const c = courseById.get(r.course_id);
      if (c?.region) regionCount.set(c.region, (regionCount.get(c.region) || 0) + 1);
    }
    const topRegions = [...regionCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([r]) => r);
    const recentlyPlayed = new Set(
      rounds.slice(0, 5).map((r: any) => r.course_id).filter(Boolean),
    );

    // Candidate pool
    let candidates: any[] = [];
    if (topRegions.length) {
      const { data: cand } = await admin
        .from("golf_courses")
        .select("id, name, region, country")
        .in("region", topRegions)
        .limit(60);
      candidates = (cand ?? []).filter((c: any) => !recentlyPlayed.has(c.id));
    }
    candidates = candidates.slice(0, 50);

    const roundsForPrompt = rounds.map((r: any) => {
      const c = courseById.get(r.course_id);
      return {
        course_id: r.course_id,
        course_name: c?.name ?? null,
        region: c?.region ?? null,
        play_date: r.play_date,
        adjusted_gross: r.adjusted_gross,
        differential: r.handicap_differential,
        course_rating: r.course_rating,
        slope_rating: r.slope_rating,
        holes: r.total_holes,
      };
    });

    const latestScoreId = rounds[0].id as string;

    const prompt = buildPrompt(roundsForPrompt, candidates);

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are Echo, the AI assistant for Clbhouz, a golf social platform. Reply with JSON only." },
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
            .map((x) => ({ id: x.id, rationale: String(x.rationale ?? "").slice(0, 200) }))
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
    });

    // Hydrate
    const allIds = [...suited.map((s) => s.id), ...test.map((t) => t.id)];
    const { data: hydrated } = allIds.length
      ? await admin
          .from("golf_courses")
          .select("id, name, region, country")
          .in("id", allIds)
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

function buildPrompt(rounds: any[], candidates: any[]) {
  return `Analyse this player's recent round history and generate insights about what kinds of courses suit their game and what their recent counter rounds reveal.

PLAYER ROUND HISTORY (last ${rounds.length} rounds, newest first):
${JSON.stringify(rounds)}

CANDIDATE COURSES (nearby courses they haven't played recently):
${JSON.stringify(candidates)}

Produce a JSON response with this exact structure:
{
  "scoring_profile": "<2-3 sentences (50-70 words) characterising what kinds of courses suit this player's game. Reference their best counter and a specific course where they shot it. Mention what kind of course produces higher differentials. Concrete, evidence-based.>",
  "rounds_pattern": "<1-2 sentences (max 30 words) describing a concrete observation about the player's recent counter rounds. Reference specific numbers and wrap key values in **bold** markdown. Examples: average of last 3-5 vs the 8-round average, whether the most recent round was a new best/worst, or whether they're trending hotter or cooler. No speculation.>",
  "suited_courses": [ { "id": "<course id from candidates>", "rationale": "<one sentence, max 20 words, why this course matches their best scoring profile>" } ],
  "test_courses":   [ { "id": "<course id from candidates>", "rationale": "<one sentence, max 20 words, why this course will push their game (frame as growth)>" } ]
}

Rules:
- Exactly 3 items in each array (or fewer only if candidates < 6).
- Only use IDs from CANDIDATE COURSES. Never invent IDs.
- If sample < 15, prefix profile with "Early signal:" or similar.
- rounds_pattern MUST wrap numeric values in **bold** markdown (e.g. **+0.6**, **+1.7**).
- Return JSON only.`;
}
