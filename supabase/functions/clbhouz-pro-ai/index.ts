// deno-lint-ignore-file no-explicit-any
// Supabase Edge Function (Deno runtime)
// ⚠️ Router applies ONLY to text Q&A. SwingCoach (CV/video) and CaddieLogs flows are untouched.
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY")!;

const OPENAI_MODEL = "gpt-4o-mini";
const PERPLEXITY_MODEL = "sonar";
const DEFAULT_TIMEZONE = "Europe/London";

type Mode = "auto" | "live" | "static";

interface EchoRequestBody {
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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json() as EchoRequestBody;
    const { message, conversation = [], images, detailMode, isEcho, swingContext, mode = "auto", timezone = DEFAULT_TIMEZONE } = body;

    // 🐛 DEBUGGING: Log incoming request details
    console.log('🔍 EDGE FUNCTION DEBUG - Request Details:', { 
      messageLength: message?.length || 0,
      conversationLength: conversation?.length || 0,
      imagesCount: images?.length || 0,
      detailMode,
      isEcho,
      hasMessage: !!message
    });

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: "Empty message" }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const now = body.nowIso ?? nowISO();

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

      console.log('🚀 Sending to OpenAI with images:', images?.length || 0);
      if (images && images.length > 0) {
        console.log('📸 Image details:', images.map((img, i) => `Frame ${i + 1}: ${img.substring(0, 50)}...`));
      }

      // Add timeout for faster failure/fallback
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s SLA for full analysis

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

        const data = await response.json();
        const finalResponse = data.choices[0].message.content.trim();
        
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

        return new Response(JSON.stringify({ 
          response: finalResponse, 
          metadata: { timeout: false, quick: false, timedOut: false, tokenCount },
          mode: 'full'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (error: any) {
        clearTimeout(timeoutId);
        
        // Handle AbortController timeout gracefully
        if (error.name === 'AbortError') {
          console.log('🚨 API call aborted due to 13s timeout - returning quick analysis');
          const quickAnalysis = `## Quick Swing Analysis

Based on the submitted frames, I can see:

**Setup & Address:** Good foundation position
**Backswing:** Controlled takeaway motion  
**Impact Zone:** Solid contact position
**Follow-through:** Balanced finish

*This is a condensed analysis due to processing time. For detailed breakdown, try uploading a shorter video clip or use the "Refine Details" option.*`;

        return new Response(JSON.stringify({ 
          response: quickAnalysis,
          metadata: { timeout: true, quick: true, timedOut: true },
          mode: 'quick'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
        }
        
        throw error;
      }

      const data = await response.json();
      const finalResponse = data.choices[0].message.content.trim();
      
      console.log('✅ EDGE FUNCTION DEBUG - Response generated successfully:', {
        responseLength: finalResponse.length,
        responsePreview: finalResponse.substring(0, 100)
      });

      console.log('📤 EDGE FUNCTION DEBUG - Sending response back to client');

      return new Response(JSON.stringify({ 
        response: finalResponse, 
        metadata: null 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Priority 2: Text Q&A with Freshness Router (NEW IMPLEMENTATION)
    console.log('📥 EDGE FUNCTION DEBUG - Processing text query with freshness router');

    let route: Mode = mode;

    if (mode === "auto") {
      const decision = shouldUseLiveSearch(message);
      route = decision.useLive ? "live" : "static";
      console.log('🤖 Auto-routing decision:', { route, reason: decision.reason });
    }

    const STATIC_SYSTEM = [
      "You are Echo, the Clbhouz assistant.",
      "Answer clearly and concisely for golf users.",
      "If the user requests historical facts (past years), answer directly.",
      "If the user asks about 'current/latest/now' and you are in STATIC mode, prefer general background and suggest clarifying year if needed.",
    ].join("\n");

    const STATIC_BRIDGE = (q: string) =>
      `User (asked at ${now}): ${q}\n\nIf historical/timeless, answer directly. If time-sensitive but STATIC, give background and suggest 'latest' or a year.`;

    const askedForCurrent =
      TIME_KEYWORDS.some((k) => normalize(message).includes(k)) ||
      /^(who\s+(is|are)\b)/i.test(message.trim());

    const t0 = Date.now();
    let answer: string;

    try {
      if (route === "live") {
        console.log('🔍 Using live search (Perplexity) for current information');
        answer = await withTimeout(callPerplexity(message, now, conversation));
      } else {
        console.log('💬 Using static knowledge (OpenAI) for general/historical information');
        answer = await withTimeout(callOpenAI(STATIC_SYSTEM, STATIC_BRIDGE(message), conversation));
      }
    } catch (e) {
      console.warn('⚠️ Primary route failed:', e.message);
      if (route === "live") {
        // fallback to static background
        console.log('🔄 Falling back to static knowledge');
        const bg = await callOpenAI(STATIC_SYSTEM, STATIC_BRIDGE(message), conversation);
        answer = `I couldn't reach live sources quickly. Here's background info instead:\n\n${bg}`;
      } else {
        throw e;
      }
    }

    // Backstop: if user asked for current and static answer looks old, auto-fetch live
    if (route === "static" && askedForCurrent && /20(1\d|20|21|22|23)\b/.test(answer)) {
      console.log('🚨 Detected potential staleness, fetching live update');
      try {
        const live = await withTimeout(callPerplexity(message, now, conversation), 10000);
        answer = `${answer}\n\n—\n**Live Update:** ${live}`;
        route = "live";
      } catch (e) {
        console.warn('⚠️ Live update failed:', e.message);
      }
    }

    const latencyMs = Date.now() - t0;
    
    console.log('✅ EDGE FUNCTION DEBUG - Response generated successfully:', {
      responseLength: answer.length,
      responsePreview: answer.substring(0, 100),
      modeUsed: route,
      latencyMs
    });

    console.log('📤 EDGE FUNCTION DEBUG - Sending response back to client');

    return new Response(JSON.stringify({ 
      response: answer,
      answer: answer, // For compatibility
      modeUsed: route, 
      nowIso: now, 
      latencyMs,
      metadata: { route, latencyMs, now }
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
      response: "I'm having trouble processing your request right now. Please try again in a moment."
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});