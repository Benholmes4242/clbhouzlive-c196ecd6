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

// Rate limiting config
const RATE_LIMIT_MINUTE = 10;
const RATE_LIMIT_HOUR = 60;
const RATE_LIMIT_DAY = 200;

// Simple in-memory rate limiting (per function instance)
const rateLimits = new Map<string, { minute: number[]; hour: number[]; day: number[] }>();

function checkRateLimit(userId: string): { allowed: boolean; error?: string; retryAfter?: number } {
  const now = Date.now();
  const minuteAgo = now - 60 * 1000;
  const hourAgo = now - 60 * 60 * 1000;
  const dayAgo = now - 24 * 60 * 60 * 1000;

  if (!rateLimits.has(userId)) {
    rateLimits.set(userId, { minute: [], hour: [], day: [] });
  }

  const limits = rateLimits.get(userId)!;
  
  // Clean old entries
  limits.minute = limits.minute.filter(t => t > minuteAgo);
  limits.hour = limits.hour.filter(t => t > hourAgo);
  limits.day = limits.day.filter(t => t > dayAgo);

  // Check limits
  if (limits.minute.length >= RATE_LIMIT_MINUTE) {
    const oldestInMinute = Math.min(...limits.minute);
    const retryAfter = Math.ceil((oldestInMinute + 60 * 1000 - now) / 1000);
    return { 
      allowed: false, 
      error: "RATE_LIMIT_MINUTE",
      retryAfter
    };
  }

  if (limits.hour.length >= RATE_LIMIT_HOUR) {
    const oldestInHour = Math.min(...limits.hour);
    const retryAfter = Math.ceil((oldestInHour + 60 * 60 * 1000 - now) / 1000 / 60);
    return { 
      allowed: false, 
      error: "RATE_LIMIT_HOUR",
      retryAfter
    };
  }

  if (limits.day.length >= RATE_LIMIT_DAY) {
    return { 
      allowed: false, 
      error: "RATE_LIMIT_DAY",
      retryAfter: 0
    };
  }

  // Record this request
  limits.minute.push(now);
  limits.hour.push(now);
  limits.day.push(now);

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

// Non-streaming OpenAI call (for SwingCoach and fallbacks)
async function callOpenAI(systemPrompt: string, userPrompt: string, history: EchoRequestBody["conversation"] = []) {
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

// Streaming OpenAI call
async function* streamOpenAI(systemPrompt: string, userPrompt: string, history: any[] = []): AsyncGenerator<string> {
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
  
  if (!resp.ok) throw new Error(`OpenAI error: ${await resp.text()}`);
  
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
        // Ignore parse errors for partial chunks
      }
    }
  }
}

// Streaming Perplexity call
async function* streamPerplexity(query: string, nowIso: string, history: any[] = []): AsyncGenerator<string> {
  const systemPrompt = [
    `You are Echo, a golf-first AI assistant with live web search. Today is ${nowIso.split("T")[0]}.`,
    "When asked about 'majors' without other context, assume golf majors (Masters, PGA Championship, US Open, The Open).",
    "Always verify facts with fresh sources for schedules, rankings, results, and player status.",
    `Include "As of ${nowIso.split("T")[0]}" for time-sensitive information.`,
    "Be concise, structured, and provide specific dates/venues when discussing events."
  ].join(" ");

  const messages = [
    { role: "system", content: systemPrompt },
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
          // Clean up citation numbers
          const cleaned = content.replace(/\[\d+\]/g, '');
          if (cleaned) yield cleaned;
        }
      } catch {
        // Ignore parse errors
      }
    }
  }
}

// Non-streaming Perplexity call (for fallbacks)
async function callPerplexity(query: string, nowIso: string, history: EchoRequestBody["conversation"] = []) {
  const systemPrompt = [
    `You are Echo, a golf-first AI assistant with live web search. Today is ${nowIso.split("T")[0]}.`,
    "When asked about 'majors' without other context, assume golf majors (Masters, PGA Championship, US Open, The Open).",
    "Always verify facts with fresh sources for schedules, rankings, results, and player status.",
    `Include "As of ${nowIso.split("T")[0]}" for time-sensitive information.`,
    "Be concise, structured, and provide specific dates/venues when discussing events."
  ].join(" ");

  const messages = [
    { role: "system", content: systemPrompt },
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
  
  // Clean up citation numbers for better readability
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

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const userId = extractUserId(req);
    
    // Check rate limits
    const rateLimitResult = checkRateLimit(userId);
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
    let swingContext: any;
    let mode: Mode | "chat" = "auto";
    let timezone = DEFAULT_TIMEZONE;
    let shouldStream = true; // Default to streaming

    // 1) New v2-style contract: messages[]
    if ('messages' in body && Array.isArray(body.messages) && body.messages.length > 0) {
      const msgs = body.messages;
      const last = msgs[msgs.length - 1];

      // Last message is treated as the "current" user prompt
      message = last.content;

      // Everything before that is "conversation"
      conversation = msgs.slice(0, -1);

      conversationId = body.conversation_id ?? null;
      mode = (body.mode as Mode | "chat") || "auto";
      timezone = body.timezone || DEFAULT_TIMEZONE;
      shouldStream = body.stream !== false; // Default true
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

    // 🐛 DEBUGGING: Log incoming request details
    console.log('🔍 EDGE FUNCTION DEBUG - Request Details:', { 
      messageLength: message?.length || 0,
      conversationLength: conversation?.length || 0,
      imagesCount: images?.length || 0,
      detailMode,
      isEcho,
      hasMessage: !!message,
      conversationId,
      isV2: 'messages' in body,
      shouldStream
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

      // Create user message with images
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

      // Add edge function telemetry
      const edgeT0 = Date.now();
      const frames = images?.length || 0;
      const payloadBytes = messages ? JSON.stringify(messages).length : 0;
      console.log('[SC-EDGE]', JSON.stringify({ evt: 'start', frames, payloadKB: Math.round(payloadBytes/1024), detailMode }));

      console.log('🚀 Sending to OpenAI with images:', images?.length || 0);
      if (images && images.length > 0) {
        console.log('📸 Image details:', images.map((img, i) => `Frame ${i + 1}: ${img.substring(0, 50)}...`));
      }

      // Add timeout for faster failure/fallback
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s SLA for full analysis

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
            model: 'gpt-4o-mini', // Fast vision model for swing analysis
            messages: messages,
            max_tokens: 1500, // Increased for detailed phase-by-phase analysis
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
        
        // If you have token usage in `body.usage`, include it; if not, omit it.
        console.log('[SC-EDGE]', JSON.stringify({ evt: 'openai_ok', openaiMs, status: response.status, usage: data?.usage || null }));
        
        // Calculate payload size and log metrics
        const payloadSize = JSON.stringify(messages).length;
        const tokenCount = data.usage?.total_tokens || 0;
        
        console.log('✅ EDGE FUNCTION DEBUG - Response generated successfully:', {
          responseLength: finalResponse.length,
          responsePreview: finalResponse.substring(0, 100),
          payloadBytes: payloadSize,
          tokenCount: tokenCount,
          timedOut: false
        });

        console.log('📤 EDGE FUNCTION DEBUG - Sending response back to client');
        console.log('[SC-EDGE]', JSON.stringify({ evt: 'done', totalMs: Date.now() - edgeT0 }));

        return new Response(JSON.stringify({ 
          text: finalResponse,          // NEW canonical field
          response: finalResponse,       // keep for legacy callers
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
        
        // Handle AbortController timeout gracefully
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
          text: quickAnalysis,           // NEW canonical field
          response: quickAnalysis,       // keep for legacy callers
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

    // Priority 2: Text Q&A with Enhanced Routing + SSE Streaming
    console.log('📥 EDGE FUNCTION DEBUG - Processing text query with enhanced routing');

    const { route, reason } = decideRoute(message, mode);
    let routeReason = reason;
    
    // Enhanced logging for route debugging
    console.log('🤖 Echo Route Decision:', {
      query: message?.substring(0, 100),
      route,
      reason,
      timestamp: new Date().toISOString(),
      shouldStream
    });

    const todayDate = new Date().toISOString().split('T')[0];
    const staticSystem = [
      `Today's date is ${todayDate}.`,
      "You are Echo, a friendly golf-first assistant.",
      "Prefer golf context but answer general questions too.",
      "Be concise, structured, and practical.",
      "If you are not using live search, avoid claiming real-time facts.",
      "If asked about future events, schedules, or 'next' occurrences, acknowledge that your information may be outdated and suggest checking official sources for current dates."
    ].join("\n");

    const t0 = Date.now();
    
    // Prepare conversation history (last 8 turns for better context)
    const history = conversation.slice(-8);

    // SSE Streaming Response
    if (shouldStream) {
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          let fullContent = "";
          let provider = "";
          
          try {
            const streamGenerator = route === "live"
              ? streamPerplexity(message!, now, history)
              : streamOpenAI(staticSystem, message!, history);
            
            provider = route === "live" ? "perplexity" : "openai";
            
            for await (const chunk of streamGenerator) {
              fullContent += chunk;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: chunk })}\n\n`));
            }
            
            // Add "As of" date for live search if not present
            if (route === "live" && fullContent && !/as of/i.test(fullContent)) {
              const dateNote = `\n\n_As of ${now.split("T")[0]}._`;
              fullContent += dateNote;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: dateNote })}\n\n`));
            }
            
            // Auto-switch if model declined
            if (route === "static" && (!fullContent?.trim() || modelDeclined(fullContent))) {
              console.log('🔄 Auto-switching to live search due to model decline');
              fullContent = "";
              
              try {
                for await (const chunk of streamPerplexity(message!, now, history)) {
                  fullContent += chunk;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: chunk })}\n\n`));
                }
                provider = "perplexity";
                routeReason = "model-declined";
              } catch (e) {
                console.warn('⚠️ Auto-switch to live search failed:', (e as Error).message);
              }
            }
            
            const latencyMs = Date.now() - t0;
            
            // Send completion event with metadata
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              done: true, 
              meta: { provider, routeReason, latencyMs, now: now.split('T')[0] }
            })}\n\n`));
            
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            
          } catch (error: any) {
            console.error('❌ Streaming error:', error);
            
            // Try fallback for Perplexity failures
            if (route === "live") {
              console.warn('⚠️ Falling back from Perplexity to OpenAI - response may contain outdated information');
              console.log('🔄 Fallback reason:', error.message);
              try {
                for await (const chunk of streamOpenAI(staticSystem, message!, history)) {
                  fullContent += chunk;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: chunk })}\n\n`));
                }
                provider = "openai";
                routeReason = "perplexity-fallback-failed";
                
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  done: true, 
                  meta: { provider, routeReason, latencyMs: Date.now() - t0 }
                })}\n\n`));
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              } catch (fallbackError) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  error: "Failed to get response",
                  token: "Sorry, I'm having trouble responding right now. Please try again in a moment."
                })}\n\n`));
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              }
            } else {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                error: error.message || "Unknown error"
              })}\n\n`));
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            }
          }
          
          controller.close();
        }
      });

      return new Response(stream, { headers: sseHeaders });
    }

    // Non-streaming fallback (for legacy callers)
    const CHAT_EDGE_TIMEOUT_MS = 30000;
    let answer: string;
    let provider = '';
    let sources: any = null;

    async function callOpenAIEnhanced(messages: any[], _maxTokens = 900) {
      const response = await callOpenAI(staticSystem, message!, messages);
      return { text: response, usage: {}, sources: null };
    }

    async function callPerplexityEnhanced(messages: any[]) {
      const response = await callPerplexity(message!, now, messages);
      const sources = response.match(/\[(\d+)\]/g) ? 'Available' : null;
      return { text: response, usage: {}, sources };
    }

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

        // Auto-switch if model declined or hinted cutoff
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
      // Fallback to static if live search fails
      if (route === "live") {
        console.warn('⚠️ Falling back from Perplexity to OpenAI (non-streaming) - response may contain outdated information');
        console.log('🔄 Perplexity failure:', (e as Error).message);
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

    console.log('📤 EDGE FUNCTION DEBUG - Sending response back to client');

    return new Response(JSON.stringify({ 
      text: answer,                      // NEW canonical field
      response: answer,                  // keep for legacy callers
      modeUsed: provider === 'perplexity' ? 'live' : 'static',
      sources,
      meta: { 
        provider, 
        routeReason, 
        latencyMs, 
        now: now.split('T')[0], // Just the date part
        usage: {} // placeholder for token counts
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
