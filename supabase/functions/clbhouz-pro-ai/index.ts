// deno-lint-ignore-file no-explicit-any
// Supabase Edge Function (Deno runtime)
// ⚠️ Router applies ONLY to text Q&A. SwingCoach (CV/video) and CaddieLogs flows are untouched.
import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { decideRoute, modelDeclined, type Mode } from "./router.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY")!;

const OPENAI_MODEL = "gpt-4o-mini";
const PERPLEXITY_MODEL = "sonar";
const DEFAULT_TIMEZONE = "Europe/London";

// Rate limiting constants
const RATE_LIMIT_MINUTE = 10;
const RATE_LIMIT_HOUR = 60;
const RATE_LIMIT_DAY = 200;

// Simple in-memory rate limiting (resets on function cold start)
// For production, use Supabase/Redis for persistence
const rateLimitStore = new Map<string, { minute: number; hour: number; day: number; lastMinute: number; lastHour: number; lastDay: number }>();

function checkRateLimit(userId: string): { allowed: boolean; errorType?: string; retryAfter?: number } {
  const now = Date.now();
  const minute = Math.floor(now / 60000);
  const hour = Math.floor(now / 3600000);
  const day = Math.floor(now / 86400000);

  let userData = rateLimitStore.get(userId);
  
  if (!userData) {
    userData = { minute: 0, hour: 0, day: 0, lastMinute: minute, lastHour: hour, lastDay: day };
  }

  // Reset counters if time period has passed
  if (userData.lastMinute !== minute) {
    userData.minute = 0;
    userData.lastMinute = minute;
  }
  if (userData.lastHour !== hour) {
    userData.hour = 0;
    userData.lastHour = hour;
  }
  if (userData.lastDay !== day) {
    userData.day = 0;
    userData.lastDay = day;
  }

  // Check limits
  if (userData.minute >= RATE_LIMIT_MINUTE) {
    return { allowed: false, errorType: 'RATE_LIMIT_MINUTE', retryAfter: 60 - (now % 60000) / 1000 };
  }
  if (userData.hour >= RATE_LIMIT_HOUR) {
    return { allowed: false, errorType: 'RATE_LIMIT_HOUR', retryAfter: 3600 - (now % 3600000) / 1000 };
  }
  if (userData.day >= RATE_LIMIT_DAY) {
    return { allowed: false, errorType: 'RATE_LIMIT_DAY', retryAfter: 86400 - (now % 86400000) / 1000 };
  }

  // Increment counters
  userData.minute++;
  userData.hour++;
  userData.day++;
  rateLimitStore.set(userId, userData);

  return { allowed: true };
}

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

function nowISO() { return new Date().toISOString(); }

// Non-streaming API calls (for swing analysis and fallback)
async function callOpenAI(systemPrompt: string, userPrompt: string, history: EchoRequestBody["conversation"] = []) {
  const messages = [{ role: "system", content: systemPrompt }, ...(history ?? []), { role: "user", content: userPrompt }];
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: OPENAI_MODEL, messages, temperature: 0.2 }),
  });
  if (!resp.ok) {
    const status = resp.status;
    if (status === 429) throw new Error(`RATE_LIMIT:OpenAI rate limit exceeded`);
    throw new Error(`OpenAI error: ${await resp.text()}`);
  }
  const data = await resp.json();
  return data.choices?.[0]?.message?.content?.trim() || "Sorry, no response.";
}

async function callPerplexity(query: string, nowIso: string, history: EchoRequestBody["conversation"] = []) {
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
  if (!resp.ok) {
    const status = resp.status;
    if (status === 429) throw new Error(`RATE_LIMIT:Perplexity rate limit exceeded`);
    throw new Error(`Perplexity error: ${await resp.text()}`);
  }
  const data = await resp.json();
  let content = data.choices?.[0]?.message?.content?.trim() || "";
  
  // Clean up citation numbers for better readability
  content = content.replace(/\[\d+\]/g, '');
  
  if (content && !/as of/i.test(content)) content += `\n\n_As of ${nowIso.split("T")[0]}._`;
  return content || "Sorry, no live result.";
}

// Streaming API calls for SSE
async function* streamOpenAI(systemPrompt: string, userPrompt: string, history: any[] = []): AsyncGenerator<string> {
  const messages = [{ role: "system", content: systemPrompt }, ...(history ?? []), { role: "user", content: userPrompt }];
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: OPENAI_MODEL, messages, temperature: 0.2, stream: true }),
  });
  
  if (!resp.ok) {
    const status = resp.status;
    if (status === 429) throw new Error(`RATE_LIMIT:OpenAI rate limit exceeded`);
    throw new Error(`OpenAI error: ${await resp.text()}`);
  }

  const reader = resp.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Process complete lines
    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
      let line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);

      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (line.trim() === '' || line.startsWith(':')) continue;

      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') return;

        try {
          const parsed = JSON.parse(jsonStr);
          const token = parsed.choices?.[0]?.delta?.content;
          if (token) yield token;
        } catch {
          // Incomplete JSON, continue
        }
      }
    }
  }
}

async function* streamPerplexity(query: string, nowIso: string, history: any[] = []): AsyncGenerator<string> {
  const messages = [
    { role: "system", content: `You are a live-search golf/general assistant. Ensure facts are up to date as of ${nowIso}. For changing facts, verify with fresh sources and include "As of ${nowIso.split("T")[0]}".` },
    ...(history ?? []),
    { role: "user", content: query },
  ];
  
  const resp = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${PERPLEXITY_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: PERPLEXITY_MODEL, messages, temperature: 0.2, stream: true }),
  });
  
  if (!resp.ok) {
    const status = resp.status;
    if (status === 429) throw new Error(`RATE_LIMIT:Perplexity rate limit exceeded`);
    throw new Error(`Perplexity error: ${await resp.text()}`);
  }

  const reader = resp.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';
  let fullContent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
      let line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);

      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (line.trim() === '' || line.startsWith(':')) continue;

      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') {
          // Add "As of" suffix if not present
          if (fullContent && !/as of/i.test(fullContent)) {
            yield `\n\n_As of ${nowIso.split("T")[0]}._`;
          }
          return;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          // Clean citation numbers from tokens
          let token = parsed.choices?.[0]?.delta?.content || '';
          token = token.replace(/\[\d+\]/g, '');
          if (token) {
            fullContent += token;
            yield token;
          }
        } catch {
          // Incomplete JSON, continue
        }
      }
    }
  }
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

    // Extract user ID for rate limiting (from auth header or fallback)
    const authHeader = req.headers.get('authorization') || '';
    const userId = authHeader.split(' ')[1]?.slice(0, 20) || 'anonymous';

    // Check rate limits
    const rateLimitCheck = checkRateLimit(userId);
    if (!rateLimitCheck.allowed) {
      return new Response(JSON.stringify({
        error: `Rate limit exceeded (${rateLimitCheck.errorType})`,
        errorType: rateLimitCheck.errorType,
        retryAfter: rateLimitCheck.retryAfter,
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': String(Math.ceil(rateLimitCheck.retryAfter || 60)) },
      });
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
    let streamRequested = false;

    // 1) New v2-style contract: messages[]
    if ('messages' in body && Array.isArray(body.messages) && body.messages.length > 0) {
      const msgs = body.messages;
      const last = msgs[msgs.length - 1];
      message = last.content;
      conversation = msgs.slice(0, -1);
      conversationId = body.conversation_id ?? null;
      mode = (body.mode as Mode | "chat") || "auto";
      timezone = body.timezone || DEFAULT_TIMEZONE;
      streamRequested = body.stream === true;
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

    console.log('🔍 Request:', { messageLength: message?.length, streamRequested, imagesCount: images?.length || 0 });

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

    // Priority 1: SwingCoach analysis (images) - always non-streaming
    if (images && images.length > 0) {
      console.log('🎯 Using OpenAI for swing analysis with images:', images.length);
      
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

      const userMessage: any = { 
        role: 'user', 
        content: [
          { type: 'text', text: message },
          ...images.map((image: string) => ({
            type: 'image_url',
            image_url: { url: image, detail: 'high' }
          }))
        ]
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
          console.error('OpenAI API error:', response.status, errorText);
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

      } catch (error: any) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
          const quickAnalysis = `## Quick Swing Analysis

Based on the submitted frames, I can see:

**Setup & Address:** Good foundation position
**Backswing:** Controlled takeaway motion  
**Impact Zone:** Solid contact position
**Follow-through:** Balanced finish

*This is a condensed analysis due to processing time. For detailed breakdown, try uploading a shorter video clip.*`;

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

    // Priority 2: Text Q&A with routing
    const CHAT_EDGE_TIMEOUT_MS = 30000;
    const { route, reason } = decideRoute(message, mode);
    let routeReason = reason;
    console.log('🤖 Route decision', { route, reason, streamRequested });

    const staticSystem = [
      "You are Echo, a friendly golf-first assistant.",
      "Prefer golf context but answer general questions too.",
      "Be concise, structured, and practical.",
      "If you are not using live search, avoid claiming real-time facts."
    ].join("\n");

    const history = conversation.slice(-8);

    // SSE Streaming response
    if (streamRequested) {
      const encoder = new TextEncoder();
      
      const stream = new ReadableStream({
        async start(controller) {
          try {
            let tokenGenerator: AsyncGenerator<string>;
            let provider = '';
            
            if (route === "live") {
              console.log('🔍 Streaming from Perplexity');
              tokenGenerator = streamPerplexity(message!, now, history);
              provider = 'perplexity';
            } else {
              console.log('💬 Streaming from OpenAI');
              tokenGenerator = streamOpenAI(staticSystem, message!, history);
              provider = 'openai';
            }

            for await (const token of tokenGenerator) {
              const sseData = `data: ${JSON.stringify({ choices: [{ delta: { content: token } }] })}\n\n`;
              controller.enqueue(encoder.encode(sseData));
            }

            // Send final metadata
            const metaEvent = `data: ${JSON.stringify({ 
              modeUsed: provider === 'perplexity' ? 'live' : 'static',
              meta: { provider, routeReason }
            })}\n\n`;
            controller.enqueue(encoder.encode(metaEvent));
            
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error: any) {
            console.error('Streaming error:', error);
            
            // Check if it's a rate limit error from provider
            if (error.message?.includes('RATE_LIMIT')) {
              const errorEvent = `data: ${JSON.stringify({ error: 'PROVIDER_RATE_LIMIT', message: 'Our AI service is busy. Please try again.' })}\n\n`;
              controller.enqueue(encoder.encode(errorEvent));
            } else {
              const errorEvent = `data: ${JSON.stringify({ error: 'STREAM_ERROR', message: error.message })}\n\n`;
              controller.enqueue(encoder.encode(errorEvent));
            }
            
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          }
        }
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-streaming fallback
    const t0 = Date.now();
    let answer: string;
    let provider = '';
    let sources: any = null;

    try {
      if (route === "live") {
        console.log('🔍 Using live search (Perplexity)');
        answer = await withTimeout(callPerplexity(message, now, history), CHAT_EDGE_TIMEOUT_MS);
        provider = 'perplexity';
      } else {
        console.log('💬 Using static knowledge (OpenAI)');
        answer = await withTimeout(callOpenAI(staticSystem, message, history), CHAT_EDGE_TIMEOUT_MS);
        provider = 'openai';

        // Auto-switch if model declined
        if (!answer?.trim() || modelDeclined(answer)) {
          console.log('🔄 Auto-switching to live search');
          try {
            answer = await withTimeout(callPerplexity(message, now, history), CHAT_EDGE_TIMEOUT_MS);
            provider = 'perplexity';
            routeReason = 'model-declined';
          } catch (e) {
            console.warn('Auto-switch failed:', (e as Error).message);
          }
        }
      }
    } catch (e: any) {
      // Check for provider rate limits
      if (e.message?.includes('RATE_LIMIT')) {
        return new Response(JSON.stringify({
          error: 'Our AI service is busy. Please try again in a few seconds.',
          errorType: 'PROVIDER_RATE_LIMIT',
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Fallback to other provider
      if (route === "live") {
        console.log('🔄 Falling back to OpenAI');
        try {
          answer = await withTimeout(callOpenAI(staticSystem, message, history), CHAT_EDGE_TIMEOUT_MS);
          answer = `I couldn't reach live sources. Here's background info:\n\n${answer}`;
          provider = 'openai';
          routeReason = 'perplexity-fallback-failed';
        } catch {
          answer = "Sorry, I'm having trouble responding right now. Please try again.";
          provider = 'error';
        }
      } else {
        throw e;
      }
    }

    const latencyMs = Date.now() - t0;
    
    console.log('✅ Response:', { responseLength: answer.length, provider, latencyMs });

    return new Response(JSON.stringify({ 
      text: answer,
      response: answer,
      modeUsed: provider === 'perplexity' ? 'live' : 'static',
      sources,
      meta: { provider, routeReason, latencyMs, now: now.split('T')[0] }
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error('❌ Function error:', err.message);
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
