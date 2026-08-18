/**
 * BRIEF_VERIFICATION_PHASE_5B §5 — THE GOLFER PATH, SAME SHAPE.
 *
 * Before this, a golfer decision was a client-side UPDATE on
 * golfer_verification_requests: no gate, no audit row, no notification, no
 * reason. It now goes through decide_golfer_verification (approve / decline) or
 * remove_golfer_verification (removal), both of which write the status, record
 * the decider, write verification_audit_log and notify the golfer in-app. This
 * function adds the admin gate at the boundary, the email and the push.
 *
 * §5.5 — needs_more_info is NOT accepted, and the console says so rather than
 * throwing: an invited golfer has nothing to supply.
 */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

import { corsFor } from '../_shared/cors.ts';
import { GOLFER_REASONS, GOLFER_REASON_LABEL } from '../_shared/verificationRevocationReasons.ts';

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("admin_memberships")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  return !!data && (data.role === "full" || data.role === "limited");
}

async function notifyGolfer(userId: string, decision: string, reason: string | null, note: string | null) {
  const approved = decision === "approved";
  const cause = reason ? GOLFER_REASON_LABEL[reason] ?? "" : "";
  const body = approved
    ? "Your verified badge is now live across Clbhouz."
    : [cause || "Your verification was not granted.", note].filter(Boolean).join(" ");

  // Email, if we can resolve one. A missing address must not fail the decision.
  try {
    await supabaseAdmin.functions.invoke("send-golfer-verification-result-email", {
      body: { user_id: userId, outcome: decision, reason, admin_note: note },
    });
  } catch (e) {
    console.error("[golfer-decision] email failed", e);
  }

  // Push, best effort.
  try {
    const { data: devices } = await supabaseAdmin
      .from("user_push_devices")
      .select("provider_id")
      .eq("user_id", userId);
    for (const d of (devices ?? []) as any[]) {
      await supabaseAdmin.from("push_notification_queue").insert({
        user_id: userId,
        recipient_actor_type: "personal",
        recipient_actor_id: userId,
        device_id: d.provider_id,
        title: approved ? "You're verified" : "Verification update",
        body,
        data: { type: approved ? "golfer_verification_approved" : "golfer_verification_rejected" },
      });
    }
  } catch (e) {
    console.error("[golfer-decision] push failed", e);
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
    if (!(await isAdmin(adminUserId))) return json({ ok: false, error: "Forbidden" }, 403);

    const { request_id, user_id, decision, reason, admin_note } = await req.json();

    if (decision === "needs_more_info") {
      // §5.5 — plainly, not an exception.
      return json({ ok: false, error: "An invited golfer has nothing further to supply, so 'needs info' does not apply here." }, 400);
    }
    if (!["approved", "rejected", "removed"].includes(decision)) {
      return json({ ok: false, error: "Invalid decision" }, 400);
    }
    if (decision !== "approved") {
      if (typeof reason !== "string" || !GOLFER_REASONS.includes(reason as never)) {
        return json({ ok: false, error: "A structured reason is required" }, 400);
      }
      if (reason === "other" && String(admin_note ?? "").trim().length < 3) {
        return json({ ok: false, error: "admin_note required (min 3 characters) for 'Other'" }, 400);
      }
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
    );

    let golferId: string | null = user_id ?? null;

    if (decision === "removed") {
      if (!golferId) return json({ ok: false, error: "Missing user_id" }, 400);
      const { error } = await supabaseUser.rpc("remove_golfer_verification", {
        p_user_id: golferId,
        p_note: admin_note ?? null,
        p_reason: reason ?? null,
      });
      if (error) return json({ ok: false, error: error.message }, 500);
    } else {
      if (!request_id) return json({ ok: false, error: "Missing request_id" }, 400);
      const { data: reqRow } = await supabaseAdmin
        .from("golfer_verification_requests")
        .select("id, user_id, status")
        .eq("id", request_id)
        .maybeSingle();
      if (!reqRow) return json({ ok: false, error: "Request not found" }, 404);
      if (["approved", "rejected", "removed"].includes(String(reqRow.status))) {
        return json({ ok: false, error: "Request is not pending" }, 409);
      }
      golferId = reqRow.user_id as string;

      const { error } = await supabaseUser.rpc("decide_golfer_verification", {
        p_request_id: request_id,
        p_decision: decision,
        p_reason: reason ?? null,
        p_note: admin_note ?? null,
      });
      if (error) return json({ ok: false, error: error.message }, 500);
    }

    console.log(`[golfer-decision] ${decision} for ${golferId} by ${adminUserId} (${reason ?? '-'})`);

    if (golferId) {
      notifyGolfer(golferId, decision === "removed" ? "rejected" : decision, reason ?? null, admin_note ?? null)
        .catch((e) => console.error("[golfer-decision] notify failed", e));
    }

    return json({ ok: true });
  } catch (e: any) {
    console.error("[golfer-decision] error", e);
    return json({ ok: false, error: e?.message ?? String(e) }, 500);
  }
});
