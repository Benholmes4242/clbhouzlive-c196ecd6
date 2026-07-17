// gam-backdate-replay — admin one-shot. Loops every EG-synced user and calls gam_reset_user(user_id).
// Used at launch day and for ops support.

import { createClient } from "npm:@supabase/supabase-js@2";

import { corsFor } from '../_shared/cors.ts';
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } }
);

const ADMIN_SECRET = Deno.env.get("GAM_ADMIN_SECRET");

Deno.serve(async (req) => {
  const corsHeaders = corsFor(req.headers.get('Origin'));
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    // Require admin secret to invoke
    const provided = req.headers.get("x-admin-secret") ?? "";
    if (!ADMIN_SECRET || provided !== ADMIN_SECRET) {
      return json({ error: "unauthorized" }, 401);
    }

    let body: any = {};
    try { body = await req.json(); } catch { /* ignore */ }
    const onlyUserId: string | null = body?.user_id ?? null;

    let q = supabase.from("user_profiles").select("id").eq("eg_app_connected", true);
    if (onlyUserId) q = q.eq("id", onlyUserId);
    const { data: users, error } = await q;
    if (error) throw error;

    let ok = 0, failed = 0;
    const errors: any[] = [];
    for (const u of users ?? []) {
      try {
        const { error: rpcErr } = await supabase.rpc("gam_reset_user", { p_user_id: u.id });
        if (rpcErr) throw rpcErr;
        ok++;
      } catch (e) {
        failed++;
        errors.push({ user_id: u.id, error: (e as Error).message });
        console.error(`[backdate-replay] ${u.id}`, (e as Error).message);
      }
    }
    console.log(`[backdate-replay] reset ${ok} users, ${failed} failures`);
    return json({ ok: true, processed: users?.length ?? 0, succeeded: ok, failed, errors });
  } catch (e) {
    console.error("[backdate-replay]", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}
