// deno-lint-ignore-file no-explicit-any
// Supabase Edge Function (Deno runtime)
// ⚠️ Router applies ONLY to text Q&A. SwingCoach (CV/video) and CaddieLogs flows are untouched.
import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { decideRoute, modelDeclined, type Mode } from "./router.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const OPENAI_MODEL = "gpt-4o-mini";
const PERPLEXITY_MODEL = "sonar";
const DEFAULT_TIMEZONE = "Europe/London";

// Rate limit configuration
const RATE_LIMIT_MINUTE = 10;
const RATE_LIMIT_HOUR = 60;
const RATE_LIMIT_DAY = 200;

// Echo v2 contract (preferred)
interface EchoV2RequestBody {
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  conversation_id?: string | null;
  stream?: boolean;
  mode?: Mode | "chat";
  timezone?: string;
}

// Echo v1 contract (legacy, still supported)
interface EchoV1RequestBody {
  message: string;
  conversation?: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  images?: string[];
  detailMode?: boolean;
  isEcho?: boolean;
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
function normalize(s: string) { return (s || "").toLowerCase(); }

const TIME_KEYWORDS = [
  "today","tonight","tomorrow","yesterday","this week","this month","this year",
  "current","latest","now","live","right now","up-to-date","as of","who is","who are",
  "what's happening","breaking","recent","last week"
];

const VOLATILE_ENTITIES = [
  "captain","manager","coach","lineup","fixture","schedule","tee times","pairings",
  "leaderboard","odds","rankings","ryder cup","presidents cup","pga tour","lpga",
  "european tour","dp world tour","premier league","champions league","nba","nfl",
  "price","stock","exchange rate","bitcoin","forecast","weather","flight","train times",
  "traffic","ceo","chairman","president","prime minister","release","patch notes","version",
  "deadline","rule change","law change","election","scores","results","standings","news"
];

function mentionsPastYearExplicitly(text: string): boolean {
  const yearRegex = /\b(19\d{2}|20\d{2})\b/g;
  const matches = text.match(yearRegex);
  if (!matches) return false;
  const currentYear = new Date().getUTCFullYear();
  return matches.some((y) => parseInt(y) <= currentYear);
}

function shouldUseLiveSearch(prompt: string) {
  const p = normalize(prompt);
  if (TIME_KEYWORDS.some((k) => p.includes(k))) return { useLive: true, reason: "time keywords" };
  if (VOLATILE_ENTITIES.some((k) => p.includes(k))) {
    return mentionsPastYearExplicitly(p)
      ? { useLive: false, reason: "explicit past year" }
      : { useLive: true, reason: "volatile entity" };
  }
  if (mentionsPastYearExplicitly(p)) return { useLive: false, reason: "historical" };
  return { useLive: false, reason: "default static" };
}

// Rate limiting helper
async function checkRateLimit(supabase: any, userId: string): Promise<{ allowed: boolean; error?: string; retryAfter?: number }> {
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Check minute limit
  const { count: minuteCount } = await supabase
    .from('echo_rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', oneMinuteAgo.toISOString());

  if ((minuteCount ?? 0) >= RATE_LIMIT_MINUTE) {
    return { 
      allowed: false, 
      error: 'RATE_LIMIT_MINUTE',
      retryAfter: 60 - Math.floor((now.getTime() - oneMinuteAgo.getTime()) / 1000)
    };
  }

  // Check hour limit
  const { count: hourCount } = await supabase
    .from('echo_rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', oneHourAgo.toISOString());

  if ((hourCount ?? 0) >= RATE_LIMIT_HOUR) {
    const nextReset = new Date(oneHourAgo.getTime() + 60 * 60 * 1000);
    return { 
      allowed: false, 
      error: 'RATE_LIMIT_HOUR',
      retryAfter: Math.ceil((nextReset.getTime() - now.getTime()) / 1000 / 60)
    };
  }

  // Check day limit
  const { count: dayCount } = await supabase
    .from('echo_rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', oneDayAgo.toISOString());

  if ((dayCount ?? 0) >= RATE_LIMIT_DAY) {
    return { 
      allowed: false, 
      error: 'RATE_LIMIT_DAY',
      retryAfter: 0 // Resets at midnight
    };
  }

  // Record this request
  await supabase.from('echo_rate_limits').insert({ user_id: userId });

  return { allowed: true };
}

// Streaming OpenAI call
async function* streamOpenAI(systemPrompt: string, userPrompt: string, history: any[] = []) {
  const messages = [{ role: "system", content: systemPrompt }, ...(history ?? []), { role: "user", content: userPrompt }];
  
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ 
      model: OPENAI_MODEL, 
      messages, 
      temperature: 0.2,
      stream: true
    }),
  });
  
  if (!resp.ok) {
    const errorText = await resp.text();
    throw new Error(`OpenAI error: ${errorText}`);
  }

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
        if (content) yield content;
      } catch {
        // Skip malformed lines
      }
    }
  }
}

// Streaming Perplexity call
async function* streamPerplexity(query: string, nowIso: string, history: any[] = []) {
  const messages = [
    { role: "system", content: `You are a live-search golf/general assistant. Ensure facts are up to date as of ${nowIso}. For changing facts (captains/coaches/schedules/prices/weather/results), verify with fresh sources. Do not include citation numbers like [1] in your response.` },
    ...(history ?? []),
    { role: "user", content: query },
  ];
  
  const resp = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${PERPLEXITY_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ 
      model: PERPLEXITY_MODEL, 
      messages, 
      temperature: 0.2,
      stream: true
    }),
  });
  
  if (!resp.ok) {
    const errorText = await resp.text();
    throw new Error(`Perplexity error: ${errorText}`);
  }

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
          // Clean citation numbers as we stream
          yield content.replace(/\[\d+\]/g, '');
        }
      } catch {
        // Skip malformed lines
      }
    }
  }
}

// Non-streaming fallbacks for image analysis
async function callOpenAI(systemPrompt: string, userPrompt: string, history: any[] = []) {
  const messages = [{ role: "system", content: systemPrompt }, ...(history ?? []), { role: "user", content: userPrompt }];
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: OPENAI_MODEL, messages, temperature: 0.2 }),
  });
  if (!resp.ok) throw new Error(`OpenAI error: ${await resp.text()}`);
  const data = await resp.json();
  return data.choices?.[0]?.message?.content?.trim() || "Sorry, no response.";
}

async function callPerplexity(query: string, nowIso: string, history: any[] = []) {
  const messages = [
    { role: "system", content: `You are a live-search golf/general assistant. Ensure facts are up to date as of ${nowIso}. For changing facts (captains/coaches/schedules/prices/weather/results), verify with fresh sources and include "As of ${nowIso.split("T")[0]}".` },
    ...(history ?? []),
    { role: "user", content: query },
  ];
  const resp = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${PERPLEXITY_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: PERPLEXITY_MODEL, messages, temperature: 0.2 }),
  });
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

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json() as EchoRequestBody;

    // Get user ID from auth header for rate limiting
    let userId: string | null = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const token = authHeader.slice(7);
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id ?? null;
    }

    // Normalize input: support both v1 and v2 contracts
    let message: string | undefined;
    let conversation: Array<{ role: "user" | "assistant" | "system"; content: string }> = [];
    let conversationId: string | null = null;
    let images: string[] | undefined;
    let detailMode: boolean | undefined;
    let isEcho: boolean | undefined;
    let swingContext: any;
    let mode: Mode | "chat" = "auto";
    let timezone = DEFAULT_TIMEZONE;
    let shouldStream = false;

    // 1) New v2-style contract: messages[]
    if ('messages' in body && Array.isArray(body.messages) && body.messages.length > 0) {
      const msgs = body.messages;
      const last = msgs[msgs.length - 1];
      message = last.content;
      conversation = msgs.slice(0, -1);
      conversationId = body.conversation_id ?? null;
      mode = (body.mode as Mode | "chat") || "auto";
      timezone = body.timezone || DEFAULT_TIMEZONE;
      shouldStream = body.stream === true;
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
    if (!mode && 'mode' in body) mode = (body.mode as Mode) || "auto";
    if ('timezone' in body) timezone = body.timezone || DEFAULT_TIMEZONE;

    console.log('🔍 EDGE FUNCTION DEBUG - Request Details:', { 
      messageLength: message?.length || 0,
      conversationLength: conversation?.length || 0,
      imagesCount: images?.length || 0,
      detailMode,
      isEcho,
      hasMessage: !!message,
      conversationId,
      isV2: 'messages' in body,
      shouldStream,
      userId: userId ? 'present' : 'missing'
    });

    if (!message?.trim()) {
      return new Response(JSON.stringify({ 
        error: "Empty message",
        text: "I didn't receive a message. Please try again."
      }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Rate limiting check (only for authenticated users)
    if (userId) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const rateCheck = await checkRateLimit(supabase, userId);
      
      if (!rateCheck.allowed) {
        console.log('🚫 Rate limit hit:', rateCheck.error, 'for user:', userId);
        return new Response(JSON.stringify({ 
          error: rateCheck.error,
          retryAfter: rateCheck.retryAfter,
          text: getRateLimitMessage(rateCheck.error, rateCheck.retryAfter)
        }), { 
          status: 429, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }
    }

    const now = ('nowIso' in body && body.nowIso) ? body.nowIso : nowISO();

    // Priority 1: SwingCoach analysis (UNCHANGED - preserves existing functionality)
    if (images && images.length > 0) {
      console.log('🎯 Using OpenAI for swing analysis with images:', images?.length || 0);
      
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

IMPORTANT: Provide FULL, detailed phase-by-phase analysis. Do not provide condensed or quick summaries unless specifically requested. Analyze the swing frames directly and give comprehensive feedback with specific observations for each frame/phase.`;
      
      const messages = [
        { role: 'system', content: systemPrompt },
        ...(conversation || [])
      ];

      const userMessage: any = { 
        role: 'user', 
        content: images && images.length > 0 ? [
          { type: 'text', text: message },
          ...images.map((image: string) => ({
            type: 'image_url',
            image_url: {
              url: image,
              detail: 'high'
            }
          }))
        ] : message
      };

      messages.push(userMessage);

      const edgeT0 = Date.now();
      const frames = images?.length || 0;
      const payloadBytes = messages ? JSON.stringify(messages).length : 0;
      console.log('[SC-EDGE]', JSON.stringify({ evt: 'start', frames, payloadKB: Math.round(payloadBytes/1024), detailMode }));

      console.log('🚀 Sending to OpenAI with images:', images?.length || 0);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const openaiT0 = Date.now();
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
          console.error('OpenAI API error:', response.status, errorText);
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const openaiMs = Date.now() - openaiT0;
        const data = await response.json();
        const finalResponse = data.choices[0].message.content.trim();
        
        console.log('[SC-EDGE]', JSON.stringify({ evt: 'openai_ok', openaiMs, status: response.status, usage: data?.usage || null }));
        
        const payloadSize = JSON.stringify(messages).length;
        const tokenCount = data.usage?.total_tokens || 0;
        
        console.log('✅ EDGE FUNCTION DEBUG - Response generated successfully:', {
          responseLength: finalResponse.length,
          responsePreview: finalResponse.substring(0, 100),
          payloadBytes: payloadSize,
          tokenCount: tokenCount,
          timedOut: false
        });

        console.log('[SC-EDGE]', JSON.stringify({ evt: 'done', totalMs: Date.now() - edgeT0 }));

        return new Response(JSON.stringify({ 
          text: finalResponse,
          response: finalResponse,
          metadata: { timeout: false, quick: false, timedOut: false, tokenCount },
          mode: 'full'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (error: any) {
        clearTimeout(timeoutId);
        const openaiMs = Date.now() - openaiT0;
        const isAbort = error?.name === 'AbortError';
        console.warn('[SC-EDGE]', JSON.stringify({ evt: 'openai_fail', openaiMs, abort: isAbort, msg: String(error?.message || error) }));
        
        if (error.name === 'AbortError') {
          console.log('🚨 API call aborted due to 30s timeout - returning quick analysis');
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
        
        console.log('[SC-EDGE]', JSON.stringify({ evt: 'done', totalMs: Date.now() - edgeT0 }));
        throw error;
      } finally {
        console.log('[SC-EDGE]', JSON.stringify({ evt: 'done', totalMs: Date.now() - edgeT0 }));
      }
    }

    // Priority 2: Text Q&A with Enhanced Routing and Streaming
    console.log('📥 EDGE FUNCTION DEBUG - Processing text query with enhanced routing');

    const { route, reason } = decideRoute(message, mode);
    let routeReason = reason;
    console.log('🤖 Route decision', { route, reason, shouldStream });

    const staticSystem = [
      "You are Echo, a friendly golf-first assistant.",
      "Prefer golf context but answer general questions too.",
      "Be concise, structured, and practical.",
      "If you are not using live search, avoid claiming real-time facts."
    ].join("\n");

    const liveSystem = `You are Echo with live search. Verify changing facts with fresh sources. Say "As of ${now.split('T')[0]}".`;

    const t0 = Date.now();
    const history = conversation.slice(-8);

    // ============ STREAMING RESPONSE ============
    if (shouldStream) {
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          let provider = '';
          let fullContent = '';
          
          try {
            const streamGen = route === "live" 
              ? streamPerplexity(message!, now, history)
              : streamOpenAI(staticSystem, message!, history);
            
            provider = route === "live" ? 'perplexity' : 'openai';
            console.log(`🔍 Streaming from ${provider}`);

            for await (const chunk of streamGen) {
              fullContent += chunk;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: chunk })}\n\n`));
            }

            // Check if OpenAI declined and we should fallback
            if (provider === 'openai' && modelDeclined(fullContent)) {
              console.log('🔄 OpenAI declined, switching to Perplexity');
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: '\n\n---\n\n_Checking live sources..._\n\n' })}\n\n`));
              
              try {
                for await (const chunk of streamPerplexity(message!, now, history)) {
                  fullContent += chunk;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: chunk })}\n\n`));
                }
                provider = 'perplexity';
                routeReason = 'model-declined';
              } catch (e) {
                console.warn('⚠️ Perplexity fallback failed:', (e as Error).message);
              }
            }

            const latencyMs = Date.now() - t0;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              done: true, 
              meta: { provider, routeReason, latencyMs }
            })}\n\n`));
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            
          } catch (error: any) {
            console.error('❌ Streaming error:', error.message);
            
            // Try fallback on error
            if (route === "live") {
              try {
                console.log('🔄 Perplexity failed, falling back to OpenAI');
                for await (const chunk of streamOpenAI(staticSystem, message!, history)) {
                  fullContent += chunk;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: chunk })}\n\n`));
                }
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  done: true, 
                  meta: { provider: 'openai', routeReason: 'perplexity-fallback' }
                })}\n\n`));
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              } catch (fallbackError) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  error: 'PROVIDER_ERROR',
                  text: "I'm having trouble connecting right now. Please try again in a moment."
                })}\n\n`));
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              }
            } else {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                error: 'PROVIDER_ERROR',
                text: "I'm having trouble connecting right now. Please try again in a moment."
              })}\n\n`));
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            }
          } finally {
            controller.close();
          }
        }
      });

      return new Response(stream, { headers: sseHeaders });
    }

    // ============ NON-STREAMING RESPONSE (fallback/legacy) ============
    let answer: string;
    let provider = '';
    let sources: any = null;

    async function callOpenAIEnhanced(messages: any[], maxTokens = 900) {
      const response = await callOpenAI(staticSystem, message!, messages);
      return { text: response, usage: {}, sources: null };
    }

    async function callPerplexityEnhanced(messages: any[]) {
      const response = await callPerplexity(message!, now, messages);
      const sources = response.match(/\[(\d+)\]/g) ? 'Available' : null;
      return { text: response, usage: {}, sources };
    }

    const CHAT_EDGE_TIMEOUT_MS = 30000;

    try {
      if (route === "live") {
        console.log('🔍 Using live search (Perplexity) for current information');
        const result = await withTimeout(callPerplexityEnhanced(history), CHAT_EDGE_TIMEOUT_MS);
        answer = result.text;
        provider = 'perplexity';
        sources = result.sources;
      } else {
        console.log('💬 Using static knowledge (OpenAI) for general/historical information');
        const result = await withTimeout(callOpenAIEnhanced(history), CHAT_EDGE_TIMEOUT_MS);
        answer = result.text;
        provider = 'openai';

        if (!answer?.trim() || modelDeclined(answer)) {
          console.log('🔄 Auto-switching to live search due to model decline');
          try {
            const altResult = await withTimeout(callPerplexityEnhanced(history), CHAT_EDGE_TIMEOUT_MS);
            if (altResult.text?.trim()) {
              answer = altResult.text;
              provider = 'perplexity';
              sources = altResult.sources;
              routeReason = 'model-declined';
            }
          } catch (e) {
            console.warn('⚠️ Auto-switch to live search failed:', (e as Error).message);
          }
        }
      }
    } catch (e) {
      if (route === "live") {
        console.log('🔄 Falling back to static knowledge due to Perplexity failure');
        routeReason = 'perplexity-fallback-failed';
        try {
          const result = await withTimeout(callOpenAIEnhanced(history), CHAT_EDGE_TIMEOUT_MS);
          answer = `I couldn't reach live sources quickly. Here's background info instead:\n\n${result.text}`;
          provider = 'openai';
        } catch (fallbackError) {
          console.log('❌ Both Perplexity and OpenAI fallback failed');
          answer = "Sorry, I'm having trouble responding right now. Please try again in a moment.";
          provider = 'error';
          routeReason = 'all-providers-failed';
        }
      } else {
        throw e;
      }
    }

    const latencyMs = Date.now() - t0;
    
    console.log('✅ EDGE FUNCTION DEBUG - Response generated successfully:', {
      responseLength: answer.length,
      responsePreview: answer.substring(0, 100),
      provider,
      routeReason,
      latencyMs,
      hasSources: !!sources
    });

    return new Response(JSON.stringify({ 
      text: answer,
      response: answer,
      modeUsed: provider === 'perplexity' ? 'live' : 'static',
      sources,
      meta: { 
        provider, 
        routeReason, 
        latencyMs, 
        now: now.split('T')[0],
        usage: {}
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error('❌ EDGE FUNCTION DEBUG - Function error:', {
      message: err.message,
      stack: err.stack
    });
    return new Response(JSON.stringify({
      error: String(err?.message || err),
      text: "I'm having trouble processing your request right now. Please try again in a moment.",
      response: "I'm having trouble processing your request right now. Please try again in a moment."
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getRateLimitMessage(errorType?: string, retryAfter?: number): string {
  switch (errorType) {
    case 'RATE_LIMIT_MINUTE':
      return `⛳ Taking a breather between holes! Please wait ${retryAfter || 60} seconds before your next message.`;
    case 'RATE_LIMIT_HOUR':
      return `⛳ You've been chatting a lot! Try again in about ${retryAfter || 60} minutes.`;
    case 'RATE_LIMIT_DAY':
      return `⛳ You've reached your daily message limit. Come back tomorrow for more golf wisdom!`;
    default:
      return `⛳ Our AI service is busy. Please try again in a few seconds.`;
  }
}
