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

serve(async (req) => {
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

    if (!admin_notes || String(admin_notes).trim().length < 3) {
      return new Response(JSON.stringify({ ok: false, error: "admin_notes required (min 3 characters)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const { error: rpcErr } = await supabaseUser.rpc("reject_business_verification", {
      _request_id: request_id,
      _admin_note: admin_notes,
    });

    if (rpcErr) {
      console.error("reject_business_verification RPC failed:", rpcErr);
      throw new Error(rpcErr.message || "Failed to reject request");
    }

    console.log(`Request ${request_id} rejected by admin ${adminUserId}`);

    supabaseAdmin.functions
      .invoke("send-business-verification-result-email", {
        body: { business_id: request.business_id, outcome: "rejected", admin_note: admin_notes },
      })
      .catch((e) => console.error("[reject] result-email failed", e));

    // Best-effort in-app notification for the business owner
    try {
      const { data: ownerRow } = await supabaseAdmin
        .from("business_members")
        .select("user_profile_id")
        .eq("business_id", request.business_id)
        .eq("role", "owner")
        .limit(1)
        .maybeSingle();
      const ownerId = ownerRow?.user_profile_id;
      if (ownerId) {
        const { data: biz } = await supabaseAdmin
          .from("business_accounts")
          .select("name, logo_url")
          .eq("id", request.business_id)
          .single();
        const businessName = biz?.name ?? "your business";
        await supabaseAdmin.from("notifications").insert({
          user_id: ownerId,
          recipient_actor_type: "personal",
          recipient_actor_id: ownerId,
          actor_id: adminUserId,
          type: "business_verification_update",
          title: "Verification update",
          message: `Your verification for ${businessName} wasn't approved. Tap to see why and reapply.`,
          entity_type: "business",
          entity_id: request.business_id,
          data: {
            business_id: request.business_id,
            business_name: biz?.name ?? null,
            business_avatar_url: biz?.logo_url ?? null,
            outcome: "rejected",
            admin_note: admin_notes ?? null,
          },
        });
      }
    } catch (e) {
      console.error("[reject] in-app notification failed", e);
    }


    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e: any) {
    console.error("Reject error:", e);
    return new Response(
      JSON.stringify({ ok: false, error: e?.message ?? String(e) }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
