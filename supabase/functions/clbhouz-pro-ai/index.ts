// Supabase Edge Function (Deno runtime)
// ⚠️ Router applies ONLY to text Q&A. SwingCoach (CV/video) and CaddieLogs flows are untouched.
import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { crypto } from "https://deno.land/std@0.220.0/crypto/mod.ts";
import { decideRoute, type Mode } from "./router.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const OPENAI_MODEL = "gpt-4o";
const PERPLEXITY_MODEL = "llama-3.1-sonar-large-128k-online";
const ANTHROPIC_MODEL = "claude-sonnet-4-5";
const GEMINI_MODEL = "gemini-1.5-pro-latest";
const DEFAULT_TIMEZONE = "Europe/London";

// Rate limiting config
const RATE_LIMIT_MINUTE = 10;
const RATE_LIMIT_HOUR = 60;
const RATE_LIMIT_DAY = 200;

// ─── Intent Classification ───────────────────────────────────────────────

type QueryIntent =
  | 'tournament'
  | 'course'
  | 'player'
  | 'user_advice'
  | 'general';

type ConsensusLevel =
  | 'single'    // Claude only — simple technique/rules
  | 'dual'      // Claude + GPT-4o — user-specific advice
  | 'full'      // All 4 models — complex recommendations
  | 'live';     // Perplexity only — real-time data

function classifyIntent(query: string): {
  intents: QueryIntent[];
  consensusLevel: ConsensusLevel;
  playerName: string | null;
  courseQuery: string | null;
  countryQuery: string | null;
} {
  const q = query.toLowerCase();

  const intents: QueryIntent[] = [];

  // Tournament intent
  if (/\b(this week|next week|tournament|pick|picks|predict|who should i|who will win|masters|open|pga|lpga|liv|dp world|leaderboard|cut|field|favourite|favorite)\b/.test(q)) {
    intents.push('tournament');
  }

  // Course intent
  if (/\b(course|courses|golf club|links|ranked|rating|best course|top course|near me|in (ireland|scotland|england|uk|usa|spain|portugal|europe)|bucket list|hidden gem)\b/.test(q)) {
    intents.push('course');
  }

  // Player intent — extract name if possible
  const playerMatch = q.match(/\b(rory|mcilroy|scottie|scheffler|rahm|hovland|fleetwood|spieth|koepka|dustin|johnson|tiger|woods|mickelson|rose|stenson|garcia|hatton|lowry|casey)\b/i);
  if (playerMatch || /\b(player|golfer|world ranking|owgr|stats|statistics)\b/.test(q)) {
    intents.push('player');
  }

  // User advice intent
  if (/\b(my handicap|for me|my game|my swing|should i|what should|recommend for|advice for|help me|my home course)\b/.test(q)) {
    intents.push('user_advice');
  }

  if (intents.length === 0) intents.push('general');

  // Determine consensus level
  let consensusLevel: ConsensusLevel;
  const { route } = decideRoute(query, 'auto');

  if (route === 'live' && !intents.includes('tournament') && !intents.includes('course')) {
    consensusLevel = 'live';
  } else if (
    intents.includes('tournament') ||
    (intents.includes('course') && intents.length > 1)
  ) {
    consensusLevel = 'full';
  } else if (intents.includes('user_advice') || intents.includes('player')) {
    consensusLevel = 'dual';
  } else {
    consensusLevel = 'single';
  }

  // Extract player name
  const playerName = playerMatch ? playerMatch[0] : null;

  // Extract course/country query
  const countryMatch = q.match(/\b(ireland|scotland|england|wales|uk|usa|spain|portugal|france|europe|northern ireland)\b/i);
  const courseQuery = intents.includes('course') ? query : null;
  const countryQuery = countryMatch ? countryMatch[0] : null;

  return { intents, consensusLevel, playerName, courseQuery, countryQuery };
}

// ─── Context Fetcher ─────────────────────────────────────────────────────

async function fetchEchoContext(
  client: ReturnType<typeof createClient>,
  userId: string,
  intents: QueryIntent[],
  playerName: string | null,
  courseQuery: string | null,
  countryQuery: string | null
): Promise<{
  userContext: Record<string, unknown>;
  tournamentContext: Record<string, unknown> | null;
  courseContext: Record<string, unknown> | null;
  playerContext: Record<string, unknown> | null;
}> {
  const fetches: Promise<void>[] = [];

  let userContext: Record<string, unknown> = {};
  let tournamentContext: Record<string, unknown> | null = null;
  let courseContext: Record<string, unknown> | null = null;
  let playerContext: Record<string, unknown> | null = null;

  // Always fetch user context
  fetches.push(
    // deno-lint-ignore no-explicit-any
    client.rpc('echo_get_user_context', { p_user_id: userId })
      .then(({ data }: any) => { if (data) userContext = data; })
      .catch(() => {})
  );

  // Tournament context
  if (intents.includes('tournament')) {
    fetches.push(
      // deno-lint-ignore no-explicit-any
      client.rpc('echo_get_tournament_context')
        .then(({ data }: any) => { if (data?.available) tournamentContext = data; })
        .catch(() => {})
    );
  }

  // Course context
  if (intents.includes('course') && courseQuery) {
    fetches.push(
      // deno-lint-ignore no-explicit-any
      client.rpc('echo_get_course_context', {
        p_query: courseQuery,
        p_country: countryQuery,
        p_limit: 8
      })
        .then(({ data }: any) => { if (data?.available) courseContext = data; })
        .catch(() => {})
    );
  }

  // Player context
  if (intents.includes('player') && playerName) {
    fetches.push(
      // deno-lint-ignore no-explicit-any
      client.rpc('echo_get_player_context', { p_player_name: playerName })
        .then(({ data }: any) => { if (data?.available) playerContext = data; })
        .catch(() => {})
    );
  }

  // Run all fetches in parallel
  await Promise.all(fetches);

  return { userContext, tournamentContext, courseContext, playerContext };
}

// ─── Context-to-Prompt Builder ───────────────────────────────────────────

function buildContextBlock(
  userContext: Record<string, unknown>,
  tournamentContext: Record<string, unknown> | null,
  courseContext: Record<string, unknown> | null,
  playerContext: Record<string, unknown> | null
): string {
  const lines: string[] = [];

  // User block — always included
  if (userContext && Object.keys(userContext).length > 0) {
    const parts: string[] = [];
    if (userContext.display_name) parts.push(`Name: ${userContext.display_name}`);
    if (userContext.handicap != null) parts.push(`Handicap: ${userContext.handicap}`);
    if (userContext.home_club) parts.push(`Home club: ${userContext.home_club}`);
    if (userContext.city || userContext.country) {
      parts.push(`Location: ${[userContext.city, userContext.country].filter(Boolean).join(', ')}`);
    }
    if (parts.length > 0) {
      lines.push(`\n## User Profile\n${parts.join(' | ')}`);
    }
  }

  // Tournament block
  if (tournamentContext?.available && tournamentContext.tournament) {
    const t = tournamentContext.tournament as Record<string, unknown>;
    lines.push(`\n## Current Tournament Intelligence`);
    lines.push(`Tournament: ${t.name} | Status: ${t.status}`);
    lines.push(`Venue: ${t.venue}, ${t.location} | Par ${t.par}, ${t.yardage} yards`);
    if (t.purse) lines.push(`Purse: $${Number(t.purse).toLocaleString()}`);
    if (t.defending_champion) lines.push(`Defending champion: ${t.defending_champion}`);

    if (tournamentContext.predictions) {
      lines.push(`\nClbhouz AI Predictions (3-model consensus):`);
      lines.push(JSON.stringify(tournamentContext.predictions, null, 2));
    }
    if (tournamentContext.dark_horses) {
      lines.push(`\nDark horses: ${JSON.stringify(tournamentContext.dark_horses)}`);
    }
    if (tournamentContext.course_dna) {
      const dna = tournamentContext.course_dna as Record<string, unknown>;
      lines.push(`\nCourse DNA: Type: ${dna.course_type} | Difficulty: ${dna.scoring_difficulty}`);
      lines.push(`Key stats: Putting importance ${dna.sg_putting_importance}, Driving distance ${dna.driving_distance_importance}, Approach ${dna.sg_approach_importance}`);
    }
  }

  // Course block
  if (courseContext?.available && Array.isArray(courseContext.courses) && courseContext.courses.length > 0) {
    lines.push(`\n## Clbhouz Course Database`);
    lines.push(`Top rated courses matching query:`);
    for (const c of courseContext.courses.slice(0, 6)) {
      const course = c as Record<string, unknown>;
      const rating = course.avg_rating ? ` | Rating: ${course.avg_rating}/10 (${course.review_count} reviews)` : '';
      const rank = course.global_rank ? ` | Global rank: #${course.global_rank}` : '';
      lines.push(`- ${course.name}, ${course.country}${rating}${rank}`);
    }
  }

  // Player block
  if (playerContext?.available) {
    const p = playerContext.player as Record<string, unknown>;
    const s = playerContext.current_season as Record<string, unknown>;
    const c = playerContext.career as Record<string, unknown>;
    lines.push(`\n## Player Data: ${p.name}`);
    lines.push(`Country: ${p.country} | Turned pro: ${p.turned_pro}`);
    if (s) {
      lines.push(`Current season: Scoring avg ${s.scoring_average} | SG Total ${s.sg_tee_to_green} | SG Putting ${s.sg_putting} | Wins: ${s.wins} | Top 10s: ${s.top_10s}`);
    }
    if (c) {
      lines.push(`Career: ${c.career_wins} wins | ${c.majors_won} majors | Best ranking: #${c.best_world_ranking}`);
    }
  }

  return lines.join('\n');
}

// ─── Claude Streaming ────────────────────────────────────────────────────

async function streamClaude(
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  onChunk: (token: string) => void
): Promise<string> {
  const response = await withTimeout(fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: true,
    }),
  }), 30000);

  if (!response.ok) {
    console.error(`[Echo] Provider failure — Anthropic | model: ${ANTHROPIC_MODEL} | status: ${response.status}`);
    throw new Error(`Claude API error: ${response.status}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          const token = parsed?.delta?.text || '';
          if (token) {
            fullText += token;
            onChunk(token);
          }
        } catch { /* partial chunk */ }
      }
    }
  }

  return fullText;
}

// ─── Gemini Non-Streaming ────────────────────────────────────────────────

async function callGemini(
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const response = await withTimeout(fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
      }),
    }
  ), 20000);

  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ─── GPT-4o Non-Streaming ────────────────────────────────────────────────

async function callGPT4o(
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  const response = await withTimeout(fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
    }),
  }), 20000);

  if (!response.ok) throw new Error(`GPT-4o API error: ${response.status}`);
  const data = await response.json();
  return data?.choices?.[0]?.message?.content || '';
}

// ─── Claude Non-Streaming (for consensus) ────────────────────────────────

async function callClaudeSync(
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  const r = await withTimeout(fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
  }), 20000);
  const d = await r.json();
  return d?.content?.[0]?.text || '';
}

// ─── Consensus Synthesiser ───────────────────────────────────────────────

async function runConsensus(
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  consensusLevel: ConsensusLevel,
  onChunk: (token: string) => void
): Promise<void> {
  if (consensusLevel === 'single') {
    await streamClaude(systemPrompt, messages, onChunk);
    return;
  }

  if (consensusLevel === 'dual') {
    const [claudeResponse, gptResponse] = await Promise.all([
      callClaudeSync(systemPrompt, messages).catch(() => ''),
      callGPT4o(systemPrompt, messages).catch(() => ''),
    ]);

    const synthesisPrompt = `You are synthesising two golf AI responses into one optimal answer.

Model A (Claude, weight 57%): ${claudeResponse}

Model B (GPT-4o, weight 43%): ${gptResponse}

Produce a single, coherent response that:
- Weights Model A's perspective at 57% and Model B's at 43%
- Keeps the best specific details from both
- Is concise and directly answers the user's question
- Does not mention that you are synthesising multiple models
- Uses the user's name if present in the context

Respond with only the final answer, nothing else.`;

    await streamClaude(synthesisPrompt, [{ role: 'user', content: 'Synthesise now.' }], onChunk);
    return;
  }

  if (consensusLevel === 'full') {
    const [claudeResponse, gptResponse, geminiResponse, perplexityResponse] = await Promise.all([
      callClaudeSync(systemPrompt, messages).catch(() => ''),
      callGPT4o(systemPrompt, messages).catch(() => ''),
      callGemini(systemPrompt, messages).catch(() => ''),
      (async () => {
        const r = await withTimeout(fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'sonar',
            messages: [
              { role: 'system', content: `Today is ${new Date().toISOString().split('T')[0]}. Provide only the most current factual data relevant to this golf question. Be brief.` },
              ...messages.slice(-2).map(m => ({ role: m.role, content: m.content })),
            ],
            max_tokens: 512,
          }),
        }), 20000);
        const d = await r.json();
        return d?.choices?.[0]?.message?.content || '';
      })().catch(() => ''),
    ]);

    const synthesisPrompt = `You are synthesising four golf AI responses using weighted consensus (same method as the Clbhouz Tournament Intelligence system).

Model weights:
- Claude (40%): ${claudeResponse || 'No response'}
- GPT-4o (35%): ${gptResponse || 'No response'}  
- Gemini (20%): ${geminiResponse || 'No response'}
- Perplexity/live data (5%): ${perplexityResponse || 'No response'}

Produce a single, authoritative response that:
- Weights each model's contribution proportionally to its weight above
- Prioritises specific facts, names, and data points where models agree
- For disagreements, favours the higher-weighted model
- Incorporates any real-time data from Perplexity where relevant
- Is well-structured and directly answers the user's question
- Uses the user's name naturally where appropriate
- Does not mention models, AI, or the synthesis process
- Reads as one cohesive, expert caddie response

Respond with only the final answer.`;

    await streamClaude(synthesisPrompt, [{ role: 'user', content: 'Synthesise now.' }], onChunk);
    return;
  }

  // consensusLevel === 'live' — handled by caller
}

// ─── Rate Limiting ───────────────────────────────────────────────────────

async function checkRateLimitDB(userId: string): Promise<{ allowed: boolean; error?: string; retryAfter?: number }> {
  const now = new Date();
  
  const minuteStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
  const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  try {
    const { data: minuteData } = await supabaseAdmin
      .from('echo_rate_limits')
      .select('request_count')
      .eq('user_id', userId)
      .eq('window_type', 'minute')
      .eq('window_start', minuteStart.toISOString())
      .maybeSingle();

    if (minuteData && minuteData.request_count >= RATE_LIMIT_MINUTE) {
      const retryAfter = 60 - now.getSeconds();
      return { allowed: false, error: "RATE_LIMIT_MINUTE", retryAfter };
    }

    const { data: hourData } = await supabaseAdmin
      .from('echo_rate_limits')
      .select('request_count')
      .eq('user_id', userId)
      .eq('window_type', 'hour')
      .eq('window_start', hourStart.toISOString())
      .maybeSingle();

    if (hourData && hourData.request_count >= RATE_LIMIT_HOUR) {
      const retryAfter = 60 - now.getMinutes();
      return { allowed: false, error: "RATE_LIMIT_HOUR", retryAfter };
    }

    const { data: dayData } = await supabaseAdmin
      .from('echo_rate_limits')
      .select('request_count')
      .eq('user_id', userId)
      .eq('window_type', 'day')
      .eq('window_start', dayStart.toISOString())
      .maybeSingle();

    if (dayData && dayData.request_count >= RATE_LIMIT_DAY) {
      return { allowed: false, error: "RATE_LIMIT_DAY", retryAfter: 0 };
    }

    await Promise.all([
      supabaseAdmin.rpc('increment_rate_limit', {
        p_user_id: userId,
        p_window_type: 'minute',
        p_window_start: minuteStart.toISOString()
      }),
      supabaseAdmin.rpc('increment_rate_limit', {
        p_user_id: userId,
        p_window_type: 'hour',
        p_window_start: hourStart.toISOString()
      }),
      supabaseAdmin.rpc('increment_rate_limit', {
        p_user_id: userId,
        p_window_type: 'day',
        p_window_start: dayStart.toISOString()
      })
    ]);

    return { allowed: true };
  } catch (error) {
    console.error('[RateLimit] Database error, allowing request:', error);
    return { allowed: true };
  }
}

// ─── Response Caching ────────────────────────────────────────────────────

async function hashQuery(query: string): Promise<string> {
  const normalized = query.toLowerCase().trim().replace(/\s+/g, ' ');
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function checkCache(queryHash: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('echo_response_cache')
    .select('response_text, hit_count')
    .eq('query_hash', queryHash)
    .maybeSingle();

  if (error || !data) return null;
  
  supabaseAdmin
    .from('echo_response_cache')
    .update({ hit_count: (data.hit_count ?? 0) + 1 })
    .eq('query_hash', queryHash)
    .then(() => {});
  
  return data.response_text;
}

async function cacheResponse(queryHash: string, queryText: string, responseText: string, modelUsed: string): Promise<void> {
  try {
    await supabaseAdmin
      .from('echo_response_cache')
      .upsert({
        query_hash: queryHash,
        query_text: queryText,
        response_text: responseText,
        model_used: modelUsed,
        created_at: new Date().toISOString(),
        hit_count: 1
      }, { onConflict: 'query_hash' });
  } catch (error) {
    console.error('[Cache] Failed to cache response:', error);
  }
}

// Legacy in-memory fallback
const rateLimitsMemory = new Map<string, { minute: number[]; hour: number[]; day: number[] }>();

function checkRateLimitMemory(userId: string): { allowed: boolean; error?: string; retryAfter?: number } {
  const now = Date.now();
  const minuteAgo = now - 60 * 1000;
  const hourAgo = now - 60 * 60 * 1000;
  const dayAgo = now - 24 * 60 * 60 * 1000;

  if (!rateLimitsMemory.has(userId)) {
    rateLimitsMemory.set(userId, { minute: [], hour: [], day: [] });
  }

  const limits = rateLimitsMemory.get(userId)!;
  
  limits.minute = limits.minute.filter(t => t > minuteAgo);
  limits.hour = limits.hour.filter(t => t > hourAgo);
  limits.day = limits.day.filter(t => t > dayAgo);

  if (limits.minute.length >= RATE_LIMIT_MINUTE) {
    const oldestInMinute = Math.min(...limits.minute);
    const retryAfter = Math.ceil((oldestInMinute + 60 * 1000 - now) / 1000);
    return { allowed: false, error: "RATE_LIMIT_MINUTE", retryAfter };
  }

  if (limits.hour.length >= RATE_LIMIT_HOUR) {
    const oldestInHour = Math.min(...limits.hour);
    const retryAfter = Math.ceil((oldestInHour + 60 * 60 * 1000 - now) / 1000 / 60);
    return { allowed: false, error: "RATE_LIMIT_HOUR", retryAfter };
  }

  if (limits.day.length >= RATE_LIMIT_DAY) {
    return { allowed: false, error: "RATE_LIMIT_DAY", retryAfter: 0 };
  }

  limits.minute.push(now);
  limits.hour.push(now);
  limits.day.push(now);

  return { allowed: true };
}

// ─── Request Contracts ───────────────────────────────────────────────────

// Echo v2 contract (preferred)
interface EchoV2RequestBody {
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  conversation_id?: string | null;
  stream?: boolean;
  mode?: Mode | "chat";
  timezone?: string;
  user_context?: {
    firstName?: string | null;
    handicap?: number | null;
    homeClub?: string | null;
    location?: string | null;
  } | null;
}

// Echo v1 contract (legacy, still supported)
interface EchoV1RequestBody {
  message: string;
  conversation?: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  images?: string[];
  detailMode?: boolean;
  isEcho?: boolean;
  // deno-lint-ignore no-explicit-any
  swingContext?: any;
  mode?: Mode;
  nowIso?: string;
  timezone?: string;
}

type EchoRequestBody = EchoV1RequestBody | EchoV2RequestBody;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const sseHeaders = {
  ...corsHeaders,
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
};

function nowISO() { return new Date().toISOString(); }

// ─── Streaming Providers (Perplexity preserved for live route) ───────────

// Streaming Perplexity call
async function* streamPerplexity(query: string, nowIso: string, history: Array<{ role: string; content: string }> = []): AsyncGenerator<string> {
  const systemPrompt = [
    `You are Echo, a golf-first AI assistant with live web search. Today is ${nowIso.split("T")[0]}.`,
    "When asked about 'majors' without other context, assume golf majors (Masters, PGA Championship, US Open, The Open).",
    "Always verify facts with fresh sources for schedules, rankings, results, and player status.",
    `Include "As of ${nowIso.split("T")[0]}" for time-sensitive information.`,
    "Be concise, structured, and provide specific dates/venues when discussing events."
  ].join(" ");

  // Remove trailing user messages from history to prevent consecutive user messages
  const cleanHistory = (history ?? []).filter((_: { role: string; content: string }, i: number, arr: Array<{ role: string; content: string }>) => {
    let lastAssistantIdx = arr.length - 1;
    while (lastAssistantIdx >= 0 && arr[lastAssistantIdx].role === 'user') {
      lastAssistantIdx--;
    }
    return i <= lastAssistantIdx;
  });

  const messages = [
    { role: "system", content: systemPrompt },
    ...cleanHistory,
    { role: "user", content: query },
  ];
  
  const resp = await withTimeout(fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${PERPLEXITY_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ 
      model: PERPLEXITY_MODEL, 
      messages, 
      temperature: 0.2,
      stream: true 
    }),
  }), 30000);
  
  if (!resp.ok) throw new Error(`Perplexity error: ${await resp.text()}`);
  
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
          const cleaned = content.replace(/\[\d+\]/g, '');
          if (cleaned) yield cleaned;
        }
      } catch { /* partial chunk */ }
    }
  }
}

// Non-streaming OpenAI call (for SwingCoach and fallbacks)
async function callOpenAI(systemPrompt: string, userPrompt: string, history: Array<{ role: string; content: string }> = []) {
  const messages = [{ role: "system", content: systemPrompt }, ...(history ?? []), { role: "user", content: userPrompt }];
  const resp = await withTimeout(fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: OPENAI_MODEL, messages, temperature: 0.2 }),
  }), 20000);
  if (!resp.ok) throw new Error(`OpenAI error: ${await resp.text()}`);
  const data = await resp.json();
  return data.choices?.[0]?.message?.content?.trim() || "Sorry, no response.";
}

// Non-streaming Perplexity call (for fallbacks)
async function callPerplexity(query: string, nowIso: string, history: Array<{ role: string; content: string }> = []) {
  const systemPrompt = [
    `You are Echo, a golf-first AI assistant with live web search. Today is ${nowIso.split("T")[0]}.`,
    "When asked about 'majors' without other context, assume golf majors.",
    "Always verify facts with fresh sources.",
    `Include "As of ${nowIso.split("T")[0]}" for time-sensitive information.`,
    "Be concise, structured, and provide specific dates/venues when discussing events."
  ].join(" ");

  const cleanHistory = (history ?? []).filter((_: { role: string; content: string }, i: number, arr: Array<{ role: string; content: string }>) => {
    let lastAssistantIdx = arr.length - 1;
    while (lastAssistantIdx >= 0 && arr[lastAssistantIdx].role === 'user') {
      lastAssistantIdx--;
    }
    return i <= lastAssistantIdx;
  });

  const messages = [
    { role: "system", content: systemPrompt },
    ...cleanHistory,
    { role: "user", content: query },
  ];
  const resp = await withTimeout(fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${PERPLEXITY_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: PERPLEXITY_MODEL, messages, temperature: 0.2 }),
  }), 20000);
  if (!resp.ok) throw new Error(`Perplexity error: ${await resp.text()}`);
  const data = await resp.json();
  let content = data.choices?.[0]?.message?.content?.trim() || "";
  content = content.replace(/\[\d+\]/g, '');
  if (content && !/as of/i.test(content)) content += `\n\n_As of ${nowIso.split("T")[0]}._`;
  return content || "Sorry, no live result.";
}

async function withTimeout<T>(p: Promise<T>, ms = 15000): Promise<T> {
  const t = new Promise<never>((_, rej) => setTimeout(() => rej(new Error("Timeout")), ms));
  return Promise.race([p, t]);
}

// Extract user ID from JWT
function extractUserId(req: Request): string {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return 'anonymous';
    
    const token = authHeader.slice(7);
    const parts = token.split('.');
    if (parts.length !== 3) return 'anonymous';
    
    const payload = JSON.parse(atob(parts[1]));
    return payload.sub || 'anonymous';
  } catch {
    return 'anonymous';
  }
}

// ─── Main Handler ────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const userId = extractUserId(req);
    
    // Check rate limits
    const rateLimitResult = userId !== 'anonymous' 
      ? await checkRateLimitDB(userId)
      : checkRateLimitMemory(userId);
      
    if (!rateLimitResult.allowed) {
      const errorMessages: Record<string, string> = {
        "RATE_LIMIT_MINUTE": `Taking a breather between holes! Please wait ${rateLimitResult.retryAfter} seconds.`,
        "RATE_LIMIT_HOUR": `You've reached your hourly limit. Try again in ${rateLimitResult.retryAfter} minutes.`,
        "RATE_LIMIT_DAY": "You've reached your daily limit. Resets at midnight.",
      };
      
      return new Response(JSON.stringify({
        error: rateLimitResult.error,
        text: errorMessages[rateLimitResult.error!] || "Rate limit exceeded",
        retryAfter: rateLimitResult.retryAfter
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const body = await req.json() as EchoRequestBody;

    // Normalize input: support both v1 and v2 contracts
    let message: string | undefined;
    let conversation: Array<{ role: "user" | "assistant" | "system"; content: string }> = [];
    let conversationId: string | null = null;
    let images: string[] | undefined;
    let detailMode: boolean | undefined;
    let isEcho: boolean | undefined;
    // deno-lint-ignore no-explicit-any
    let swingContext: any;
    let mode: Mode | "chat" = "auto";
    let timezone = DEFAULT_TIMEZONE;
    let shouldStream = true;
    // deno-lint-ignore no-explicit-any
    let clientUserContext: any = null;

    // 1) New v2-style contract: messages[]
    if ('messages' in body && Array.isArray(body.messages) && body.messages.length > 0) {
      const msgs = body.messages;
      const last = msgs[msgs.length - 1];
      message = last.content;
      conversation = msgs.slice(0, -1);
      conversationId = body.conversation_id ?? null;
      mode = (body.mode as Mode | "chat") || "auto";
      timezone = body.timezone || DEFAULT_TIMEZONE;
      shouldStream = body.stream !== false;
      if ('user_context' in body) clientUserContext = body.user_context;
    }

    // 2) Legacy v1-style contract: message + conversation
    if (!message && 'message' in body && typeof body.message === 'string' && body.message.trim().length > 0) {
      message = body.message.trim();
    }

    if (conversation.length === 0 && 'conversation' in body && Array.isArray(body.conversation)) {
      conversation = body.conversation;
    }

    if ('images' in body) images = body.images;
    if ('detailMode' in body) detailMode = body.detailMode;
    if ('isEcho' in body) isEcho = body.isEcho;
    if ('swingContext' in body) swingContext = body.swingContext;
    if ('timezone' in body) timezone = body.timezone || DEFAULT_TIMEZONE;

    if (!message?.trim()) {
      return new Response(JSON.stringify({ 
        error: "Empty message",
        text: "I didn't receive a message. Please try again."
      }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const now = ('nowIso' in body && body.nowIso) ? body.nowIso : nowISO();

    // Priority 1: SwingCoach analysis (UNCHANGED - preserves existing functionality)
    if (images && images.length > 0) {
      const systemPrompt = `You are Echo, a professional golf instructor and swing coach with expertise in biomechanics and golf technique. When analyzing golf swing images/frames:

1. Always provide DETAILED, comprehensive technical analysis of what you observe in the frames
2. Break down the swing into ALL phases with specific observations: Setup/Address, Takeaway, Backswing, Top of Swing, Downswing, Impact, Follow-through
3. For EACH phase, comment on: posture, grip, alignment, swing plane, tempo, balance, and body mechanics
4. Include specific metrics and measurements when possible (angles, positions, timing)
5. Identify strengths and provide detailed areas for improvement with specific drills/tips
6. Give actionable practice recommendations and feel-based cues
7. Be encouraging while being technically comprehensive and accurate
8. Structure your response with clear headings for each swing phase
9. Include a summary with 3-5 key takeaways and practice priorities

IMPORTANT: Provide FULL, detailed phase-by-phase analysis. Do not provide condensed or quick summaries unless specifically requested.`;
      
      const messages = [
        { role: 'system', content: systemPrompt },
        ...(conversation || [])
      ];

      // deno-lint-ignore no-explicit-any
      const userMessage: any = { 
        role: 'user', 
        content: images && images.length > 0 ? [
          { type: 'text', text: message },
          ...images.map((image: string) => ({
            type: 'image_url',
            image_url: { url: image, detail: 'high' }
          }))
        ] : message
      };

      messages.push(userMessage);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: messages,
            max_tokens: 1500,
            temperature: 0.2
          }),
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const finalResponse = data.choices[0].message.content.trim();

        return new Response(JSON.stringify({ 
          text: finalResponse,
          response: finalResponse,
          metadata: { timeout: false, quick: false, timedOut: false },
          mode: 'full'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (error: unknown) {
        clearTimeout(timeoutId);
        
        const err = error as { name?: string };
        if (err.name === 'AbortError') {
          const quickAnalysis = `## Quick Swing Analysis

Based on the submitted frames, I can see:

**Setup & Address:** Good foundation position
**Backswing:** Controlled takeaway motion  
**Impact Zone:** Solid contact position
**Follow-through:** Balanced finish

*This is a condensed analysis due to processing time. For detailed breakdown, try uploading a shorter video clip or use the "Refine Details" option.*`;

          return new Response(JSON.stringify({ 
            text: quickAnalysis,
            response: quickAnalysis,
            metadata: { timeout: true, quick: true, timedOut: true },
            mode: 'quick'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        throw error;
      }
    }

    // Priority 2: Text Q&A with Echo Context Intelligence + SSE Streaming

    // 1. Classify intent and consensus level
    const { intents, consensusLevel, playerName, courseQuery, countryQuery } =
      classifyIntent(message);

    // 2. Fetch context from DB in parallel
    const { userContext, tournamentContext, courseContext, playerContext } =
      await fetchEchoContext(
        supabaseAdmin,
        userId,
        intents,
        playerName,
        courseQuery,
        countryQuery
      );

    // 3. Build enriched system prompt
    const todayDate = new Date().toISOString().split('T')[0];
    const contextBlock = buildContextBlock(
      userContext,
      tournamentContext,
      courseContext,
      playerContext
    );

    const displayName = (userContext?.display_name as string) || null;
    const firstName = displayName ? displayName.split(' ')[0] : null;
    const nameGreeting = firstName ? ` The user's name is ${firstName} — use it naturally.` : '';

    const enrichedSystemPrompt = [
      `You are Echo, a world-class personal golf caddie and advisor.${nameGreeting}`,
      `Today is ${todayDate}.`,
      `You have access to real Clbhouz platform data — course ratings, tournament predictions, and player statistics. When you reference this data, present it as your own knowledge, not as an external source.`,
      `Be conversational, specific, and practical. Speak like a knowledgeable caddie, not a search engine.`,
      `When discussing courses, reference Clbhouz community ratings where available.`,
      `When discussing tournament picks, reference the Clbhouz prediction data where available.`,
      contextBlock,
    ].join('\n');

    // Prepare conversation history (last 8 turns for context)
    const history = conversation.slice(-8);

    // 4. Set up SSE stream
    if (shouldStream) {
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();

          const send = (data: object) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          };

          const onChunk = (token: string) => send({ token });

          try {
            if (consensusLevel === 'live') {
              // Use existing Perplexity streaming for pure live queries
              for await (const chunk of streamPerplexity(message!, now, history)) {
                onChunk(chunk);
              }
            } else {
              await runConsensus(enrichedSystemPrompt, history.concat([{ role: 'user', content: message! }]), consensusLevel, onChunk);
            }

            send({ done: true, meta: { intents, consensusLevel } });
          } catch (err) {
            console.error('[Echo] Primary provider failed:', (err as Error).message);
            // Graceful degradation — fall back to single Claude call
            try {
              await streamClaude(enrichedSystemPrompt, history.concat([{ role: 'user', content: message! }]), onChunk);
              send({ done: true, meta: { intents, consensusLevel, fallback: true } });
            } catch (fallbackErr) {
              console.error('[Echo] Fallback Claude also failed:', (fallbackErr as Error).message);
              send({ error: 'Echo encountered an error. Please try again.' });
              send({ done: true, meta: { error: true } });
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });

      return new Response(stream, { headers: sseHeaders });
    }

    // Non-streaming fallback (for legacy callers)
    const CHAT_EDGE_TIMEOUT_MS = 30000;
    let answer: string;
    let provider = '';

    try {
      if (consensusLevel === 'live') {
        answer = await withTimeout(callPerplexity(message!, now, history), CHAT_EDGE_TIMEOUT_MS);
        provider = 'perplexity';
      } else {
        answer = await withTimeout(callClaudeSync(enrichedSystemPrompt, history.concat([{ role: 'user', content: message! }])), CHAT_EDGE_TIMEOUT_MS);
        provider = 'claude';
      }
    } catch (e) {
      // Fallback
      try {
        answer = await withTimeout(callOpenAI(enrichedSystemPrompt, message!, history), CHAT_EDGE_TIMEOUT_MS);
        provider = 'openai-fallback';
      } catch {
        answer = "Sorry, I'm having trouble responding right now. Please try again in a moment.";
        provider = 'error';
      }
    }

    return new Response(JSON.stringify({ 
      text: answer,
      response: answer,
      modeUsed: provider === 'perplexity' ? 'live' : 'static',
      meta: { provider, intents, consensusLevel }
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: unknown) {
    const errMsg = (err as { message?: string })?.message || String(err);
    console.error('Edge function error:', errMsg);
    return new Response(JSON.stringify({
      error: errMsg,
      text: "I'm having trouble processing your request right now. Please try again in a moment.",
      response: "I'm having trouble processing your request right now. Please try again in a moment."
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
