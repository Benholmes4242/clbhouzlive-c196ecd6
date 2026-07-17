// echo-engine-health — Admin-only daily/on-demand probe of all four Echo
// engines. Persists one row per engine per run to public.echo_engine_health.
// Never throws overall — always records all four results.
//
// Auth:
//   - Service-role callers (cron) allowed.
//   - User JWT callers must be admins (public.admin_memberships).
//
// ASCII only.

import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  ANTHROPIC_MODEL_SYNTH,
  OPENAI_MODEL_SYNTH,
  GEMINI_MODEL,
  PERPLEXITY_MODEL,
  BUILD,
} from "../_shared/echo-models.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY") ?? "";

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-secret",
};


const PROBE_TIMEOUT_MS = 30_000;
const PROBE_PROMPT = "Reply with exactly: OK";
const PERPLEXITY_PROBE_PROMPT = "In one word, who won the 2025 Open Championship?";
const PERPLEXITY_EXPECT = "scheffler";

type EngineName = "claude" | "openai" | "gemini" | "perplexity";

interface ProbeResult {
  engine: EngineName;
  ok: boolean;
  ms: number;
  chars: number;
  model_id: string;
  error: string | null;
}

// ─── Utility ────────────────────────────────────────────────────────────

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return await Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms)),
  ]);
}

function shape(d: unknown): string {
  try { return JSON.stringify(d).slice(0, 400); } catch { return String(d).slice(0, 400); }
}

// ─── Probes (mirror v2 request shapes) ──────────────────────────────────

async function probeClaude(): Promise<ProbeResult> {
  const t0 = Date.now();
  const model_id = ANTHROPIC_MODEL_SYNTH;
  try {
    const r = await withTimeout(fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: model_id,
        max_tokens: 50,
        messages: [{ role: "user", content: PROBE_PROMPT }],
      }),
    }), PROBE_TIMEOUT_MS);
    const ms = Date.now() - t0;
    if (!r.ok) {
      const body = await r.text().catch(() => "");
      return { engine: "claude", ok: false, ms, chars: 0, model_id, error: `HTTP ${r.status}: ${body.slice(0, 500)}` };
    }
    const d = await r.json();
    const blocks = Array.isArray(d?.content) ? d.content : [];
    const text = blocks
      .filter((b: any) => b?.type === "text" && typeof b?.text === "string")
      .map((b: any) => b.text).join("").trim();
    if (!text) return { engine: "claude", ok: false, ms, chars: 0, model_id, error: `empty on 2xx: ${shape(d)}` };
    return { engine: "claude", ok: true, ms, chars: text.length, model_id, error: null };
  } catch (e: any) {
    return { engine: "claude", ok: false, ms: Date.now() - t0, chars: 0, model_id, error: e?.message || String(e) };
  }
}

async function probeOpenAI(): Promise<ProbeResult> {
  const t0 = Date.now();
  const model_id = OPENAI_MODEL_SYNTH;
  try {
    const r = await withTimeout(fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: model_id,
        max_completion_tokens: 50,
        reasoning_effort: "none",
        messages: [{ role: "user", content: PROBE_PROMPT }],
      }),
    }), PROBE_TIMEOUT_MS);
    const ms = Date.now() - t0;
    if (!r.ok) {
      const body = await r.text().catch(() => "");
      return { engine: "openai", ok: false, ms, chars: 0, model_id, error: `HTTP ${r.status}: ${body.slice(0, 500)}` };
    }
    const d = await r.json();
    const text = (d?.choices?.[0]?.message?.content || "").trim();
    if (!text) return { engine: "openai", ok: false, ms, chars: 0, model_id, error: `empty on 2xx: ${shape(d)}` };
    return { engine: "openai", ok: true, ms, chars: text.length, model_id, error: null };
  } catch (e: any) {
    return { engine: "openai", ok: false, ms: Date.now() - t0, chars: 0, model_id, error: e?.message || String(e) };
  }
}

async function probeGemini(): Promise<ProbeResult> {
  const t0 = Date.now();
  const model_id = GEMINI_MODEL;
  try {
    const r = await withTimeout(fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model_id}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: PROBE_PROMPT }] }],
        }),
      },
    ), PROBE_TIMEOUT_MS);
    const ms = Date.now() - t0;
    if (!r.ok) {
      const body = await r.text().catch(() => "");
      return { engine: "gemini", ok: false, ms, chars: 0, model_id, error: `HTTP ${r.status}: ${body.slice(0, 500)}` };
    }
    const d = await r.json();
    const parts: Array<{ text?: string; thought?: boolean }> = d?.candidates?.[0]?.content?.parts ?? [];
    const text = parts
      .filter((p) => p && p.thought !== true && typeof p.text === "string")
      .map((p) => p.text as string).join("").trim();
    if (!text) return { engine: "gemini", ok: false, ms, chars: 0, model_id, error: `empty on 2xx: ${shape(d)}` };
    return { engine: "gemini", ok: true, ms, chars: text.length, model_id, error: null };
  } catch (e: any) {
    return { engine: "gemini", ok: false, ms: Date.now() - t0, chars: 0, model_id, error: e?.message || String(e) };
  }
}

async function probePerplexity(): Promise<ProbeResult> {
  const t0 = Date.now();
  const model_id = PERPLEXITY_MODEL;
  try {
    const r = await withTimeout(fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: model_id,
        messages: [{ role: "user", content: PERPLEXITY_PROBE_PROMPT }],
        max_tokens: 50,
      }),
    }), PROBE_TIMEOUT_MS);
    const ms = Date.now() - t0;
    if (!r.ok) {
      const body = await r.text().catch(() => "");
      return { engine: "perplexity", ok: false, ms, chars: 0, model_id, error: `HTTP ${r.status}: ${body.slice(0, 500)}` };
    }
    const d = await r.json();
    const text = (d?.choices?.[0]?.message?.content || "").replace(/\[\d+\]/g, "").trim();
    if (!text) return { engine: "perplexity", ok: false, ms, chars: 0, model_id, error: `empty on 2xx: ${shape(d)}` };
    if (!text.toLowerCase().includes(PERPLEXITY_EXPECT)) {
      return { engine: "perplexity", ok: false, ms, chars: text.length, model_id, error: `grounding failed — expected '${PERPLEXITY_EXPECT}', got: ${text.slice(0, 200)}` };
    }
    return { engine: "perplexity", ok: true, ms, chars: text.length, model_id, error: null };
  } catch (e: any) {
    return { engine: "perplexity", ok: false, ms: Date.now() - t0, chars: 0, model_id, error: e?.message || String(e) };
  }
}

// ─── Handler ────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Auth: internal-secret (cron) OR admin JWT (admin dashboard).
  // Historic service-role bearer path removed — cron now uses x-internal-secret.
  const expectedInternal = Deno.env.get("INTERNAL_FN_SECRET");
  const providedInternal = req.headers.get("x-internal-secret");
  const isInternalCall = !!expectedInternal && providedInternal === expectedInternal;

  if (!isInternalCall) {
    const authHeader = req.headers.get("Authorization") ?? "";
    const bearer = authHeader.replace(/^Bearer\s+/i, "");
    if (!bearer) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: mem } = await admin
      .from("admin_memberships")
      .select("role, expires_at")
      .eq("user_id", userRes.user.id)
      .maybeSingle();
    const notExpired = !mem?.expires_at || new Date(mem.expires_at) > new Date();
    if (!mem?.role || !notExpired) {
      return new Response(JSON.stringify({ error: "Admin required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }


  // Probe all engines in parallel — none may throw out of here.
  const [claude, openai, gemini, perplexity] = await Promise.all([
    probeClaude(), probeOpenAI(), probeGemini(), probePerplexity(),
  ]);
  const results: ProbeResult[] = [claude, openai, gemini, perplexity];

  // Insert every row (best-effort each — log but don't fail response).
  for (const r of results) {
    const { error: insErr } = await admin.from("echo_engine_health").insert({
      engine: r.engine,
      ok: r.ok,
      ms: r.ms,
      chars: r.chars,
      model_id: r.model_id,
      error: r.error,
    });
    if (insErr) console.error(`[echo-engine-health] insert ${r.engine} failed:`, insErr.message);
  }

  return new Response(JSON.stringify({ build: BUILD, results }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
