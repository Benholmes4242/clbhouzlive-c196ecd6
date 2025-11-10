import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type Action =
  | "create_invite"
  | "list_invites"
  | "resend_invite"
  | "revoke_invite"
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
      const { email, role, notes } = body;
      if (!email || !role || !["limited", "full"].includes(role)) {
        return new Response(JSON.stringify({ error: "email and role (limited/full) required" }), {
          status: 400, headers: { ...headers, "Content-Type": "application/json" },
        });
      }

      const token = crypto.randomUUID().replace(/-/g, '');
      const { data, error } = await svc.from("admin_invitations").insert({
        email,
        role,
        invited_by: actor.id,
        token,
        notes,
      }).select().single();

      if (error) throw error;

      // TODO: Send email with invitation link
      // const inviteUrl = `https://www.clbhouz.co.uk/admin/invite-accept?token=${token}`;

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
