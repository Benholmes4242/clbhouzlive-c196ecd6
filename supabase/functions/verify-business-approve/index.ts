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

async function isSuperAdmin(userId: string): Promise<boolean> {
  // Check admin_memberships table for admin role
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
      return new Response(JSON.stringify({ ok: false, error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) Parse payload
    const { request_id, admin_notes } = await req.json();
    
    if (!request_id) {
      return new Response(JSON.stringify({ ok: false, error: "Missing request_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3) Load request
    const { data: request, error: reqErr } = await supabaseAdmin
      .from("business_verification_requests")
      .select("*")
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

    const businessId = request.business_id;
    const now = new Date().toISOString();

    // 4) Update request to approved
    const { error: updReqErr } = await supabaseAdmin
      .from("business_verification_requests")
      .update({
        status: "approved",
        admin_note: admin_notes ?? null,
        reviewed_by: adminUserId,
        reviewed_at: now,
        updated_at: now,
      })
      .eq("id", request_id);

    if (updReqErr) {
      console.error("Failed to update request:", updReqErr);
      throw new Error("Failed to update request");
    }

    // 5) Update business to verified
    const { error: updBizErr } = await supabaseAdmin
      .from("business_accounts")
      .update({
        is_verified: true,
        verified_by: adminUserId,
        verified_at: now,
      })
      .eq("id", businessId);

    if (updBizErr) {
      console.error("Failed to verify business:", updBizErr);
      throw new Error("Failed to verify business");
    }

    console.log(`Business ${businessId} verified by admin ${adminUserId}`);

    // Fire-and-forget result email (best-effort; never block approval)
    supabaseAdmin.functions
      .invoke("send-business-verification-result-email", {
        body: { business_id: businessId, outcome: "approved", admin_note: admin_notes ?? null },
      })
      .catch((e) => console.error("[approve] result-email failed", e));

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
