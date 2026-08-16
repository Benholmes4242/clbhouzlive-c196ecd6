// Echo Intelligence v2 — Supabase Edge Function (Deno runtime).
//
// Rebuilt from clbhouz-pro-ai. Independent of v1 (v1 stays live until cutover).
// - New request contract: { chat_id, message }
// - Persists chats + messages in echo_chats / echo_chat_messages
// - Rate limits via echo_v2_rate_limits (windows: minute/hour/day)
// - Response cache via echo_v2_response_cache (single 7d, dual 7d, full 6h)
// - Consensus ladder identical to v1 (single/dual/full/live)
// - Synthesis (dual/full) STREAMS via Claude — no more block-return latency
// - No provider names anywhere in meta or streamed output
//
// ASCII only.

import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { crypto } from "https://deno.land/std@0.220.0/crypto/mod.ts";
import { decideRoute } from "./router.ts";

import { corsFor } from '../_shared/cors.ts';
// ─── Secrets (reuse v1 env names) ────────────────────────────────────────
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Service-role client for all writes (RLS blocks anon on rate-limit / cache).
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ─── Model pins (imported from _shared for cross-fn parity) ──────────────
import {
  ANTHROPIC_MODEL_SYNTH,
  OPENAI_MODEL_SYNTH,
  OPENAI_MODEL_INTENT,
  GEMINI_MODEL,
  PERPLEXITY_MODEL,
  BUILD,
} from "../_shared/echo-models.ts";
// Silence unused-import warning while INTENT is reserved.
void OPENAI_MODEL_INTENT;


// Rate limit windows (identical to v1).
const RATE_LIMIT_MINUTE = 10;
const RATE_LIMIT_HOUR   = 60;
const RATE_LIMIT_DAY    = 200;

// Cache TTLs.
const CACHE_TTL_SINGLE_MS = 7 * 24 * 60 * 60 * 1000;
const CACHE_TTL_DUAL_MS   = 7 * 24 * 60 * 60 * 1000;
const CACHE_TTL_FULL_MS   = 6 * 60 * 60 * 1000;




// ─── Utility ─────────────────────────────────────────────────────────────
async function withTimeout<T>(p: Promise<T>, ms = 20000): Promise<T> {
  const t = new Promise<never>((_, rej) => setTimeout(() => rej(new Error("Timeout")), ms));
  return Promise.race([p, t]);
}

function normalizeQuery(q: string): string {
  return q.toLowerCase().trim().replace(/\s+/g, " ");
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ─── Intent classification (ported unchanged from v1) ────────────────────
type QueryIntent = "tournament" | "course" | "player" | "user_advice" | "general";
type ConsensusLevel = "single" | "dual" | "full" | "live";

function classifyIntent(query: string): {
  intents: QueryIntent[];
  consensusLevel: ConsensusLevel;
  playerName: string | null;
  courseQuery: string | null;
  countryQuery: string | null;
} {
  const q = query.toLowerCase();
  const intents: QueryIntent[] = [];

  if (/\b(this week|next week|tournament|pick|picks|predict|who should i|who will win|masters|open|pga|lpga|liv|dp world|leaderboard|cut|field|favourite|favorite)\b/.test(q)) intents.push("tournament");
  if (/\b(course|courses|golf club|links|ranked|rating|best course|top course|near me|in (ireland|scotland|england|uk|usa|spain|portugal|europe)|bucket list|hidden gem)\b/.test(q)) intents.push("course");

  const playerMatch = q.match(/\b(rory|mcilroy|scottie|scheffler|rahm|hovland|fleetwood|spieth|koepka|dustin|johnson|tiger|woods|mickelson|rose|stenson|garcia|hatton|lowry|casey)\b/i);
  if (playerMatch || /\b(player|golfer|world ranking|owgr|stats|statistics)\b/.test(q)) intents.push("player");

  if (/\b(my handicap|for me|my game|my swing|should i|what should|recommend for|advice for|help me|my home course)\b/.test(q)) intents.push("user_advice");
  if (intents.length === 0) intents.push("general");

  let consensusLevel: ConsensusLevel;
  const { route } = decideRoute(query, "auto");

  if (route === "live" && !intents.includes("tournament") && !intents.includes("course")) {
    consensusLevel = "live";
  } else if (intents.includes("tournament") || (intents.includes("course") && intents.length > 1)) {
    consensusLevel = "full";
  } else if (intents.includes("user_advice") || intents.includes("player")) {
    consensusLevel = "dual";
  } else {
    consensusLevel = "single";
  }

  const playerName = playerMatch ? playerMatch[0] : null;
  const countryMatch = q.match(/\b(ireland|scotland|england|wales|uk|usa|spain|portugal|france|europe|northern ireland)\b/i);
  const courseQuery = intents.includes("course") ? query : null;
  const countryQuery = countryMatch ? countryMatch[0] : null;

  return { intents, consensusLevel, playerName, courseQuery, countryQuery };
}

// ─── BRIEF_ECHO_CHAT §0.2 — THE QUESTION KIND ────────────────────────────
//
// THE WHOLE ANSWER SHAPE HANGS OFF THIS MAPPING, so it lives in one place and
// is stated here. The client renders three shapes and nothing else:
//
//   your_golf  data-led   reads the member's rounds
//   course     data-led   reads course/tournament/player data, no member rounds
//   game       knowledge  READS NOTHING — prose only, no chart, no sources,
//                         no basis line
//
// The five raw intents are NOT sent to the client: they are not 1:1 with the
// shapes and a client switching on them would drift the moment a sixth intent
// is added. Mapping, per the approved reading:
//
//   user_advice          -> your_golf   (the member's own game)
//   course               -> course
//   tournament, player   -> course      (data-led, but read no member rounds)
//   general              -> game        (nothing was opened, nothing is cited)
//
// user_advice wins when it is present at all, because an answer that reads the
// member's rounds must be allowed to say so.
type EchoQuestionKind = "your_golf" | "course" | "game";

function mapIntentsToKind(intents: QueryIntent[]): EchoQuestionKind {
  if (intents.includes("user_advice")) return "your_golf";
  if (intents.includes("course") || intents.includes("tournament") || intents.includes("player")) {
    return "course";
  }
  return "game";
}


// ─── Echo context fetcher (ported unchanged) ─────────────────────────────
async function fetchEchoContext(
  userId: string,
  intents: QueryIntent[],
  playerName: string | null,
  courseQuery: string | null,
  countryQuery: string | null,
): Promise<{
  userContext: Record<string, unknown>;
  tournamentContext: Record<string, unknown> | null;
  courseContext: Record<string, unknown> | null;
  playerContext: Record<string, unknown> | null;
}> {
  let userContext: Record<string, unknown> = {};
  let tournamentContext: Record<string, unknown> | null = null;
  let courseContext: Record<string, unknown> | null = null;
  let playerContext: Record<string, unknown> | null = null;

  const fetches: Promise<void>[] = [];
  fetches.push(
    // deno-lint-ignore no-explicit-any
    supabaseAdmin.rpc("echo_get_user_context", { p_user_id: userId })
      .then(({ data }: any) => { if (data) userContext = data; })
      .catch(() => {}),
  );
  if (intents.includes("tournament")) {
    fetches.push(
      // deno-lint-ignore no-explicit-any
      supabaseAdmin.rpc("echo_get_tournament_context")
        .then(({ data }: any) => { if (data?.available) tournamentContext = data; })
        .catch(() => {}),
    );
  }
  if (intents.includes("course") && courseQuery) {
    fetches.push(
      // deno-lint-ignore no-explicit-any
      supabaseAdmin.rpc("echo_get_course_context", { p_query: courseQuery, p_country: countryQuery, p_limit: 8 })
        .then(({ data }: any) => { if (data?.available) courseContext = data; })
        .catch(() => {}),
    );
  }
  if (intents.includes("player") && playerName) {
    fetches.push(
      // deno-lint-ignore no-explicit-any
      supabaseAdmin.rpc("echo_get_player_context", { p_player_name: playerName })
        .then(({ data }: any) => { if (data?.available) playerContext = data; })
        .catch(() => {}),
    );
  }
  await Promise.all(fetches);
  return { userContext, tournamentContext, courseContext, playerContext };
}

function buildContextBlock(
  userContext: Record<string, unknown>,
  tournamentContext: Record<string, unknown> | null,
  courseContext: Record<string, unknown> | null,
  playerContext: Record<string, unknown> | null,
): string {
  const lines: string[] = [];

  if (userContext && Object.keys(userContext).length > 0) {
    const parts: string[] = [];
    if (userContext.display_name) parts.push(`Name: ${userContext.display_name}`);
    if (userContext.handicap != null) parts.push(`Handicap: ${userContext.handicap}`);
    if (userContext.home_club) parts.push(`Home club: ${userContext.home_club}`);
    if (userContext.city || userContext.country) {
      parts.push(`Location: ${[userContext.city, userContext.country].filter(Boolean).join(", ")}`);
    }
    if (parts.length > 0) lines.push(`\n## User Profile\n${parts.join(" | ")}`);
  }

  if (tournamentContext?.available && tournamentContext.tournament) {
    const t = tournamentContext.tournament as Record<string, unknown>;
    lines.push(`\n## Current Tournament Intelligence`);
    lines.push(`Tournament: ${t.name} | Status: ${t.status}`);
    lines.push(`Venue: ${t.venue}, ${t.location} | Par ${t.par}, ${t.yardage} yards`);
    if (t.purse) lines.push(`Purse: $${Number(t.purse).toLocaleString()}`);
    if (t.defending_champion) lines.push(`Defending champion: ${t.defending_champion}`);
    if (tournamentContext.predictions) {
      lines.push(`\nClbhouz Predictions:`);
      lines.push(JSON.stringify(tournamentContext.predictions, null, 2));
    }
    if (tournamentContext.dark_horses) {
      lines.push(`\nDark horses: ${JSON.stringify(tournamentContext.dark_horses)}`);
    }
    if (tournamentContext.course_dna) {
      const dna = tournamentContext.course_dna as Record<string, unknown>;
      lines.push(`\nCourse DNA: Type: ${dna.course_type} | Difficulty: ${dna.scoring_difficulty}`);
      lines.push(`Key stats: Putting ${dna.sg_putting_importance}, Driving ${dna.driving_distance_importance}, Approach ${dna.sg_approach_importance}`);
    }
  }

  if (courseContext?.available && Array.isArray(courseContext.courses) && courseContext.courses.length > 0) {
    lines.push(`\n## Clbhouz Course Database`);
    lines.push(`Top rated courses matching query:`);
    for (const c of courseContext.courses.slice(0, 6)) {
      const course = c as Record<string, unknown>;
      const rating = course.avg_rating ? ` | Rating: ${course.avg_rating}/10 (${course.review_count} reviews)` : "";
      const rank = course.global_rank ? ` | Global rank: #${course.global_rank}` : "";
      lines.push(`- ${course.name}, ${course.country}${rating}${rank}`);
    }
  }

  if (playerContext?.available) {
    const p = playerContext.player as Record<string, unknown>;
    const s = playerContext.current_season as Record<string, unknown>;
    const c = playerContext.career as Record<string, unknown>;
    lines.push(`\n## Player Data: ${p.name}`);
    lines.push(`Country: ${p.country} | Turned pro: ${p.turned_pro}`);
    if (s) lines.push(`Current season: Scoring avg ${s.scoring_average} | SG T2G ${s.sg_tee_to_green} | SG Putting ${s.sg_putting} | Wins: ${s.wins} | Top 10s: ${s.top_10s}`);
    if (c) lines.push(`Career: ${c.career_wins} wins | ${c.majors_won} majors | Best ranking: #${c.best_world_ranking}`);
  }

  return lines.join("\n");
}

// ─── Provider calls ──────────────────────────────────────────────────────

// Claude streaming (used for single AND for dual/full synthesis).
async function streamClaude(
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  onChunk: (token: string) => void,
): Promise<string> {
  const response = await withTimeout(fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      // Claude Sonnet 5: no temperature/top_p/top_k — recent generations
      // dropped those sampling params. Keep max_tokens + stream.
      model: ANTHROPIC_MODEL_SYNTH,
      // Synthesis stream — 3000 for headroom against Sonnet 5 thinking tokens
      // that count against max_tokens and can starve visible output.
      max_tokens: 3000,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: true,
    }),

  }), 30000);

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error(`[echo-v2] Claude stream ${response.status}:`, body);
    throw new Error(`Claude API error: ${response.status}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let full = "";
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data);
        // Sonnet 5 emits thinking_delta / signature_delta blocks before/around
        // the visible text_delta stream. Only append text_delta content.
        if (parsed?.type === "content_block_delta" && parsed?.delta?.type === "text_delta") {
          const token = parsed.delta.text || "";
          if (token) {
            full += token;
            onChunk(token);
          }
        }
      } catch { /* partial chunk */ }
    }
  }
  return full;
}

// Shared timeout for SYNC consensus calls. Streaming fetches keep the 20s
// default (that only guards headers). GPT-5.5 reasoning + Gemini 3 thinking
// need more than 20s for a full body.
const SYNC_TIMEOUT_MS = 45000;

function shapeSnippet(d: unknown): string {
  try {
    return JSON.stringify(d).slice(0, 300);
  } catch {
    return String(d).slice(0, 300);
  }
}

async function callClaudeSync(
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
): Promise<string> {
  const t0 = Date.now();
  const r = await withTimeout(fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      // Claude Sonnet 5: no temperature/top_p/top_k.
      model: ANTHROPIC_MODEL_SYNTH,
      max_tokens: 3000,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),

  }), SYNC_TIMEOUT_MS);
  if (!r.ok) {
    const body = await r.text().catch(() => "");
    console.error(`[echo-v2] Claude sync ${r.status}:`, body);
    throw new Error(`Claude API error: ${r.status}`);
  }
  const d = await r.json();
  // Sonnet 5 returns content: [{type:"thinking",...}, {type:"text", text:"..."}].
  // Concatenate ALL text blocks; skip thinking and any unknown block types.
  const blocks = Array.isArray(d?.content) ? d.content : [];
  const text = blocks
    .filter((b: any) => b?.type === "text" && typeof b?.text === "string")
    .map((b: any) => b.text)
    .join("")
    .trim();
  if (!text) {
    throw new Error(`Claude empty on 2xx: ${shapeSnippet(d)}`);
  }
  console.log(`[echo-v2] sync/claude ok in ${Date.now() - t0}ms, ${text.length} chars`);
  return text;
}

async function callOpenAISynth(
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
): Promise<string> {
  const t0 = Date.now();
  // Contributor voice — Claude synthesizes the final answer, so keep this
  // short and opinionated rather than an essay.
  const contribPrompt = `${systemPrompt}\n\nRespond concisely in under 400 words — key claims and reasoning only.`;
  const r = await withTimeout(fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      // GPT-5.5: chat completions rejects legacy `max_tokens` — use
      // `max_completion_tokens`. `reasoning_effort: "none"` is the fastest
      // tier (GPT-5-series).
      model: OPENAI_MODEL_SYNTH,
      max_completion_tokens: 700,
      reasoning_effort: "none",
      messages: [
        { role: "system", content: contribPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
    }),
  }), SYNC_TIMEOUT_MS);
  if (!r.ok) {
    const body = await r.text().catch(() => "");
    console.error(`[echo-v2] OpenAI ${r.status}:`, body);
    throw new Error(`OpenAI error: ${r.status}`);
  }
  const d = await r.json();
  const text = (d?.choices?.[0]?.message?.content || "").trim();
  if (!text) {
    throw new Error(`OpenAI empty on 2xx: ${shapeSnippet(d)}`);
  }
  console.log(`[echo-v2] sync/openai ok in ${Date.now() - t0}ms, ${text.length} chars`);
  return text;
}

async function callGemini(
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
): Promise<string> {
  const t0 = Date.now();
  const contents = messages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const r = await withTimeout(fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
      }),
    },
  ), SYNC_TIMEOUT_MS);
  if (!r.ok) {
    const body = await r.text().catch(() => "");
    console.error(`[echo-v2] Gemini ${r.status}:`, body);
    throw new Error(`Gemini error: ${r.status}`);
  }
  const d = await r.json();
  // Gemini 3.x returns multiple parts — some marked `thought: true`. Concat
  // every non-thought text part; the answer may not sit at parts[0].
  const parts: Array<{ text?: string; thought?: boolean }> =
    d?.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .filter((p) => p && p.thought !== true && typeof p.text === "string")
    .map((p) => p.text as string)
    .join("")
    .trim();
  if (!text) {
    throw new Error(`Gemini empty on 2xx: ${shapeSnippet(d)}`);
  }
  console.log(`[echo-v2] sync/gemini ok in ${Date.now() - t0}ms, ${text.length} chars`);
  return text;
}

async function callPerplexitySync(
  messages: Array<{ role: string; content: string }>,
): Promise<string> {
  const t0 = Date.now();
  const r = await withTimeout(fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
    },
    body: JSON.stringify({
      model: PERPLEXITY_MODEL,
      messages: [
        { role: "system", content: `Today is ${new Date().toISOString().split("T")[0]}. Provide only the most current factual data relevant to this golf question. Be brief.` },
        ...messages.slice(-2).map(m => ({ role: m.role, content: m.content })),
      ],
      max_tokens: 512,
    }),
  }), SYNC_TIMEOUT_MS);
  if (!r.ok) {
    const body = await r.text().catch(() => "");
    console.error(`[echo-v2] Perplexity sync ${r.status}:`, body);
    throw new Error(`Perplexity error: ${r.status}`);
  }
  const d = await r.json();
  const text = (d?.choices?.[0]?.message?.content || "")
    .replace(/\[\d+\]/g, "")
    .trim();
  if (!text) {
    throw new Error(`Perplexity empty on 2xx: ${shapeSnippet(d)}`);
  }
  console.log(`[echo-v2] sync/perplexity ok in ${Date.now() - t0}ms, ${text.length} chars`);
  return text;
}



// Streaming Perplexity for pure live queries.
async function* streamPerplexity(
  query: string,
  history: Array<{ role: string; content: string }>,
): AsyncGenerator<string> {
  const todayIso = new Date().toISOString().split("T")[0];
  const systemPrompt = [
    `You are Echo, a golf-first assistant with live web search. Today is ${todayIso}.`,
    "When asked about 'majors' without other context, assume golf majors.",
    "Always verify facts with fresh sources for schedules, rankings, results, and player status.",
    `Include "As of ${todayIso}" for time-sensitive information.`,
    "Be concise, structured, and provide specific dates/venues when discussing events.",
  ].join(" ");

  // Ensure history ends on an assistant turn so we don't send consecutive users.
  const cleanHistory = (history ?? []).filter((_, i, arr) => {
    let lastAssistantIdx = arr.length - 1;
    while (lastAssistantIdx >= 0 && arr[lastAssistantIdx].role === "user") lastAssistantIdx--;
    return i <= lastAssistantIdx;
  });

  const messages = [
    { role: "system", content: systemPrompt },
    ...cleanHistory,
    { role: "user", content: query },
  ];

  const resp = await withTimeout(fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: PERPLEXITY_MODEL,
      messages,
      temperature: 0.2,
      stream: true,
    }),
  }), 30000);

  if (!resp.ok) throw new Error(`Perplexity error: ${resp.status}`);
  const reader = resp.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === "data: [DONE]") continue;
      if (!trimmed.startsWith("data: ")) continue;
      try {
        const json = JSON.parse(trimmed.slice(6));
        const content = json.choices?.[0]?.delta?.content;
        if (content) {
          const cleaned = String(content).replace(/\[\d+\]/g, "");
          if (cleaned) yield cleaned;
        }
      } catch { /* partial */ }
    }
  }
}

// ─── Synthesis prompts (weights preserved from v1) ───────────────────────
// §3 ECHO OPENS WITH THE ANSWER. Live text read on device opened with two
// sentences before anything was said: "Great question, Benjamin - and living in
// London you're not far from some of the best examples in the world, so this is
// worth digging into properly." "Great question" is flattery, the member's name
// is not information, and where he lives has nothing to do with the question.
// A LINE ADVISES, IT DOES NOT NARRATE — the same rule the rest of the app runs
// on. This block is appended to EVERY prompt that produces member-facing text,
// including the synthesis prompts, because the synthesiser writes the words
// that actually stream.
const OPENING_RULE = [
  "OPEN WITH THE ANSWER. The first sentence must carry the first real piece of information.",
  "Never open with flattery (\"great question\", \"good one\", \"I love this question\").",
  "Never open by addressing the member by name, and never use their name as a greeting.",
  "Never restate or rephrase the question, and never announce what you are about to do (\"let's dig into\", \"here's the thing\", \"there are a few factors\").",
  "Never mention where the member lives, their handicap or any other context unless it changes the answer.",
  "No sign-off, no summary of what you just said. Advise; do not narrate.",
].join("\n");

function dualSynthesisPrompt(a: string, b: string): string {
  return `You are synthesising two golf assistant responses into one optimal answer.

Response A (weight 57%): ${a}

Response B (weight 43%): ${b}

${OPENING_RULE}

Produce a single, coherent response that:
- Weights A at 57% and B at 43%
- Keeps the best specific details from both
- Is concise and directly answers the user's question
- Does not mention synthesis, models, or multiple sources

After your answer, on a NEW LINE, output exactly one machine-readable line:
STRENGTH: 0.NN
where 0.NN is your confidence in this synthesis on a scale of 0.00 to 1.00
(higher = greater agreement between A and B). No other text after this line.`;
}

function fullSynthesisPrompt(a: string, b: string, c: string, d: string): string {
  return `You are synthesising four golf assistant responses using weighted consensus.

Weights:
- Source A (40%): ${a || "No response"}
- Source B (35%): ${b || "No response"}
- Source C (20%): ${c || "No response"}
- Source D (5%, live data): ${d || "No response"}

${OPENING_RULE}

Produce a single, authoritative response that:
- Weights each source proportionally to its weight above
- Prioritises specific facts, names, and data points where sources agree
- For disagreements, favours the higher-weighted source
- Incorporates any real-time data from source D where relevant
- Is well-structured and directly answers the user's question
- Does not mention sources, models, or the synthesis process

After your answer, on a NEW LINE, output exactly one machine-readable line:
STRENGTH: 0.NN
where 0.NN is your confidence in this consensus on a scale of 0.00 to 1.00
(higher = greater agreement across sources). No other text after this line.`;
}

// Parses and strips a trailing "STRENGTH: 0.NN" line from streamed text.
// Returns cleaned text + parsed strength (null if none).
function extractStrength(raw: string, fallback: number): { cleaned: string; strength: number } {
  const m = raw.match(/\n?\s*STRENGTH:\s*(0(?:\.\d{1,3})?|1(?:\.0{1,3})?)\s*$/i);
  if (!m) return { cleaned: raw.trim(), strength: fallback };
  const v = Math.max(0, Math.min(1, parseFloat(m[1])));
  const cleaned = raw.slice(0, m.index).trim();
  return { cleaned, strength: v };
}

// ─── Rate limiting (echo_v2_rate_limits) ─────────────────────────────────
function windowStartsFor(now: Date): Record<"minute" | "hour" | "day", Date> {
  return {
    minute: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes())),
    hour:   new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours())),
    day:    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())),
  };
}

async function checkAndBumpRateLimits(userId: string): Promise<{ allowed: true } | { allowed: false; error: string; retryAfter: number }> {
  const now = new Date();
  const ws = windowStartsFor(now);
  try {
    // Read current counts for all three windows in parallel.
    const [minRow, hrRow, dayRow] = await Promise.all([
      supabaseAdmin.from("echo_v2_rate_limits").select("count").eq("user_id", userId).eq("window_kind", "minute").eq("window_start", ws.minute.toISOString()).maybeSingle(),
      supabaseAdmin.from("echo_v2_rate_limits").select("count").eq("user_id", userId).eq("window_kind", "hour").eq("window_start", ws.hour.toISOString()).maybeSingle(),
      supabaseAdmin.from("echo_v2_rate_limits").select("count").eq("user_id", userId).eq("window_kind", "day").eq("window_start", ws.day.toISOString()).maybeSingle(),
    ]);

    const minCount = (minRow.data?.count as number | undefined) ?? 0;
    const hrCount  = (hrRow.data?.count  as number | undefined) ?? 0;
    const dayCount = (dayRow.data?.count as number | undefined) ?? 0;

    if (minCount >= RATE_LIMIT_MINUTE) return { allowed: false, error: "RATE_LIMIT_MINUTE", retryAfter: 60 - now.getUTCSeconds() };
    if (hrCount  >= RATE_LIMIT_HOUR)   return { allowed: false, error: "RATE_LIMIT_HOUR",   retryAfter: 60 - now.getUTCMinutes() };
    if (dayCount >= RATE_LIMIT_DAY)    return { allowed: false, error: "RATE_LIMIT_DAY",    retryAfter: 0 };

    // Upsert-increment all three windows.
    await Promise.all([
      supabaseAdmin.from("echo_v2_rate_limits").upsert(
        { user_id: userId, window_kind: "minute", window_start: ws.minute.toISOString(), count: minCount + 1 },
        { onConflict: "user_id,window_kind,window_start" },
      ),
      supabaseAdmin.from("echo_v2_rate_limits").upsert(
        { user_id: userId, window_kind: "hour", window_start: ws.hour.toISOString(), count: hrCount + 1 },
        { onConflict: "user_id,window_kind,window_start" },
      ),
      supabaseAdmin.from("echo_v2_rate_limits").upsert(
        { user_id: userId, window_kind: "day", window_start: ws.day.toISOString(), count: dayCount + 1 },
        { onConflict: "user_id,window_kind,window_start" },
      ),
    ]);
    return { allowed: true };
  } catch (e) {
    console.error("[echo-v2] rate-limit db error, failing open:", e);
    return { allowed: true };
  }
}

// ─── Response cache (echo_v2_response_cache) ─────────────────────────────
type CachedRow = { response_text: string; meta: Record<string, unknown>; hit_count: number; expires_at: string };

async function cacheGet(hash: string, route: "single" | "dual" | "full"): Promise<CachedRow | null> {
  try {
    const { data } = await supabaseAdmin
      .from("echo_v2_response_cache")
      .select("response_text, meta, hit_count, expires_at")
      .eq("query_hash", hash)
      .eq("route", route)
      .maybeSingle();
    if (!data) return null;
    if (new Date(data.expires_at).getTime() <= Date.now()) return null;
    return data as CachedRow;
  } catch {
    return null;
  }
}

function cacheBumpHitFireAndForget(hash: string, route: string, hitCount: number): void {
  supabaseAdmin.from("echo_v2_response_cache")
    .update({ hit_count: (hitCount ?? 0) + 1 })
    .eq("query_hash", hash)
    .eq("route", route)
    .then(() => {});
}

async function cachePut(
  hash: string,
  route: "single" | "dual" | "full",
  responseText: string,
  meta: Record<string, unknown>,
): Promise<void> {
  const ttl = route === "full" ? CACHE_TTL_FULL_MS : (route === "dual" ? CACHE_TTL_DUAL_MS : CACHE_TTL_SINGLE_MS);
  const expiresAt = new Date(Date.now() + ttl).toISOString();
  try {
    await supabaseAdmin.from("echo_v2_response_cache").upsert({
      query_hash: hash,
      route,
      response_text: responseText,
      meta,
      hit_count: 1,
      created_at: new Date().toISOString(),
      expires_at: expiresAt,
    }, { onConflict: "query_hash,route" });
  } catch (e) {
    console.error("[echo-v2] cache put failed:", e);
  }
}

// ─── Auth ────────────────────────────────────────────────────────────────
async function resolveUserId(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  try {
    // Prefer Supabase-verified user resolution.
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data, error } = await client.auth.getClaims(token);
    if (error || !data?.claims?.sub) return null;
    return data.claims.sub as string;
  } catch {
    return null;
  }
}

// ─── SSE ─────────────────────────────────────────────────────────────────
type Send = (payload: object, eventName?: string) => void;

function makeSseWriter(controller: ReadableStreamDefaultController<Uint8Array>): Send {
  const encoder = new TextEncoder();
  return (payload: object, eventName?: string) => {
    const eventLine = eventName ? `event: ${eventName}\n` : "";
    controller.enqueue(encoder.encode(`${eventLine}data: ${JSON.stringify(payload)}\n\n`));
  };
}

// ─── Main handler ────────────────────────────────────────────────────────
serve(async (req: Request) => {
  const corsHeaders = corsFor(req.headers.get('Origin'));
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const t0 = Date.now();

  // 1) Resolve user from JWT.
  const userId = await resolveUserId(req.headers.get("authorization"));
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 2) Rate limits.
  const rl = await checkAndBumpRateLimits(userId);
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: rl.error, retryAfter: rl.retryAfter }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 3) Parse body.
  let body: { chat_id: string | null; message: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const message = (body?.message || "").toString().trim();
  const chatIdIn = body?.chat_id ?? null;
  if (!message) {
    return new Response(JSON.stringify({ error: "Empty message" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 4) Resolve / create chat.
  let chatId: string;
  if (chatIdIn) {
    const { data: row, error } = await supabaseAdmin
      .from("echo_chats").select("id, user_id").eq("id", chatIdIn).maybeSingle();
    if (error || !row) {
      return new Response(JSON.stringify({ error: "Chat not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (row.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    chatId = row.id as string;
  } else {
    const title = message.length > 60 ? `${message.slice(0, 57).trim()}...` : message;
    const { data: inserted, error } = await supabaseAdmin
      .from("echo_chats")
      .insert({ user_id: userId, title })
      .select("id")
      .single();
    if (error || !inserted) {
      return new Response(JSON.stringify({ error: "Failed to create chat" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    chatId = inserted.id as string;
  }

  // 5) Persist USER message.
  await supabaseAdmin.from("echo_chat_messages").insert({
    chat_id: chatId, role: "user", content: message, meta: {},
  });

  // 6) Route + intent + context (all needed before streaming).
  const { intents, consensusLevel, playerName, courseQuery, countryQuery } = classifyIntent(message);
  const routeLevel: ConsensusLevel = consensusLevel;
  // BRIEF_ECHO_CHAT §0.2 — emitted on the EXISTING `meta` event (no second
  // event). See mapIntentsToKind for the mapping and why it is server-side.
  const questionKind = mapIntentsToKind(intents);

  // 7) Cache lookup (single/dual/full only — NEVER live).
  const queryHash = await sha256Hex(`${userId}|${normalizeQuery(message)}`);
  const cacheRoute: "single" | "dual" | "full" | null =
    routeLevel === "live" ? null : (routeLevel as "single" | "dual" | "full");

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = makeSseWriter(controller);

      // Immediately tell the client which chat this stream belongs to.
      send({ chat_id: chatId }, "chat");

      // Cached fast path.
      if (cacheRoute) {
        const cached = await cacheGet(queryHash, cacheRoute);
        if (cached) {
          cacheBumpHitFireAndForget(queryHash, cacheRoute, cached.hit_count);
          // Stream cached text as a single delta (client renders progressively either way).
          send({ delta: cached.response_text });
          const meta = { ...(cached.meta || {}), kind: questionKind, cached: true, ms: Date.now() - t0 };
          send(meta, "meta");
          // Persist assistant message with cached flag.
          await supabaseAdmin.from("echo_chat_messages").insert({
            chat_id: chatId, role: "assistant", content: cached.response_text, meta,
          });
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }
      }

      // Fresh generation path.
      let finalText = "";
      let strength = 0.75; // baseline for single
      let engines = 1;
      let live = routeLevel === "live";

      const persistAndClose = async (metaExtras: Record<string, unknown> = {}) => {
        const meta = {
          v: BUILD,
          route: routeLevel,
          kind: questionKind,
          strength: Number(strength.toFixed(2)),
          engines,
          live,
          ms: Date.now() - t0,
          // Authoritative cleaned text (post STRENGTH strip) so the client
          // can reconcile any tail characters that may have streamed before
          // the marker was fully seen.
          text: finalText,
          ...metaExtras,
        };
        // Cache successful non-live responses. `live` flips true whenever
        // Perplexity contributed (full route with a live grounding), so we
        // skip caching those too — freshness > 6h TTL would stale them fast.
        if (cacheRoute && finalText && !metaExtras.error && !live) {
          await cachePut(queryHash, cacheRoute, finalText, meta);
        }
        // Persist assistant message even if client disconnected.
        await supabaseAdmin.from("echo_chat_messages").insert({
          chat_id: chatId, role: "assistant", content: finalText, meta,
        });
        try { send(meta, "meta"); } catch { /* client gone */ }
        try { controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n")); } catch {}
        try { controller.close(); } catch {}
      };

      try {
        // Fetch context (skipped for pure live route).
        const ctx = routeLevel === "live"
          ? { userContext: {}, tournamentContext: null, courseContext: null, playerContext: null }
          : await fetchEchoContext(userId, intents, playerName, courseQuery, countryQuery);

        const todayDate = new Date().toISOString().split("T")[0];
        const contextBlock = buildContextBlock(ctx.userContext, ctx.tournamentContext, ctx.courseContext, ctx.playerContext);
        const displayName = (ctx.userContext?.display_name as string) || null;
        const firstName = displayName ? displayName.split(" ")[0] : null;
        // The name is available for a mid-answer reference at most; it is NEVER an
        // opening and never a greeting (see OPENING_RULE).
        const nameGreeting = firstName
          ? ` The member is ${firstName}, but do not greet them or open with their name.`
          : "";
        const enrichedSystemPrompt = [
          `You are Echo, a world-class personal golf caddie and advisor.${nameGreeting}`,
          `Today is ${todayDate}.`,
          `You have access to real Clbhouz platform data — course ratings, tournament predictions, and player statistics. Present it as your own knowledge.`,
          `Be conversational, specific, and practical. Speak like a knowledgeable caddie, not a search engine.`,
          `Never mention that multiple models or systems produced this answer — Echo is one voice.`,
          OPENING_RULE,
          contextBlock,
        ].join("\n");

        const history: Array<{ role: string; content: string }> = [];
        const finalMessages = history.concat([{ role: "user", content: message }]);

        if (routeLevel === "live") {
          engines = 1; live = true;
          // Stream Perplexity directly.
          let buf = "";
          for await (const chunk of streamPerplexity(message, history)) {
            buf += chunk;
            send({ delta: chunk });
          }
          finalText = buf.trim();
          // heuristic: live answers get a modest baseline strength
          strength = 0.7;
        } else if (routeLevel === "single") {
          engines = 1;
          let buf = "";
          await streamClaude(enrichedSystemPrompt, finalMessages, (tok) => {
            buf += tok;
            send({ delta: tok });
          });
          finalText = buf.trim();
          strength = 0.75;
        } else if (routeLevel === "dual") {
          // Fan out to the two synthesis sources in parallel. Per-engine
          // failure returns "" (logged inside the call) — the pipeline
          // does NOT abort; `engines` reflects the actual contributors.
          const [a, b] = await Promise.all([
            callClaudeSync(enrichedSystemPrompt, finalMessages).catch((e) => { console.error("[echo-v2] dual/claude drop:", e?.message || e); return ""; }),
            callOpenAISynth(enrichedSystemPrompt, finalMessages).catch((e) => { console.error("[echo-v2] dual/openai drop:", e?.message || e); return ""; }),
          ]);
          engines = [a, b].filter(Boolean).length;
          // Stream the SYNTHESIS itself so the user sees consensus tokens live.
          let raw = "";
          const strengthTail = /STRENGTH:\s*[0-9.]*\s*$/i;
          await streamClaude(
            dualSynthesisPrompt(a, b),
            [{ role: "user", content: "Synthesise now." }],
            (tok) => {
              raw += tok;
              // Hold back if the tail looks like it may be the STRENGTH marker.
              if (strengthTail.test(raw) || /\n\s*STRENGTH:?\s*$/i.test(raw)) return;
              send({ delta: tok });
            },
          );
          const { cleaned, strength: s } = extractStrength(raw, 0.8);
          finalText = cleaned;
          strength = s;
        } else {
          // full
          const [a, b, c, d] = await Promise.all([
            callClaudeSync(enrichedSystemPrompt, finalMessages).catch((e) => { console.error("[echo-v2] full/claude drop:", e?.message || e); return ""; }),
            callOpenAISynth(enrichedSystemPrompt, finalMessages).catch((e) => { console.error("[echo-v2] full/openai drop:", e?.message || e); return ""; }),
            callGemini(enrichedSystemPrompt, finalMessages).catch((e) => { console.error("[echo-v2] full/gemini drop:", e?.message || e); return ""; }),
            callPerplexitySync(finalMessages).catch((e) => { console.error("[echo-v2] full/perplexity drop:", e?.message || e); return ""; }),
          ]);
          engines = [a, b, c, d].filter(Boolean).length;
          live = Boolean(d);
          let raw = "";
          const strengthTail = /STRENGTH:\s*[0-9.]*\s*$/i;
          await streamClaude(
            fullSynthesisPrompt(a, b, c, d),
            [{ role: "user", content: "Synthesise now." }],
            (tok) => {
              raw += tok;
              if (strengthTail.test(raw) || /\n\s*STRENGTH:?\s*$/i.test(raw)) return;
              send({ delta: tok });
            },
          );
          const { cleaned, strength: s } = extractStrength(raw, 0.85);
          finalText = cleaned;
          strength = s;
        }

        if (!finalText) {
          finalText = "Sorry, I couldn't generate a response. Please try again.";
        }
        await persistAndClose();
      } catch (err) {
        console.error("[echo-v2] pipeline error:", err);
        // Best-effort graceful fallback: single Claude call.
        try {
          let buf = "";
          await streamClaude(
            "You are Echo, a helpful golf caddie. Be concise.",
            [{ role: "user", content: message }],
            (tok) => { buf += tok; send({ delta: tok }); },
          );
          finalText = buf.trim() || "Sorry, something went wrong.";
          await persistAndClose({ fallback: true });
        } catch {
          try { send({ error: "Echo encountered an error. Please try again." }, "error"); } catch {}
          await persistAndClose({ error: true });
        }
      }
    },
  });

  return new Response(stream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" } });
});
