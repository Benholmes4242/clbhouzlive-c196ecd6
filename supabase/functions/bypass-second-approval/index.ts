import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

import { corsFor } from '../_shared/cors.ts';
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } }
);

// Mock approver UUID for bypass testing
const MOCK_APPROVER_ID = "00000000-0000-0000-0000-000000000002";

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

  return !!data && ["super_admin", "admin", "moderator"].includes(data.role);
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

    // 1) Identify caller
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

    // 3) Load request + business
    const { data: request, error: reqErr } = await supabaseAdmin
      .from("business_verification_requests")
      .select("id, business_id, status, required_approvals")
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

    // 4) Load business and verify it's a system account
    const { data: business, error: bizErr } = await supabaseAdmin
      .from("business_accounts")
      .select("id, is_system_account")
      .eq("id", request.business_id)
      .single();

    if (bizErr || !business) {
      return new Response(JSON.stringify({ ok: false, error: "Business not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!business.is_system_account) {
      return new Response(JSON.stringify({ ok: false, error: "Bypass only allowed for system accounts" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date().toISOString();

    // 5) Insert mock approval using service role (bypasses RLS)
    const { error: reviewError } = await supabaseAdmin
      .from("business_verification_reviews")
      .insert({
        request_id: request_id,
        reviewer_id: MOCK_APPROVER_ID,
        decision: "approved",
        note: "Bypass approval for system account testing",
        created_at: now,
      });

    if (reviewError) {
      console.error("Failed to insert mock approval:", reviewError);
      throw new Error("Failed to insert bypass approval: " + reviewError.message);
    }

    // 6) Count current approvals
    const { count: approvalCount, error: countErr } = await supabaseAdmin
      .from("business_verification_reviews")
      .select("*", { count: "exact", head: true })
      .eq("request_id", request_id)
      .eq("decision", "approved");

    if (countErr) {
      console.error("Failed to count approvals:", countErr);
      throw new Error("Failed to count approvals");
    }

    const totalApprovals = approvalCount ?? 0;
    const requiredApprovals = request.required_approvals ?? 2;

    // 7) If we've met the threshold, approve the request and verify the business
    if (totalApprovals >= requiredApprovals) {
      // Update request to approved
      const { error: updReqErr } = await supabaseAdmin
        .from("business_verification_requests")
        .update({
          status: "approved",
          approval_count: totalApprovals,
          reviewed_at: now,
          reviewed_by: adminUserId,
          admin_note: "Approved via bypass for system account testing",
          domain_confirmed: true,
          domain_confirmed_at: now,
          updated_at: now,
        })
        .eq("id", request_id);

      if (updReqErr) {
        console.error("Failed to update request:", updReqErr);
        throw new Error("Failed to update request");
      }

      // Verify the business
      const { error: updBizErr } = await supabaseAdmin
        .from("business_accounts")
        .update({
          is_verified: true,
          verified_by: adminUserId,
          verified_at: now,
        })
        .eq("id", request.business_id);

      if (updBizErr) {
        console.error("Failed to verify business:", updBizErr);
        throw new Error("Failed to verify business");
      }

      console.log(`Business ${request.business_id} verified via bypass by admin ${adminUserId}`);
    }

    return new Response(JSON.stringify({ 
      ok: true, 
      approvals: totalApprovals, 
      status: totalApprovals >= requiredApprovals ? "approved" : "pending" 
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
