import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsFor } from '../_shared/cors.ts';
serve(async (req) => {
  const corsHeaders = corsFor(req.headers.get('Origin'));
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the user from the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the user's JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch (_e) {
      body = {};
    }

    const request_id = body?.request_id;
    const decisionRaw = body?.decision;
    const decisionInput = typeof decisionRaw === "string" ? decisionRaw.toLowerCase() : "";

    // Back-compat: older clients may send approved/declined
    const decision =
      decisionInput === "approved" ? "approve"
      : decisionInput === "declined" ? "decline"
      : decisionInput;

    if (!request_id || !decision) {
      return new Response(JSON.stringify({ error: "Missing request_id or decision" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["approve", "decline"].includes(decision)) {
      return new Response(JSON.stringify({ error: "Invalid decision" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing decision: ${decision} for request: ${request_id} by user: ${user.id}`);

    // Load the request
    const { data: request, error: requestError } = await supabase
      .from("business_access_requests")
      .select(`
        *,
        business:business_accounts(id, name, logo_url),
        requester:user_profiles!business_access_requests_requester_user_profile_id_fkey(id, display_name, username, profile_photo_url)
      `)
      .eq("id", request_id)
      .single();

    if (requestError || !request) {
      console.error("Request not found:", requestError);
      return new Response(JSON.stringify({ error: "Request not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Idempotent: if already resolved, return success with current status
    if (request.status !== "pending") {
      console.log(`Request already ${request.status}`);
      return new Response(JSON.stringify({ 
        ok: true, 
        status: request.status, 
        already_resolved: true,
        business_id: request.business_id,
        requester_id: request.requester_user_profile_id
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check caller is allowed to decide (must be business admin/owner/manager)
    const { data: membership, error: membershipError } = await supabase
      .from("business_members")
      .select("role")
      .eq("business_id", request.business_id)
      .eq("user_profile_id", user.id)
      .single();

    if (membershipError || !membership) {
      console.error("Caller not a member:", membershipError);
      return new Response(JSON.stringify({ error: "You are not authorized to decide on this request" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const allowedRoles = ["owner", "admin", "primary_manager", "manager"];
    if (!allowedRoles.includes(membership.role)) {
      return new Response(JSON.stringify({ error: "Your role does not allow approving/declining requests" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date().toISOString();
    const statusToSet = decision === "approve" ? "approved" : "declined";

    // Auto-clear access-request notifications for ALL admin recipients when resolved
    // This marks "business_access_request" notifications as read for this specific request
    const { error: clearNotifError } = await supabase
      .from("notifications")
      // Both read-state columns (BRIEF §2): is_read is authoritative, `read`
      // is the abandoned twin and must not drift further.
      .update({ is_read: true, read: true })
      .eq("type", "business_access_request")
      .eq("entity_id", request.business_id)
      .contains("data", { request_id: request_id });

    if (clearNotifError) {
      console.warn("Failed to clear access request notifications:", clearNotifError);
      // Non-blocking - continue with the decision
    } else {
      console.log(`Marked access request notifications as read for request ${request_id}`);
    }

    if (decision === "approve") {
      // Update request status
      const { error: updateError } = await supabase
        .from("business_access_requests")
        .update({
          status: statusToSet,
          decided_at: now,
          decided_by: user.id,
        })
        .eq("id", request_id);

      if (updateError) {
        console.error("Failed to update request:", updateError);
        throw updateError;
      }

      // Map requested_role to business_team_members role (must match enum: owner/admin/director/coach/staff)
      const roleMap: Record<string, "admin" | "staff"> = {
        manager: "admin",
        team_member: "staff",
      };
      const memberRole = roleMap[request.requested_role] ?? "staff";

      console.log(`Adding ${request.requester_user_profile_id} to business_team_members with role: ${memberRole}`);

      // Insert into business_team_members (upsert to be idempotent)
      // This is the table that useBusinessTeamMembers queries for "Current Team"
      const { error: memberError } = await supabase
        .from("business_team_members")
        .upsert(
          {
            business_id: request.business_id,
            user_profile_id: request.requester_user_profile_id,
            role: memberRole,
            created_by: user.id, // The admin who approved the request
          },
          {
            onConflict: "business_id,user_profile_id",
          }
        );

      if (memberError) {
        console.error("Failed to add member to business_team_members:", memberError);
        throw memberError;
      }

      // Create notification for requester
      const { error: notifError } = await supabase
        .from("notifications")
        .insert({
          user_id: request.requester_user_profile_id,
          type: "business_access_approved",
          actor_id: user.id,
          entity_type: "business",
          entity_id: request.business_id,
          title: "Added to team",
          data: {
            business_id: request.business_id,
            business_name: request.business?.name,
            business_avatar_url: request.business?.logo_url,
            role_granted: request.requested_role === "manager" ? "Manager" : "Team member",
            request_id: request_id,
          },
        });

      if (notifError) {
        console.error("Failed to create notification:", notifError);
        // Don't throw - notification is secondary
      }

      console.log(
        `Approved request ${request_id}, added ${request.requester_user_profile_id} as ${memberRole}`
      );
    } else {
      // Declined
      const { error: updateError } = await supabase
        .from("business_access_requests")
        .update({
          status: statusToSet,
          decided_at: now,
          decided_by: user.id,
        })
        .eq("id", request_id);

      if (updateError) {
        console.error("Failed to update request:", updateError);
        throw updateError;
      }

      // Create notification for requester
      const { error: notifError } = await supabase
        .from("notifications")
        .insert({
          user_id: request.requester_user_profile_id,
          type: "business_access_declined",
          actor_id: user.id,
          entity_type: "business",
          entity_id: request.business_id,
          title: "Request declined",
          data: {
            business_id: request.business_id,
            business_name: request.business?.name,
            business_avatar_url: request.business?.logo_url,
            request_id: request_id,
          },
        });

      if (notifError) {
        console.error("Failed to create notification:", notifError);
      }

      console.log(`Declined request ${request_id}`);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        status: statusToSet,
        business_id: request.business_id,
        requester_id: request.requester_user_profile_id,
        requester_name:
          request.requester?.display_name || request.requester?.username || "User",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
