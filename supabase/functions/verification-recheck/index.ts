/**
 * BRIEF_VERIFICATION_PHASE_5B §3 — RE-VERIFICATION.
 *
 * Annual, driven off verified_at (business_accounts.verification_recheck_due_at
 * is set to verified_at + 1 year and rolls forward on a pass).
 *
 * WHAT IT DOES
 *   · DOMAIN signal present  → re-test it automatically. A domain that still
 *     RESOLVES and answers on https passes. A domain that does not is FLAGGED
 *     for human review — never revoked (§3.3). A domain can lapse for a
 *     weekend; a badge should not.
 *   · DOCUMENT / PRESENCE only → cannot be re-tested honestly (§3.4), so the
 *     business is PROMPTED to confirm its details are current.
 *   · Pre-Phase-3 approvals have no signals → prompted, not judged.
 *
 * NOT BUILT HERE (§3.5): the schedule. This function is the mechanism; it is
 * safe to call repeatedly and processes only rows that are due. Wire it to
 * pg_cron (weekly is plenty) when Ben wants it running.
 *
 * Call with the cron secret header, or as an admin.
 */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

import { corsFor } from '../_shared/cors.ts';

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

function asObject(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

/** A domain still stands if it answers at all. We are testing existence, not health. */
async function domainStillResolves(domain: string): Promise<boolean> {
  const url = `https://${domain.replace(/^https?:\/\//i, '').replace(/\/.*$/, '')}`;
  for (const method of ["HEAD", "GET"] as const) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      const r = await fetch(url, { method, redirect: "follow", signal: ctrl.signal });
      clearTimeout(timer);
      if (r.status < 500) return true;
    } catch (_) { /* try the next method */ }
  }
  return false;
}

serve(async (req) => {
  const corsHeaders = corsFor(req.headers.get('Origin'));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const cronSecret = Deno.env.get("CRON_SECRET");
    const provided = req.headers.get("x-cron-secret");
    let authorised = !!cronSecret && provided === cronSecret;

    if (!authorised) {
      const authHeader = req.headers.get("Authorization") ?? "";
      const { data: userData } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));
      if (userData?.user) {
        const { data: m } = await supabaseAdmin
          .from("admin_memberships").select("role").eq("user_id", userData.user.id).maybeSingle();
        authorised = !!m && m.role === "full";
      }
    }
    if (!authorised) return json({ ok: false, error: "Unauthorized" }, 401);

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const limit = Math.min(Number(body?.limit ?? 50), 200);
    const dryRun = body?.dry_run === true;

    const { data: due, error } = await supabaseAdmin
      .from("business_accounts")
      .select("id, name, verified_at, verification_recheck_due_at")
      .eq("is_verified", true)
      .not("verification_recheck_due_at", "is", null)
      .lte("verification_recheck_due_at", new Date().toISOString())
      .order("verification_recheck_due_at", { ascending: true })
      .limit(limit);
    if (error) throw error;

    const outcomes: { business_id: string; name: string; state: string; reason: string }[] = [];

    for (const biz of (due ?? []) as any[]) {
      const { data: approved } = await supabaseAdmin
        .from("business_verification_requests")
        .select("proof_metadata, reviewed_at")
        .eq("business_id", biz.id)
        .eq("status", "approved")
        .order("reviewed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const meta = asObject(approved?.proof_metadata);
      const signals = asObject(meta.signals);
      const domainMeta = asObject(signals.domain);
      const domain = (domainMeta.domain ?? null) as string | null;
      const domainStands = domainMeta.email_verified === true && domainMeta.free_provider !== true;

      let state: 'passed' | 'flagged' | 'prompted';
      let reason: string;

      if (domain && domainStands) {
        const ok = await domainStillResolves(domain);
        state = ok ? 'passed' : 'flagged';
        reason = ok
          ? `Domain ${domain} still resolves.`
          : `Domain ${domain} did not resolve — needs a human look. The badge is unchanged.`;
      } else if (Object.keys(signals).length === 0) {
        state = 'prompted';
        reason = 'Approved before the signal model — ask the business to confirm its details are current.';
      } else {
        state = 'prompted';
        reason = 'Document and presence signals cannot be re-tested — ask the business to confirm its details are current.';
      }

      if (!dryRun) {
        const { error: rpcErr } = await supabaseAdmin.rpc("flag_verification_recheck", {
          p_business_id: biz.id,
          p_state: state,
          p_reason: reason,
        });
        if (rpcErr) console.error("[recheck] flag failed", biz.id, rpcErr);
      }

      outcomes.push({ business_id: biz.id, name: biz.name, state, reason });
    }

    console.log(`[recheck] processed ${outcomes.length} (dry_run=${dryRun})`, JSON.stringify(outcomes));
    return json({ ok: true, dry_run: dryRun, processed: outcomes.length, outcomes });
  } catch (e: any) {
    console.error("[recheck] error", e);
    return json({ ok: false, error: e?.message ?? String(e) }, 500);
  }
});
