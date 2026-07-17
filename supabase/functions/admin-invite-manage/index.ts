import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

import { corsFor } from '../_shared/cors.ts';
type Action =
  | "create_invite"
  | "list_invites"
  | "resend_invite"
  | "revoke_invite"
  | "revoke_bulk"
  | "accept_invite";

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
        status: 500, headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    // Caller (user) client
    const userClient = createClient(supabaseUrl, anon, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const {
      data: { user: actor },
      error: userErr,
    } = await userClient.auth.getUser();
    if (userErr || !actor) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    // Service client for privileged reads/writes
    const svc = createClient(supabaseUrl, svcKey);

    const body = await req.json().catch(() => ({}));
    const action: Action = body?.action;

    // Check admin status (except for accept_invite which has different auth)
    if (action !== "accept_invite") {
      const { data: mem } = await svc
        .from("admin_memberships")
        .select("role, expires_at")
        .eq("user_id", actor.id)
        .maybeSingle();

      const notExpired = !mem?.expires_at || new Date(mem.expires_at) > new Date();
      const actorRole = mem?.role && notExpired ? mem.role : "none";

      if (actorRole !== "full") {
        return new Response(JSON.stringify({ error: "Full admin required" }), {
          status: 403, headers: { ...headers, "Content-Type": "application/json" },
        });
      }
    }

    // Handle actions
    if (action === "create_invite") {
      const { email, invited_user_id, role, notes } = body;
      if (!role || !["limited", "full"].includes(role)) {
        return new Response(JSON.stringify({ error: "role (limited/full) required" }), {
          status: 400, headers: { ...headers, "Content-Type": "application/json" },
        });
      }
      if (!email && !invited_user_id) {
        return new Response(JSON.stringify({ error: "email or invited_user_id required" }), {
          status: 400, headers: { ...headers, "Content-Type": "application/json" },
        });
      }

      // If invited_user_id is supplied, block if the target is already an admin
      // or already has a pending invite.
      if (invited_user_id) {
        const { data: existing } = await svc
          .from("admin_memberships")
          .select("user_id")
          .eq("user_id", invited_user_id)
          .maybeSingle();
        if (existing) {
          return new Response(JSON.stringify({ error: "User is already an admin" }), {
            status: 409, headers: { ...headers, "Content-Type": "application/json" },
          });
        }

        const { data: pending } = await svc
          .from("admin_invitations")
          .select("id")
          .eq("invited_user_id", invited_user_id)
          .eq("status", "pending")
          .maybeSingle();
        if (pending) {
          return new Response(JSON.stringify({ error: "User already has a pending invite" }), {
            status: 409, headers: { ...headers, "Content-Type": "application/json" },
          });
        }
      }

      const token = crypto.randomUUID().replace(/-/g, '');
      const { data, error } = await svc.from("admin_invitations").insert({
        email: email ?? null,
        invited_user_id: invited_user_id ?? null,
        role,
        invited_by: actor.id,
        status: "pending",
        token,
        notes,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }).select().single();

      if (error) throw error;

      // Best-effort in-app notification for a user-targeted invite (mirrors the
      // legacy send-admin-invite behavior). Failure does not fail the invite.
      if (invited_user_id) {
        const { data: inviterProfile } = await svc
          .from("user_profiles")
          .select("display_name, username, profile_photo_url")
          .eq("id", actor.id)
          .maybeSingle();
        const inviterName =
          inviterProfile?.display_name || inviterProfile?.username || "An admin";
        const roleLabel = role === "full" ? "a Full Admin" : "a Limited Admin";

        const { error: notifError } = await svc.from("notifications").insert({
          user_id: invited_user_id,
          recipient_actor_type: "personal",
          recipient_actor_id: invited_user_id,
          actor_id: actor.id,
          type: "admin_invite",
          title: "Admin Invitation",
          message: `${inviterName} has invited you to join the Clbhouz admin team as ${roleLabel}.`,
          entity_type: "admin_invitation",
          entity_id: data.id,
          data: {
            invite_id: data.id,
            role,
            inviter_name: inviterName,
            inviter_avatar_url: inviterProfile?.profile_photo_url ?? null,
          },
        });
        if (notifError) {
          console.error("[admin-invite-manage] Notification error:", notifError);
        }
      }

      return new Response(JSON.stringify({ ok: true, invitation: data }), {
        status: 200, headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    if (action === "resend_invite") {
      const { id } = body;
      if (!id) {
        return new Response(JSON.stringify({ error: "id required" }), {
          status: 400, headers: { ...headers, "Content-Type": "application/json" },
        });
      }
      const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await svc.from("admin_invitations")
        .update({ expires_at: newExpiry, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true, invitation: data }), {
        status: 200, headers: { ...headers, "Content-Type": "application/json" },
      });
    }



    if (action === "list_invites") {
      const limit = Math.min(Number(body?.limit) || 50, 200);
      const offset = Number(body?.offset) || 0;

      const { data, error, count } = await svc
        .from("admin_invitations")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return new Response(JSON.stringify({ data, total: count }), {
        status: 200, headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    if (action === "revoke_invite") {
      const { id } = body;
      if (!id) {
        return new Response(JSON.stringify({ error: "id required" }), {
          status: 400, headers: { ...headers, "Content-Type": "application/json" },
        });
      }

      const { error } = await svc.from("admin_invitations").delete().eq("id", id);
      if (error) throw error;

      return new Response(JSON.stringify({ ok: true }), {
        status: 200, headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    if (action === "revoke_bulk") {
      const { ids } = body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return new Response(JSON.stringify({ error: "ids[] required" }), {
          status: 400, headers: { ...headers, "Content-Type": "application/json" },
        });
      }

      console.log(`[admin-invite-manage] Bulk revoking ${ids.length} invites by admin ${actor.id}`);

      const result = { success: [] as string[], failed: [] as { id: string; error: string }[] };

      for (const id of ids) {
        try {
          // Check if invite is revocable (not accepted)
          const { data: invite, error: fetchErr } = await svc
            .from("admin_invitations")
            .select("id, accepted_at")
            .eq("id", id)
            .single();

          if (fetchErr || !invite) {
            result.failed.push({ id, error: "Invite not found" });
            continue;
          }

          if (invite.accepted_at) {
            result.failed.push({ id, error: "Already accepted" });
            continue;
          }

          const { error: delErr } = await svc.from("admin_invitations").delete().eq("id", id);
          if (delErr) {
            result.failed.push({ id, error: delErr.message });
            continue;
          }

          result.success.push(id);
        } catch (err: any) {
          result.failed.push({ id, error: err.message || "Unknown error" });
        }
      }

      // Audit log
      const { error: auditErr } = await svc.from("admin_audit_log").insert({
        admin_user_id: actor.id,
        action: "invite_bulk_revoke",
        details: {
          total: ids.length,
          successCount: result.success.length,
          failCount: result.failed.length,
          ids: ids,
        },
      });
      if (auditErr) console.error("[admin-invite-manage] Audit error:", auditErr);

      // Notification
      const { error: notifErr } = await svc.from("admin_notifications").insert({
        type: "bulk_invites_revoked",
        title: "Bulk invites revoked",
        message: `Revoked ${result.success.length} invites${result.failed.length > 0 ? `, ${result.failed.length} failed` : ""}`,
        metadata: {
          successCount: result.success.length,
          failCount: result.failed.length,
        },
        audience: "full",
        link: "/admin/invites",
      });
      if (notifErr) console.error("[admin-invite-manage] Notification error:", notifErr);

      console.log(`[admin-invite-manage] Bulk revoke complete: ${result.success.length} succeeded, ${result.failed.length} failed`);

      return new Response(JSON.stringify(result), {
        status: 200, headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    if (action === "accept_invite") {
      const { token } = body;
      if (!token) {
        return new Response(JSON.stringify({ error: "token required" }), {
          status: 400, headers: { ...headers, "Content-Type": "application/json" },
        });
      }

      const { data: inv, error: invErr } = await svc
        .from("admin_invitations")
        .select("*")
        .eq("token", token)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (invErr || !inv) {
        return new Response(JSON.stringify({ error: "Invalid or expired invitation" }), {
          status: 404, headers: { ...headers, "Content-Type": "application/json" },
        });
      }

      if (inv.accepted_at) {
        return new Response(JSON.stringify({ error: "Invitation already accepted" }), {
          status: 400, headers: { ...headers, "Content-Type": "application/json" },
        });
      }

      // Grant role
      await svc.from("admin_memberships").upsert({
        user_id: actor.id,
        role: inv.role,
        granted_by: inv.invited_by,
        notes: `Accepted invitation: ${inv.email}`,
      }, { onConflict: "user_id" });

      // Mark as accepted
      await svc.from("admin_invitations")
        .update({ accepted_at: new Date().toISOString() })
        .eq("id", inv.id);

      return new Response(JSON.stringify({ ok: true, role: inv.role }), {
        status: 200, headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[admin-invite-manage] error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...cors(null), "Content-Type": "application/json" },
    });
  }
});
