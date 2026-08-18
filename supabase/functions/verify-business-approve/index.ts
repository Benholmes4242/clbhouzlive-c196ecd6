import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

import { corsFor } from '../_shared/cors.ts';
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } }
);

async function isSuperAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("admin_memberships")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error checking admin status:", error);
    return false;
  }

  return !!data && data.role === "full";
}

/**
 * Look up the owner of a business (business_members.role='owner', falling back
 * to the first member) and enqueue a push notification per registered device.
 * Same pattern as game-create; fire-and-forget.
 */
async function queueOwnerPush(
  admin: ReturnType<typeof createClient>,
  businessId: string,
  payload: { title: string; body: string; data: Record<string, unknown> },
) {
  const { data: members } = await admin
    .from("business_members")
    .select("user_id, role")
    .eq("business_id", businessId);
  const owner = (members ?? []).find((m: any) => m.role === "owner") ?? (members ?? [])[0];
  const ownerId = owner?.user_id as string | undefined;
  if (!ownerId) return;

  const { data: devices } = await admin
    .from("user_push_devices")
    .select("provider_id")
    .eq("user_id", ownerId);
  if (!devices || devices.length === 0) return;

  for (const d of devices as any[]) {
    await admin.from("push_notification_queue").insert({
      user_id: ownerId,
      recipient_actor_type: "personal",
      recipient_actor_id: ownerId,
      device_id: d.provider_id,
      title: payload.title,
      body: payload.body,
      data: payload.data,
    });
  }
}

serve(async (req) => {

  const corsHeaders = corsFor(req.headers.get('Origin'));
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt);

    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminUserId = userData.user.id;

    if (!(await isSuperAdmin(adminUserId))) {
      return new Response(JSON.stringify({ ok: false, error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { request_id, admin_notes } = await req.json();

    if (!request_id) {
      return new Response(JSON.stringify({ ok: false, error: "Missing request_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load request to get business_id (for the result email) and gate on pending status
    const { data: request, error: reqErr } = await supabaseAdmin
      .from("business_verification_requests")
      .select("id, business_id, status")
      .eq("id", request_id)
      .single();

    if (reqErr || !request) {
      return new Response(JSON.stringify({ ok: false, error: "Request not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (request.status !== "pending") {
      return new Response(JSON.stringify({ ok: false, error: "Request is not pending" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // User-scoped client so auth.uid() resolves inside the SECURITY DEFINER RPC
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } }
    );

    // PHASE 4 QUORUM. The RPC records THIS reviewer's approval and only flips
    // is_verified once approval_count >= required_approvals. required_approvals
    // defaults to 1, so single-reviewer behaviour is unchanged: one call, verified.
    // A second approval from the SAME reviewer cannot complete a quorum - the
    // ledger's unique (request_id, reviewer_id) constraint refuses it.
    const { data: rpcResult, error: rpcErr } = await supabaseUser.rpc("approve_business_verification", {
      _request_id: request_id,
      _admin_note: admin_notes ?? null,
    });

    if (rpcErr) {
      console.error("approve_business_verification RPC failed:", rpcErr);
      throw new Error(rpcErr.message || "Failed to approve request");
    }

    const quorum = (rpcResult ?? {}) as {
      completed?: boolean;
      approval_count?: number;
      required_approvals?: number;
    };
    const completed = quorum.completed !== false;

    if (!completed) {
      // Still pending: no badge, no email, no push. A DIFFERENT reviewer must
      // approve to complete it.
      console.log(
        `Request ${request_id} approved by ${adminUserId} - awaiting quorum ` +
        `(${quorum.approval_count}/${quorum.required_approvals})`,
      );
      return new Response(
        JSON.stringify({
          ok: true,
          completed: false,
          approval_count: quorum.approval_count ?? 1,
          required_approvals: quorum.required_approvals ?? 1,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    console.log(`Business ${request.business_id} verified by admin ${adminUserId}`);

    // Fire-and-forget result email (best-effort; never block approval)
    supabaseAdmin.functions
      .invoke("send-business-verification-result-email", {
        body: { business_id: request.business_id, outcome: "approved", admin_note: admin_notes ?? null },
      })
      .catch((e) => console.error("[approve] result-email failed", e));

    // Fire-and-forget push notification to the business owner
    queueOwnerPush(supabaseAdmin, request.business_id, {
      title: "You're verified",
      body: "Your business has been verified on clbhouz.",
      data: { type: "business_verification_result", outcome: "approved", business_id: request.business_id },
    }).catch((e) => console.error("[approve] push queue failed", e));






    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e: any) {
    console.error("Approve error:", e);
    return new Response(
      JSON.stringify({ ok: false, error: e?.message ?? String(e) }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
