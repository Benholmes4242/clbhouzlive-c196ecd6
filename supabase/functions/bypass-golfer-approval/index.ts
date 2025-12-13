import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } }
);

// Mock approver UUID for bypass testing
const MOCK_APPROVER_ID = "00000000-0000-0000-0000-000000000002";

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
    
    if (!(await isAdmin(adminUserId))) {
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

    // 3) Load golfer verification request
    const { data: request, error: reqErr } = await supabaseAdmin
      .from("golfer_verification_requests")
      .select("id, user_id, status, required_approvals")
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

    const now = new Date().toISOString();

    // 4) Insert mock approval using service role (bypasses RLS)
    const { error: reviewError } = await supabaseAdmin
      .from("golfer_verification_reviews")
      .insert({
        request_id: request_id,
        reviewer_id: MOCK_APPROVER_ID,
        decision: "approved",
        note: "Bypass approval for testing",
        created_at: now,
      });

    if (reviewError) {
      console.error("Failed to insert mock approval:", reviewError);
      throw new Error("Failed to insert bypass approval: " + reviewError.message);
    }

    // 5) Count current approvals
    const { count: approvalCount, error: countErr } = await supabaseAdmin
      .from("golfer_verification_reviews")
      .select("*", { count: "exact", head: true })
      .eq("request_id", request_id)
      .eq("decision", "approved");

    if (countErr) {
      console.error("Failed to count approvals:", countErr);
      throw new Error("Failed to count approvals");
    }

    const totalApprovals = approvalCount ?? 0;
    const requiredApprovals = request.required_approvals ?? 2;

    // 6) If we've met the threshold, approve the request and verify the golfer
    if (totalApprovals >= requiredApprovals) {
      // Update request to approved
      const { error: updReqErr } = await supabaseAdmin
        .from("golfer_verification_requests")
        .update({
          status: "approved",
          approval_count: totalApprovals,
          reviewed_at: now,
          admin_note: "Approved via bypass for testing",
          updated_at: now,
        })
        .eq("id", request_id);

      if (updReqErr) {
        console.error("Failed to update request:", updReqErr);
        throw new Error("Failed to update request");
      }

      // Verify the golfer on their user_profiles row
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
        throw new Error("Failed to verify golfer");
      }

      // 7) Send notification to golfer
      const { error: notifyErr } = await supabaseAdmin
        .from("notifications")
        .insert({
          user_id: request.user_id,
          type: "golfer_verification_approved",
          title: "You're verified",
          body: "Your golfer profile has been verified.",
          data: { request_id: request_id, forced: true },
        });

      if (notifyErr) {
        console.error("Failed to insert notification:", notifyErr);
        // Not fatal, continue
      }

      console.log(`Golfer ${request.user_id} verified via bypass by admin ${adminUserId}`);
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
