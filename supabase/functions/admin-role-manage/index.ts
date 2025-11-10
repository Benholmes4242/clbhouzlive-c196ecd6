import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type Role = "limited" | "full";
type Action =
  | "list_admins"
  | "grant_limited"
  | "grant_full"
  | "downgrade"
  | "revoke"
  | "set_expiry"
  | "clear_expiry"
  | "list_audit";

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

    // Caller (user) client – needed to resolve actor from JWT
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

    // Require FULL admin for all mutations & reads in this function
    const { data: mem } = await svc
      .from("admin_memberships")
      .select("role, expires_at")
      .eq("user_id", actor.id)
      .maybeSingle();

    const notExpired = !mem?.expires_at || new Date(mem.expires_at) > new Date();
    const actorRole: "none" | "limited" | "full" =
      mem?.role && notExpired ? (mem.role === "full" ? "full" : "limited") : "none";

    // Only FULL admins can use this endpoint
    if (actorRole !== "full") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const action: Action = body?.action;

    // Helpers
    const audit = async (
      target_user_id: string,
      action: string,
      notes?: string,
    ) => {
      await svc.from("admin_role_audit").insert({
        actor_user_id: actor.id,
        target_user_id,
        action,
        notes,
      });
    };

    const ensureUserId = (v: unknown): string => {
      if (!v || typeof v !== "string") throw new Error("Missing user_id");
      return v;
    };

    // Switch actions
    if (action === "list_admins") {
      const { data, error } = await svc
        .from("admin_memberships")
        .select("user_id, role, expires_at, created_at, updated_at, granted_by, notes");
      if (error) throw error;

      // (Optional) join basic user info
      const ids = data.map(d => d.user_id);
      const profiles = ids.length
        ? await svc.from("user_profiles")
            .select("id, display_name, username, home_club")
            .in("id", ids)
        : { data: [], error: null };

      return new Response(JSON.stringify({
        data,
        profiles: profiles.data ?? [],
      }), { status: 200, headers: { ...headers, "Content-Type": "application/json" } });
    }

    if (action === "list_audit") {
      const target = body?.target_user_id as string | undefined;
      const limit = Math.min(Number(body?.limit) || 50, 200);
      const q = svc.from("admin_role_audit")
        .select("id,actor_user_id,target_user_id,action,notes,created_at")
        .order("created_at", { ascending: false })
        .limit(limit);
      const { data, error } = target ? await q.eq("target_user_id", target) : await q;
      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        status: 200, headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    if (action === "grant_limited" || action === "grant_full") {
      const target = ensureUserId(body?.user_id);
      const role: Role = action === "grant_full" ? "full" : "limited";
      const expires_at: string | undefined = body?.expires_at;
      const notes: string | undefined = body?.notes;

      const { error } = await svc.from("admin_memberships").upsert({
        user_id: target,
        role, expires_at: expires_at ?? null,
        granted_by: actor.id,
        notes: notes ?? null,
      }, { onConflict: "user_id" });
      if (error) throw error;

      await audit(target, action, notes);
      return new Response(JSON.stringify({ ok: true }), {
        status: 200, headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    if (action === "downgrade") {
      const target = ensureUserId(body?.user_id);
      const notes: string | undefined = body?.notes;

      // Prevent downgrading the last full admin
      const { count } = await svc
        .from("admin_memberships")
        .select("user_id", { count: "exact", head: true })
        .eq("role", "full");

      if ((count || 0) <= 1) {
        return new Response(JSON.stringify({ error: "Cannot downgrade the last full admin" }), {
          status: 403, headers: { ...headers, "Content-Type": "application/json" },
        });
      }

      const { error } = await svc.from("admin_memberships")
        .update({ role: "limited", notes: notes ?? null })
        .eq("user_id", target);
      if (error) throw error;

      await audit(target, "downgrade", notes);
      return new Response(JSON.stringify({ ok: true }), {
        status: 200, headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    if (action === "revoke") {
      const target = ensureUserId(body?.user_id);
      const notes: string | undefined = body?.notes;

      // Prevent revoking the last full admin
      const { count } = await svc
        .from("admin_memberships")
        .select("user_id", { count: "exact", head: true })
        .eq("role", "full");

      if ((count || 0) <= 1) {
        return new Response(JSON.stringify({ error: "Cannot revoke the last full admin" }), {
          status: 403, headers: { ...headers, "Content-Type": "application/json" },
        });
      }

      const { error } = await svc.from("admin_memberships").delete().eq("user_id", target);
      if (error) throw error;

      await audit(target, "revoke", notes);
      return new Response(JSON.stringify({ ok: true }), {
        status: 200, headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    // Bulk operations
    if (action === "grant_limited_bulk" || action === "grant_full_bulk") {
      const user_ids = body?.user_ids as string[] | undefined;
      const notes: string | undefined = body?.notes;
      const expires_at: string | undefined = body?.expires_at;
      
      if (!Array.isArray(user_ids) || user_ids.length === 0) {
        return new Response(JSON.stringify({ error: "user_ids array required" }), {
          status: 400, headers: { ...headers, "Content-Type": "application/json" },
        });
      }

      const role: Role = action === "grant_full_bulk" ? "full" : "limited";
      const rows = user_ids.map(user_id => ({
        user_id,
        role,
        expires_at: expires_at ?? null,
        granted_by: actor.id,
        notes: notes ?? null,
      }));

      const { error } = await svc.from("admin_memberships").upsert(rows, { onConflict: "user_id" });
      if (error) throw error;

      // Log bulk audit entry
      await svc.from("admin_role_audit").insert({
        actor_user_id: actor.id,
        target_user_id: user_ids[0], // Use first ID as representative
        action: action,
        notes: `Bulk operation: ${user_ids.length} users. ${notes || ''}`,
      });

      return new Response(JSON.stringify({ ok: true, count: user_ids.length }), {
        status: 200, headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    if (action === "downgrade_bulk") {
      const user_ids = body?.user_ids as string[] | undefined;
      const notes: string | undefined = body?.notes;

      if (!Array.isArray(user_ids) || user_ids.length === 0) {
        return new Response(JSON.stringify({ error: "user_ids array required" }), {
          status: 400, headers: { ...headers, "Content-Type": "application/json" },
        });
      }

      // Prevent downgrading if it would leave no full admins
      const { count } = await svc
        .from("admin_memberships")
        .select("user_id", { count: "exact", head: true })
        .eq("role", "full")
        .not("user_id", "in", `(${user_ids.join(',')})`);

      if ((count || 0) === 0) {
        return new Response(JSON.stringify({ error: "Cannot downgrade - would remove all full admins" }), {
          status: 403, headers: { ...headers, "Content-Type": "application/json" },
        });
      }

      const { error } = await svc.from("admin_memberships")
        .update({ role: "limited", notes: notes ?? null })
        .in("user_id", user_ids);
      if (error) throw error;

      await svc.from("admin_role_audit").insert({
        actor_user_id: actor.id,
        target_user_id: user_ids[0],
        action: "downgrade_bulk",
        notes: `Bulk operation: ${user_ids.length} users. ${notes || ''}`,
      });

      return new Response(JSON.stringify({ ok: true, count: user_ids.length }), {
        status: 200, headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    if (action === "revoke_bulk") {
      const user_ids = body?.user_ids as string[] | undefined;
      const notes: string | undefined = body?.notes;

      if (!Array.isArray(user_ids) || user_ids.length === 0) {
        return new Response(JSON.stringify({ error: "user_ids array required" }), {
          status: 400, headers: { ...headers, "Content-Type": "application/json" },
        });
      }

      // Prevent revoking if it would leave no full admins
      const { count } = await svc
        .from("admin_memberships")
        .select("user_id", { count: "exact", head: true })
        .eq("role", "full")
        .not("user_id", "in", `(${user_ids.join(',')})`);

      if ((count || 0) === 0) {
        return new Response(JSON.stringify({ error: "Cannot revoke - would remove all full admins" }), {
          status: 403, headers: { ...headers, "Content-Type": "application/json" },
        });
      }

      const { error } = await svc.from("admin_memberships").delete().in("user_id", user_ids);
      if (error) throw error;

      await svc.from("admin_role_audit").insert({
        actor_user_id: actor.id,
        target_user_id: user_ids[0],
        action: "revoke_bulk",
        notes: `Bulk operation: ${user_ids.length} users. ${notes || ''}`,
      });

      return new Response(JSON.stringify({ ok: true, count: user_ids.length }), {
        status: 200, headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    if (action === "set_expiry" || action === "clear_expiry") {
      const target = ensureUserId(body?.user_id);
      const expires_at: string | undefined = body?.expires_at;
      const notes: string | undefined = body?.notes;

      const newExpiry = action === "clear_expiry" ? null : expires_at ?? null;
      const { error } = await svc.from("admin_memberships")
        .update({ expires_at: newExpiry, notes: notes ?? null })
        .eq("user_id", target);
      if (error) throw error;

      await audit(target, action, notes);
      return new Response(JSON.stringify({ ok: true }), {
        status: 200, headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[admin-role-manage] error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...cors(null), "Content-Type": "application/json" },
    });
  }
});
