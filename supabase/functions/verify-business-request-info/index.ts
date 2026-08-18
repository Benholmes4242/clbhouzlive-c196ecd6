import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

import { corsFor } from '../_shared/cors.ts';
import { REVIEW_REASONS } from '../_shared/verificationReviewReasons.ts';
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
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
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
        status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const adminUserId = userData.user.id;
    if (!(await isSuperAdmin(adminUserId))) {
      return new Response(JSON.stringify({ ok: false, error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PHASE 4: `review_reason` is the structured decision reason. OPTIONAL by
    // design - a pre-Phase-4 client that omits it must still succeed.
    const { request_id, admin_notes, review_reason } = await req.json();
    const reviewReason = typeof review_reason === "string" && REVIEW_REASONS.includes(review_reason)
      ? review_reason
      : null;
    if (!request_id) {
      return new Response(JSON.stringify({ ok: false, error: "Missing request_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!admin_notes || String(admin_notes).trim().length < 3) {
      return new Response(JSON.stringify({ ok: false, error: "admin_notes required (min 3 characters)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: request, error: reqErr } = await supabaseAdmin
      .from("business_verification_requests")
      .select("id, business_id, status")
      .eq("id", request_id)
      .single();
    if (reqErr || !request) {
      return new Response(JSON.stringify({ ok: false, error: "Request not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (request.status !== "pending" && request.status !== "needs_more_info") {
      return new Response(JSON.stringify({ ok: false, error: "Request is not pending" }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // User-scoped client so auth.uid() resolves inside the SECURITY DEFINER RPC
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
    );

    const { error: rpcErr } = await supabaseUser.rpc("request_info_business_verification", {
      _request_id: request_id,
      _admin_note: admin_notes,
      _review_reason: reviewReason,
    });
    if (rpcErr) {
      console.error("request_info_business_verification RPC failed:", rpcErr);
      throw new Error(rpcErr.message || "Failed to update request");
    }

    supabaseAdmin.functions
      .invoke("send-business-verification-result-email", {
        body: { business_id: request.business_id, outcome: "needs_more_info", admin_note: admin_notes, review_reason: reviewReason },
      })
      .catch((e) => console.error("[request-info] result-email failed", e));

    queueOwnerPush(supabaseAdmin, request.business_id, {
      title: "More info needed",
      body: "A reviewer needs a bit more information to verify your business.",
      data: { type: "business_verification_result", outcome: "needs_more_info", business_id: request.business_id },
    }).catch((e) => console.error("[request-info] push queue failed", e));




    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("Request-info error:", e);
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
