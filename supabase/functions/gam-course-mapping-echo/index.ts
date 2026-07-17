// deno-lint-ignore-file no-explicit-any
// gam-course-mapping-echo
// Phase 1a of Brief 5 — LLM consensus matcher for whs_courses that the
// deterministic pipeline left as `no_match_found`. Asks Claude, GPT, and
// Gemini in parallel to pick the best golf_courses row (or NO_MATCH /
// CREATE_NEW), then folds the answers into a consensus and writes the
// result to whs_to_golf_course_map.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

import { corsFor } from '../_shared/cors.ts';
const GBI = "Britain & Ireland";

type Decision = "MATCH" | "NO_MATCH" | "CREATE_NEW";

interface LlmResponse {
  provider: "anthropic" | "openai" | "gemini";
  model: string;
  decision: Decision;
  golf_course_id: string | null;
  confidence: number;
  reasoning: string;
  raw?: string;
  error?: string;
}

interface Candidate {
  id: string;
  name: string;
  country: string | null;
  sub_country: string | null;
  club_name: string | null;
}

Deno.serve(async (req) => {
  const corsHeaders = corsFor(req.headers.get('Origin'));
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") return json({ error: "POST required" }, 405);

  // Optional internal-secret gate (active only once GAM_INTERNAL_SECRET is set).
  const requiredSecret = Deno.env.get("GAM_INTERNAL_SECRET");
  if (requiredSecret) {
    const presented = req.headers.get("x-internal-secret");
    if (presented !== requiredSecret) {
      return json({ error: "Forbidden" }, 403);
    }
  }

  let body: { whs_course_id?: string; dry_run?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const whsId = body.whs_course_id;
  if (!whsId || typeof whsId !== "string") {
    return json({ error: "whs_course_id required" }, 400);
  }
  const dryRun = body.dry_run === true;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
      Deno.env.get("SUPABASE_SERVICE_ROLE")!,
  );

  try {
    const { data: whs } = await supabase
      .from("whs_courses")
      .select("id, name, country_code, country_name")
      .eq("id", whsId)
      .maybeSingle();
    if (!whs) return json({ error: "whs_course not found" }, 404);

    const candidates = await buildCandidates(supabase, whs);
    if (candidates.length === 0) {
      const result = {
        whs_course_id: whsId,
        whs_name: whs.name,
        candidates: [],
        llm_responses: [],
        consensus: {
          decision: "NO_MATCH" as Decision,
          golf_course_id: null,
          agreement_count: 0,
          reasoning: "No plausible candidate golf_courses rows found.",
        },
        recommendation: "no_match" as const,
      };
      if (!dryRun) {
        await persist(supabase, whsId, null, 0, "echo_no_match", result.consensus.reasoning, 0);
      }
      return json(result);
    }

    const llmResponses = await runLlmConsensus(whs, candidates);
    const consensus = computeConsensus(llmResponses);
    const recommendation = recommendationFor(consensus);
    const matchMethod = methodFor(recommendation);

    if (!dryRun) {
      await persist(
        supabase,
        whsId,
        consensus.golf_course_id,
        consensus.confidence,
        matchMethod,
        consensus.reasoning,
        consensus.agreement_count,
      );
    }

    return json({
      whs_course_id: whsId,
      whs_name: whs.name,
      candidates,
      llm_responses: llmResponses,
      consensus,
      recommendation,
      match_method: matchMethod,
    });
  } catch (e) {
    console.error("[gam-course-mapping-echo]", e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});

// ---- Candidate sourcing ------------------------------------------------------

function normaliseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*\(.*?\)\s*/g, " ")
    .replace(/[\u2018\u2019']/g, "")
    .replace(/\bgolf\s+(club|course|links)\b/g, "")
    .replace(/\bgc\b/g, "")
    .replace(/^the\s+/, "")
    .replace(/[-,.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenJaccard(a: string, b: string): number {
  const sa = new Set(a.split(" ").filter(Boolean));
  const sb = new Set(b.split(" ").filter(Boolean));
  if (sa.size === 0 || sb.size === 0) return 0;
  let inter = 0;
  for (const t of sa) if (sb.has(t)) inter++;
  return inter / (sa.size + sb.size - inter);
}

// GBI country_code allowlist — matches the codes actually present in
// whs_courses (ENG / GB-SCT / WAL / IE etc.) rather than ISO-2 only.
const GBI_CODES = new Set([
  "GB", "GBR",
  "ENG", "GB-ENG",
  "SCT", "GB-SCT", "SCO",
  "WAL", "GB-WAL", "CYM",
  "NIR", "GB-NIR",
  "IE", "IRL",
]);
const GBI_NAME_RE = /united kingdom|great britain|britain|england|scotland|wales|northern ireland|ireland/i;

async function buildCandidates(
  supabase: any,
  whs: { name: string; country_code: string | null; country_name: string | null },
): Promise<Candidate[]> {
  const isGbi =
    (whs.country_code ? GBI_CODES.has(whs.country_code.toUpperCase()) : false) ||
    !!whs.country_name?.match(GBI_NAME_RE);

  // Pull the candidate pool. Bump well past the GBI corpus size (~2.3k)
  // so we never truncate by row cap.
  let q = supabase
    .from("golf_courses")
    .select("id, name, country, sub_country, club_id, golf_clubs(name)")
    .limit(5000);
  if (isGbi) q = q.eq("country", GBI);
  const { data } = await q;
  const pool = (data as any[]) ?? [];

  const target = normaliseName(whs.name);
  const scoredById = new Map<
    string,
    Candidate & { score: number }
  >();
  for (const c of pool) {
    const score = tokenJaccard(target, normaliseName(c.name));
    if (score <= 0) continue;
    scoredById.set(c.id, {
      id: c.id,
      name: c.name,
      country: c.country ?? null,
      sub_country: c.sub_country ?? null,
      club_name: c.golf_clubs?.name ?? null,
      score,
    });
  }

  // Belt-and-braces: also seed top trigram matches from Postgres so we
  // catch real matches that fell outside the row cap or scored 0 on
  // token-Jaccard (e.g. heavy punctuation differences).
  try {
    const { data: tri } = await supabase.rpc("find_best_trigram_match", {
      input_name: whs.name,
      country_filter: isGbi ? GBI : null,
    });
    const triIds = (tri ?? [])
      .filter((r: any) => Number(r.similarity ?? 0) >= 0.3)
      .slice(0, 10)
      .map((r: any) => r.id as string);
    const missing = triIds.filter((id) => !scoredById.has(id));
    if (missing.length > 0) {
      const { data: extra } = await supabase
        .from("golf_courses")
        .select("id, name, country, sub_country, club_id, golf_clubs(name)")
        .in("id", missing);
      for (const c of (extra as any[]) ?? []) {
        scoredById.set(c.id, {
          id: c.id,
          name: c.name,
          country: c.country ?? null,
          sub_country: c.sub_country ?? null,
          club_name: c.golf_clubs?.name ?? null,
          // Synthetic floor so trigram-only matches still sort sensibly.
          score: Math.max(
            0.25,
            tokenJaccard(target, normaliseName(c.name)),
          ),
        });
      }
    }
  } catch (e) {
    console.warn("[gam-course-mapping-echo] trigram seed failed", e);
  }

  const ranked = Array.from(scoredById.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 15);

  return ranked.map(({ id, name, country, sub_country, club_name }) => ({
    id,
    name,
    country,
    sub_country,
    club_name,
  }));
}

// ---- LLM orchestration -------------------------------------------------------

const SYSTEM_PROMPT =
  "You are a golf course identity reconciliation agent. Given a course name from the WHS (handicap) system, decide which row in our internal golf_courses table refers to the same physical course. Be decisive: when name + club + layout clearly identify the same physical course, return MATCH even if secondary metadata (country, sub_country, region) disagrees — WHS metadata is frequently miscoded. Only return NO_MATCH when no candidate is plausibly the same course. Only return CREATE_NEW when you are confident the course is real but truly absent from the candidate list. Respond ONLY with a single JSON object matching the schema described, no prose, no markdown.";

function userPrompt(
  whs: { name: string; country_code: string | null; country_name: string | null },
  candidates: Candidate[],
): string {
  const lines = candidates
    .map(
      (c, i) =>
        `  ${i + 1}. id=${c.id} | name="${c.name}" | club="${c.club_name ?? ""}" | sub_country="${c.sub_country ?? ""}" | country="${c.country ?? ""}"`,
    )
    .join("\n");
  return `WHS course to identify:
  name: "${whs.name}"
  country_code: ${whs.country_code ?? "null"}
  country_name: ${whs.country_name ?? "null"}

Candidate golf_courses rows (top ${candidates.length} by name similarity):
${lines}

Decide whether the WHS course matches one of these candidates. If yes,
return its id. If none of the candidates are the same physical course
return NO_MATCH. If you are confident the WHS course is real but is
missing from our table entirely, return CREATE_NEW. Watch for multi-course
clubs where the WHS row encodes the layout (e.g. "Old Course", "West") —
match to the specific course, not the parent club.

Identity rules (apply in order):
1. Physical identity wins. If the name, club, and layout clearly refer to
   the same physical course, return MATCH even when secondary metadata
   disagrees. Treat country / sub_country as TIE-BREAKERS between
   otherwise-equivalent candidates, NOT as disqualifiers — WHS country
   codes are frequently miscoded (e.g. Northern Ireland courses tagged
   "IE", Portugal courses bucketed as "Continental Europe", apostrophes
   and "The " prefixes dropped, "do" vs "da" typos).
2. Prefer MATCH over CREATE_NEW whenever a candidate is plausibly the same
   physical course. Only return CREATE_NEW when you are confident NONE of
   the 15 candidates is the same course AND the WHS course is real.
3. Spelling variants of the same proper noun (St George's / St Georges,
   Prince's / Princes, Quinta do / Quinta da) are the same course.
4. Country-code data errors NEVER block a MATCH. If the name unambiguously
   identifies a real-world course (e.g. "Royal Portrush-Dunluce"), match
   it to the corresponding candidate regardless of any country_code /
   sub_country disagreement. Worked example: WHS "Royal Portrush-Dunluce"
   with country_code=IE MUST match candidate "Royal Portrush Golf Club
   (Dunluce)" with sub_country=Northern Ireland — same physical course,
   the IE tag is a known WHS bucketing quirk for the island of Ireland.

Respond with EXACTLY this JSON shape:
{
  "decision": "MATCH" | "NO_MATCH" | "CREATE_NEW",
  "golf_course_id": "<uuid from candidates if decision=MATCH, else null>",
  "confidence": <number between 0 and 1>,
  "reasoning": "<one or two sentences>"
}`;
}

async function runLlmConsensus(
  whs: any,
  candidates: Candidate[],
): Promise<LlmResponse[]> {
  const prompt = userPrompt(whs, candidates);
  const candidateIds = new Set(candidates.map((c) => c.id));
  const results = await Promise.all([
    callAnthropic(prompt).then((r) => sanitise(r, candidateIds)),
    callOpenAi(prompt).then((r) => sanitise(r, candidateIds)),
    callGemini(prompt).then((r) => sanitise(r, candidateIds)),
  ]);
  return results;
}

function sanitise(r: LlmResponse, candidateIds: Set<string>): LlmResponse {
  if (r.decision === "MATCH" && (!r.golf_course_id || !candidateIds.has(r.golf_course_id))) {
    return {
      ...r,
      decision: "NO_MATCH",
      golf_course_id: null,
      reasoning: `[normalised: returned non-candidate id] ${r.reasoning}`,
    };
  }
  if (r.decision !== "MATCH") {
    return { ...r, golf_course_id: null };
  }
  return r;
}

function tryParseDecision(text: string): Omit<LlmResponse, "provider" | "model"> {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) {
    return {
      decision: "NO_MATCH",
      golf_course_id: null,
      confidence: 0,
      reasoning: "Could not parse JSON from LLM response.",
      raw: text,
      error: "parse_error",
    };
  }
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    const decision = (parsed.decision === "MATCH" ||
      parsed.decision === "CREATE_NEW" ||
      parsed.decision === "NO_MATCH")
      ? parsed.decision
      : "NO_MATCH";
    return {
      decision,
      golf_course_id: typeof parsed.golf_course_id === "string" ? parsed.golf_course_id : null,
      confidence: typeof parsed.confidence === "number" ? Math.max(0, Math.min(1, parsed.confidence)) : 0.5,
      reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning : "",
      raw: text,
    };
  } catch (e) {
    return {
      decision: "NO_MATCH",
      golf_course_id: null,
      confidence: 0,
      reasoning: "JSON parse failed",
      raw: text,
      error: e instanceof Error ? e.message : "parse_error",
    };
  }
}

async function callAnthropic(prompt: string): Promise<LlmResponse> {
  const key = Deno.env.get("ANTHROPIC_API_KEY");
  const model = "claude-sonnet-4-5-20250929";
  if (!key) return errorResp("anthropic", model, "no_api_key");
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await res.json();
    if (!res.ok) return errorResp("anthropic", model, data?.error?.message ?? `HTTP ${res.status}`);
    const text = data?.content?.[0]?.text ?? "";
    return { provider: "anthropic", model, ...tryParseDecision(text) };
  } catch (e) {
    return errorResp("anthropic", model, e instanceof Error ? e.message : "unknown");
  }
}

async function callOpenAi(prompt: string): Promise<LlmResponse> {
  const key = Deno.env.get("OPENAI_API_KEY");
  const model = "gpt-4o-2024-11-20";
  if (!key) return errorResp("openai", model, "no_api_key");
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
      }),
    });
    const data = await res.json();
    if (!res.ok) return errorResp("openai", model, data?.error?.message ?? `HTTP ${res.status}`);
    const text = data?.choices?.[0]?.message?.content ?? "";
    return { provider: "openai", model, ...tryParseDecision(text) };
  } catch (e) {
    return errorResp("openai", model, e instanceof Error ? e.message : "unknown");
  }
}

async function callGemini(prompt: string): Promise<LlmResponse> {
  const key = Deno.env.get("GEMINI_API_KEY");
  const model = "gemini-2.5-flash";
  if (!key) return errorResp("gemini", model, "no_api_key");
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0,
            responseMimeType: "application/json",
          },
        }),
      },
    );
    const data = await res.json();
    if (!res.ok) return errorResp("gemini", model, data?.error?.message ?? `HTTP ${res.status}`);
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return { provider: "gemini", model, ...tryParseDecision(text) };
  } catch (e) {
    return errorResp("gemini", model, e instanceof Error ? e.message : "unknown");
  }
}

function errorResp(
  provider: LlmResponse["provider"],
  model: string,
  err: string,
): LlmResponse {
  return {
    provider,
    model,
    decision: "NO_MATCH",
    golf_course_id: null,
    confidence: 0,
    reasoning: `LLM call failed: ${err}`,
    error: err,
  };
}

// ---- Consensus ---------------------------------------------------------------

interface Consensus {
  decision: Decision;
  golf_course_id: string | null;
  agreement_count: number;
  confidence: number;
  min_confidence: number; // min confidence across the top-voting LLMs (MATCH only)
  reasoning: string;
}

function computeConsensus(responses: LlmResponse[]): Consensus {
  const valid = responses.filter((r) => !r.error);
  // Tally MATCH votes by id.
  const idVotes = new Map<string, LlmResponse[]>();
  let noMatch = 0;
  let createNew = 0;
  for (const r of valid) {
    if (r.decision === "MATCH" && r.golf_course_id) {
      const arr = idVotes.get(r.golf_course_id) ?? [];
      arr.push(r);
      idVotes.set(r.golf_course_id, arr);
    } else if (r.decision === "NO_MATCH") noMatch++;
    else if (r.decision === "CREATE_NEW") createNew++;
  }

  let topId: string | null = null;
  let topVotes: LlmResponse[] = [];
  for (const [id, arr] of idVotes) {
    if (arr.length > topVotes.length) {
      topId = id;
      topVotes = arr;
    }
  }

  if (topVotes.length >= 2) {
    const conf = topVotes.reduce((s, r) => s + r.confidence, 0) / topVotes.length;
    const minConf = topVotes.reduce((m, r) => Math.min(m, r.confidence), 1);
    return {
      decision: "MATCH",
      golf_course_id: topId,
      agreement_count: topVotes.length,
      confidence: conf,
      min_confidence: minConf,
      reasoning: topVotes.map((r) => `${r.provider}: ${r.reasoning}`).join(" | "),
    };
  }
  if (noMatch >= 2) {
    return {
      decision: "NO_MATCH",
      golf_course_id: null,
      agreement_count: noMatch,
      confidence: 0.8,
      min_confidence: 0,
      reasoning: valid
        .filter((r) => r.decision === "NO_MATCH")
        .map((r) => `${r.provider}: ${r.reasoning}`)
        .join(" | "),
    };
  }
  if (createNew >= 2) {
    return {
      decision: "CREATE_NEW",
      golf_course_id: null,
      agreement_count: createNew,
      confidence: 0.8,
      min_confidence: 0,
      reasoning: valid
        .filter((r) => r.decision === "CREATE_NEW")
        .map((r) => `${r.provider}: ${r.reasoning}`)
        .join(" | "),
    };
  }
  // Split decision.
  return {
    decision: "NO_MATCH",
    golf_course_id: null,
    agreement_count: 1,
    confidence: 0.3,
    min_confidence: 0,
    reasoning:
      "Split decision across LLMs — no 2/3 majority. " +
      valid.map((r) => `${r.provider}=${r.decision}`).join(", "),
  };
}

type Recommendation =
  | "auto_apply"
  | "auto_apply_majority"
  | "admin_review"
  | "no_match"
  | "suggest_create_new";

// Confidence floor required for a 2/3 MATCH majority to auto-apply.
// Both top-voting LLMs must individually meet this bar.
const MAJORITY_AUTO_APPLY_MIN_CONFIDENCE = 0.9;

function recommendationFor(c: Consensus): Recommendation {
  if (c.decision === "MATCH" && c.agreement_count === 3) return "auto_apply";
  if (c.decision === "MATCH" && c.agreement_count === 2) {
    return c.min_confidence >= MAJORITY_AUTO_APPLY_MIN_CONFIDENCE
      ? "auto_apply_majority"
      : "admin_review";
  }
  if (c.decision === "MATCH") return "admin_review";
  if (c.decision === "NO_MATCH" && c.agreement_count >= 2) return "no_match";
  if (c.decision === "CREATE_NEW" && c.agreement_count >= 2) return "suggest_create_new";
  return "admin_review";
}

function methodFor(r: Recommendation): string {
  switch (r) {
    case "auto_apply":
      return "echo_consensus";
    case "auto_apply_majority":
      return "echo_consensus_majority";
    case "admin_review":
      return "echo_review";
    case "no_match":
      return "echo_no_match";
    case "suggest_create_new":
      return "create_new_course_suggested";
  }
}

const AUTO_APPLY_METHODS = new Set(["echo_consensus", "echo_consensus_majority"]);

// ---- Persistence -------------------------------------------------------------

async function persist(
  supabase: any,
  whsCourseId: string,
  golfCourseId: string | null,
  confidence: number,
  method: string,
  reasoning: string,
  agreementCount: number,
) {
  // For auto_apply (3/3 or 2/3 high-conf majority) we write the resolved
  // golf_course_id. For non-auto MATCH outcomes (echo_review) we still surface
  // the suggested id via echo_suggested_golf_course_id so the admin queue can
  // show "Echo suggests X" with a single-click confirm.
  const isAuto = AUTO_APPLY_METHODS.has(method);
  const isMatchSuggestion = method === "echo_review";
  const row = {
    whs_course_id: whsCourseId,
    golf_course_id: isAuto ? golfCourseId : null,
    echo_suggested_golf_course_id: isMatchSuggestion ? golfCourseId : null,
    match_confidence: confidence,
    match_method: method,
    matched_at: new Date().toISOString(),
    echo_reasoning: reasoning,
    echo_attempted_at: new Date().toISOString(),
    echo_agreement_count: agreementCount,
  };
  const { error } = await supabase
    .from("whs_to_golf_course_map")
    .upsert(row, { onConflict: "whs_course_id" });
  if (error) console.error("[gam-course-mapping-echo] upsert error", error);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
