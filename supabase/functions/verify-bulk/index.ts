import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

import { corsFor } from '../_shared/cors.ts';
const ALLOWED_ORIGINS = new Set([
  "https://clbhouz.com",
  "https://www.clbhouz.com",
  "https://www.clbhouz.co.uk",
  "https://app.clbhouz.co.uk",
  "https://admin.clbhouz.co.uk",
  "http://localhost:3000",
  "http://localhost:5173",
]);

const cors = (origin: string | null): HeadersInit => {
  const allowOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
};

type Action = "approve" | "reject";
type EntityType = "business" | "golfer";

interface BulkResult {
  success: string[];
  failed: { id: string; error: string }[];
}

serve(async (req: Request) => {
  const corsHeaders = corsFor(req.headers.get('Origin'));
  const headers = cors(req.headers.get("Origin"));

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const svcKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anon || !svcKey) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    // Authenticate caller
    const userClient = createClient(supabaseUrl, anon, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user: actor }, error: userErr } = await userClient.auth.getUser();

    if (userErr || !actor) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    // Service client for privileged operations
    const svc = createClient(supabaseUrl, svcKey);

    // Check admin status
    const { data: mem } = await svc
      .from("admin_memberships")
      .select("role, expires_at")
      .eq("user_id", actor.id)
      .maybeSingle();

    const notExpired = !mem?.expires_at || new Date(mem.expires_at) > new Date();
    const isAdmin = mem?.role && notExpired;

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { action, entity_type, ids, reason } = body as {
      action: Action;
      entity_type: EntityType;
      ids: string[];
      reason?: string;
    };

    if (!action || !entity_type || !Array.isArray(ids) || ids.length === 0) {
      return new Response(JSON.stringify({ error: "action, entity_type, and ids[] required" }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    if (!["approve", "reject"].includes(action)) {
      return new Response(JSON.stringify({ error: "action must be 'approve' or 'reject'" }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    if (!["business", "golfer"].includes(entity_type)) {
      return new Response(JSON.stringify({ error: "entity_type must be 'business' or 'golfer'" }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    console.log(`[verify-bulk] Admin ${actor.id} performing bulk ${action} on ${ids.length} ${entity_type} requests`);

    const result: BulkResult = { success: [], failed: [] };
    const now = new Date().toISOString();

    // Process each request
    for (const id of ids) {
      try {
        if (entity_type === "business") {
          // Fetch the request
          const { data: request, error: fetchErr } = await svc
            .from("business_verification_requests")
            .select("id, business_id, status")
            .eq("id", id)
            .single();

          if (fetchErr || !request) {
            result.failed.push({ id, error: "Request not found" });
            continue;
          }

          if (request.status !== "pending") {
            result.failed.push({ id, error: "Request is not pending" });
            continue;
          }

          if (action === "approve") {
            // Update request to approved
            const { error: reqErr } = await svc
              .from("business_verification_requests")
              .update({
                status: "approved",
                reviewed_by: actor.id,
                reviewed_at: now,
                admin_note: "Bulk approved",
                approval_count: 2, // Force to threshold
              })
              .eq("id", id);

            if (reqErr) {
              result.failed.push({ id, error: reqErr.message });
              continue;
            }

            // Set business as verified
            const { error: bizErr } = await svc
              .from("business_accounts")
              .update({
                is_verified: true,
                verified_by: actor.id,
                verified_at: now,
              })
              .eq("id", request.business_id);

            if (bizErr) {
              result.failed.push({ id, error: bizErr.message });
              continue;
            }
          } else {
            // Reject
            const { error: reqErr } = await svc
              .from("business_verification_requests")
              .update({
                status: "rejected",
                reviewed_by: actor.id,
                reviewed_at: now,
                admin_note: reason || "Bulk rejected",
              })
              .eq("id", id);

            if (reqErr) {
              result.failed.push({ id, error: reqErr.message });
              continue;
            }
          }

          result.success.push(id);

        } else if (entity_type === "golfer") {
          // Fetch the request
          const { data: request, error: fetchErr } = await svc
            .from("golfer_verification_requests")
            .select("id, user_id, status")
            .eq("id", id)
            .single();

          if (fetchErr || !request) {
            result.failed.push({ id, error: "Request not found" });
            continue;
          }

          if (request.status !== "pending") {
            result.failed.push({ id, error: "Request is not pending" });
            continue;
          }

          if (action === "approve") {
            // Update request to approved
            const { error: reqErr } = await svc
              .from("golfer_verification_requests")
              .update({
                status: "approved",
                reviewed_at: now,
                admin_note: "Bulk approved",
                approval_count: 2, // Force to threshold
              })
              .eq("id", id);

            if (reqErr) {
              result.failed.push({ id, error: reqErr.message });
              continue;
            }

            // Set user as verified golfer
            const { error: userErr } = await svc
              .from("user_profiles")
              .update({
                is_verified_golfer: true,
              })
              .eq("id", request.user_id);

            if (userErr) {
              result.failed.push({ id, error: userErr.message });
              continue;
            }
          } else {
            // Reject
            const { error: reqErr } = await svc
              .from("golfer_verification_requests")
              .update({
                status: "rejected",
                reviewed_at: now,
                admin_note: reason || "Bulk rejected",
              })
              .eq("id", id);

            if (reqErr) {
              result.failed.push({ id, error: reqErr.message });
              continue;
            }
          }

          result.success.push(id);
        }
      } catch (err: any) {
        console.error(`[verify-bulk] Error processing ${id}:`, err);
        result.failed.push({ id, error: err.message || "Unknown error" });
      }
    }

    // Log audit entry
    const actionType = `verify_${entity_type}_bulk_${action}`;
    const { error: auditErr } = await svc
      .from("admin_audit_log")
      .insert({
        admin_user_id: actor.id,
        action: actionType,
        details: {
          total: ids.length,
          successCount: result.success.length,
          failCount: result.failed.length,
          ids: ids,
          errorsSample: result.failed.slice(0, 5),
          reason: reason || null,
        },
      });

    if (auditErr) {
      console.error("[verify-bulk] Audit log error:", auditErr);
    }

    // Create notification
    const { error: notifErr } = await svc
      .from("admin_notifications")
      .insert({
        type: "bulk_verification_complete",
        title: "Bulk verification complete",
        message: `${action === "approve" ? "Approved" : "Rejected"} ${result.success.length} ${entity_type} requests${result.failed.length > 0 ? `, ${result.failed.length} failed` : ""}`,
        metadata: {
          action,
          entity_type,
          successCount: result.success.length,
          failCount: result.failed.length,
        },
        audience: "all",
        link: "/admin/verification",
      });

    if (notifErr) {
      console.error("[verify-bulk] Notification error:", notifErr);
    }

    console.log(`[verify-bulk] Complete: ${result.success.length} succeeded, ${result.failed.length} failed`);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...headers, "Content-Type": "application/json" },
    });

  } catch (e: any) {
    console.error("[verify-bulk] Error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...cors(null), "Content-Type": "application/json" },
    });
  }
});
