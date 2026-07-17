import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

import { corsFor } from '../_shared/cors.ts';
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } }
);

async function isAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("admin_memberships")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error checking admin status:", error);
    return false;
  }

  // Actual roles in DB are "full" and "limited"
  return !!data && ["full", "limited"].includes(data.role);
}

serve(async (req) => {
  const corsHeaders = corsFor(req.headers.get('Origin'));
  // Handle CORS preflight
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

    // 1) Identify caller from JWT
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt);

    if (userErr || !userData?.user) {
      console.error("Auth error:", userErr);
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminUserId = userData.user.id;
    console.log(`Bypass request from admin: ${adminUserId}`);
    
    if (!(await isAdmin(adminUserId))) {
      console.error(`User ${adminUserId} is not an admin`);
      return new Response(JSON.stringify({ ok: false, error: "Forbidden - Admin required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) Parse payload
    const { request_id } = await req.json();
    
    if (!request_id) {
      return new Response(JSON.stringify({ ok: false, error: "Missing request_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing bypass for request: ${request_id}`);

    // 3) Load golfer verification request
    const { data: request, error: reqErr } = await supabaseAdmin
      .from("golfer_verification_requests")
      .select("id, user_id, status, required_approvals, approval_count")
      .eq("id", request_id)
      .single();

    if (reqErr || !request) {
      console.error("Request not found:", reqErr);
      return new Response(JSON.stringify({ ok: false, error: "Request not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (request.status !== "pending") {
      return new Response(JSON.stringify({ ok: false, error: `Request is not pending (status: ${request.status})` }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date().toISOString();
    const requiredApprovals = request.required_approvals ?? 2;

    // 4) Directly approve the request using bypass metadata (no fake review row)
    const { error: updReqErr } = await supabaseAdmin
      .from("golfer_verification_requests")
      .update({
        status: "approved",
        approval_count: requiredApprovals,
        reviewed_at: now,
        updated_at: now,
        second_approval_bypassed: true,
        second_approval_bypassed_by: adminUserId,
        second_approval_bypassed_at: now,
        second_approval_bypass_note: "Bypass 2nd admin (test)",
      })
      .eq("id", request_id);

    if (updReqErr) {
      console.error("Failed to update request:", updReqErr);
      throw new Error("Failed to update request: " + updReqErr.message);
    }

    console.log(`Request ${request_id} approved via bypass`);

    // 5) Verify the golfer on their user_profiles row
    const { error: updProfileErr } = await supabaseAdmin
      .from("user_profiles")
      .update({
        is_verified_golfer: true,
        golfer_verified_at: now,
        golfer_verified_by: adminUserId,
      })
      .eq("id", request.user_id);

    if (updProfileErr) {
      console.error("Failed to verify golfer:", updProfileErr);
      throw new Error("Failed to verify golfer: " + updProfileErr.message);
    }

    console.log(`User ${request.user_id} marked as verified golfer`);

    // 6) Send notification to golfer
    const { error: notifyErr } = await supabaseAdmin
      .from("notifications")
      .insert({
        user_id: request.user_id,
        type: "golfer_verification_approved",
        title: "You're verified",
        message: "Your golfer profile has been verified.",
        data: { request_id: request_id, bypassed: true },
      });

    if (notifyErr) {
      console.error("Failed to insert notification:", notifyErr);
      // Not fatal, continue
    }

    // 7) Insert audit log
    const { error: auditErr } = await supabaseAdmin
      .from("verification_audit_log")
      .insert({
        action: "golfer_verification_bypassed_second_approval",
        actor_id: adminUserId,
        entity_type: "golfer_verification_request",
        entity_id: request_id,
        note: "Bypass 2nd admin approval for testing",
        data: { user_id: request.user_id },
      });

    if (auditErr) {
      console.error("Failed to insert audit log:", auditErr);
      // Not fatal, continue
    }

    console.log(`Golfer ${request.user_id} verified via bypass by admin ${adminUserId}`);

    return new Response(JSON.stringify({ 
      ok: true, 
      approvals: requiredApprovals, 
      status: "approved" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e: any) {
    console.error("Bypass error:", e);
    return new Response(
      JSON.stringify({ ok: false, error: e?.message ?? String(e) }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
