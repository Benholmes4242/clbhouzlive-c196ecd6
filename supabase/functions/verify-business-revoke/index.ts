/**
 * BRIEF_VERIFICATION_PHASE_5B §1 — REVOCATION, SURFACED.
 *
 * revoke_business_verification already unverifies, clears verified_at /
 * verified_by, sets last_verification_action, applies the 7-day cooldown and
 * writes verification_audit_log. It was NOT reachable from the console, and it
 * had no admin gate of its own. This function is the gated entry point; the
 * migration added the gate inside the RPC as well (defence in depth).
 *
 * §1.5 — the business is TOLD: in-app notification (from the RPC), email, push.
 */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

import { corsFor } from '../_shared/cors.ts';
import { REVOCATION_REASONS, REVOCATION_REASON_LABEL } from '../_shared/verificationRevocationReasons.ts';

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

async function isFullAdmin(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("admin_memberships")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  return !!data && data.role === "full";
}

async function queueOwnerPush(businessId: string, businessName: string) {
  const { data: members } = await supabaseAdmin
    .from("business_members")
    .select("user_id, role")
    .eq("business_id", businessId);
  const recipients = (members ?? []).filter((m: any) => m.role === "owner" || m.role === "admin");
  for (const m of recipients as any[]) {
    const { data: devices } = await supabaseAdmin
      .from("user_push_devices")
      .select("provider_id")
      .eq("user_id", m.user_id);
    for (const d of (devices ?? []) as any[]) {
      await supabaseAdmin.from("push_notification_queue").insert({
        user_id: m.user_id,
        recipient_actor_type: "personal",
        recipient_actor_id: m.user_id,
        device_id: d.provider_id,
        title: "Verification removed",
        body: `The verified badge for ${businessName} has been removed.`,
        data: { type: "business_verification_revoked", business_id: businessId },
      });
    }
  }
}

serve(async (req) => {
  const corsHeaders = corsFor(req.headers.get('Origin'));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

    const authHeader = req.headers.get("Authorization") ?? "";
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userErr || !userData?.user) return json({ ok: false, error: "Unauthorized" }, 401);
    const adminUserId = userData.user.id;
    if (!(await isFullAdmin(adminUserId))) return json({ ok: false, error: "Forbidden" }, 403);

    const { business_id, reason, admin_note, bypass_cooldown } = await req.json();
    if (!business_id) return json({ ok: false, error: "Missing business_id" }, 400);

    // §1.3 — the reason is STRUCTURED and required. Revocation is not a mood.
    if (typeof reason !== "string" || !REVOCATION_REASONS.includes(reason as never)) {
      return json({ ok: false, error: "A structured reason is required" }, 400);
    }
    if (reason === "other" && String(admin_note ?? "").trim().length < 3) {
      return json({ ok: false, error: "admin_note required (min 3 characters) for 'Other'" }, 400);
    }

    const { data: biz } = await supabaseAdmin
      .from("business_accounts")
      .select("id, name, is_verified, is_system_account")
      .eq("id", business_id)
      .maybeSingle();
    if (!biz) return json({ ok: false, error: "Business not found" }, 404);
    if (!biz.is_verified) return json({ ok: false, error: "Business is not verified" }, 409);

    // §1.3 — the bypass exists for system accounts only.
    const bypass = !!bypass_cooldown && !!biz.is_system_account;

    // User-scoped client so auth.uid() resolves inside the SECURITY DEFINER RPC.
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
    );

    const { error: rpcErr } = await supabaseUser.rpc("revoke_business_verification", {
      p_business_id: business_id,
      p_admin_id: adminUserId,
      p_reason: reason,
      p_bypass_cooldown: bypass,
      p_note: admin_note ?? null,
    });
    if (rpcErr) {
      console.error("[revoke] RPC failed", rpcErr);
      return json({ ok: false, error: rpcErr.message || "Failed to revoke" }, 500);
    }

    console.log(`[revoke] ${business_id} revoked by ${adminUserId} (${reason})`);

    // §1.5 — losing a badge silently is the worst version of this.
    const cause = REVOCATION_REASON_LABEL[reason] ?? null;
    supabaseAdmin.functions
      .invoke("send-business-verification-result-email", {
        body: {
          business_id,
          outcome: "rejected",
          admin_note: [cause, admin_note].filter(Boolean).join(" ") || "Your verified badge has been removed.",
          review_reason: REVOCATION_REASONS.includes(reason as never) && !cause ? reason : null,
        },
      })
      .catch((e) => console.error("[revoke] result-email failed", e));

    queueOwnerPush(business_id, biz.name as string).catch((e) => console.error("[revoke] push failed", e));

    return json({ ok: true, cooldown_bypassed: bypass || !!biz.is_system_account });
  } catch (e: any) {
    console.error("[revoke] error", e);
    return json({ ok: false, error: e?.message ?? String(e) }, 500);
  }
});
