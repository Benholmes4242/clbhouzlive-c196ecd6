import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

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

const json = (body: unknown, status: number, headers: HeadersInit) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });

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
      return json({ error: "Server misconfigured" }, 500, headers);
    }

    const userClient = createClient(supabaseUrl, anon, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const {
      data: { user: actor },
      error: userErr,
    } = await userClient.auth.getUser();
    if (userErr || !actor) {
      return json({ error: "Unauthorized" }, 401, headers);
    }

    const svc = createClient(supabaseUrl, svcKey);

    const { data: mem } = await svc
      .from("admin_memberships")
      .select("role, expires_at")
      .eq("user_id", actor.id)
      .maybeSingle();

    const notExpired = !mem?.expires_at || new Date(mem.expires_at) > new Date();
    const actorRole = mem?.role && notExpired ? mem.role : "none";

    if (actorRole !== "full" && actorRole !== "limited") {
      return json({ error: "Admin required" }, 403, headers);
    }

    const body = await req.json().catch(() => ({}));
    const request_id: string | undefined = body?.request_id;
    const action: "match" | "reject" | undefined = body?.action;
    const whs_name_raw: string | undefined = body?.whs_name;

    if (!request_id || (action !== "match" && action !== "reject")) {
      return json({ error: "request_id and action (match|reject) required" }, 400, headers);
    }

    const { data: reqRow, error: reqErr } = await svc
      .from("whs_course_match_requests")
      .select("id, status, golf_course_id")
      .eq("id", request_id)
      .maybeSingle();

    if (reqErr) throw reqErr;
    if (!reqRow) return json({ error: "Request not found" }, 404, headers);
    if (reqRow.status !== "pending") {
      return json({ error: `Request is not pending (status: ${reqRow.status})` }, 409, headers);
    }

    const nowIso = new Date().toISOString();

    if (action === "match") {
      const whs_name = (whs_name_raw ?? "").trim();
      if (!whs_name) {
        return json({ error: "whs_name required" }, 400, headers);
      }

      const { error: aliasErr } = await svc.from("whs_course_aliases").insert({
        course_id: reqRow.golf_course_id,
        whs_name,
        whs_name_norm: whs_name.toLowerCase().trim(),
        match_method: "manual_request",
      } as any);

      if (aliasErr && !/duplicate key|unique constraint/i.test(aliasErr.message)) {
        return json({ error: `Alias insert failed: ${aliasErr.message}` }, 500, headers);
      }

      const { error: updErr } = await svc
        .from("whs_course_match_requests")
        .update({ status: "matched", resolved_at: nowIso })
        .eq("id", request_id);

      if (updErr) return json({ error: `Status update failed: ${updErr.message}` }, 500, headers);

      return json({ ok: true, status: "matched" }, 200, headers);
    }

    // reject
    const { error: updErr } = await svc
      .from("whs_course_match_requests")
      .update({ status: "rejected", resolved_at: nowIso })
      .eq("id", request_id);

    if (updErr) return json({ error: `Status update failed: ${updErr.message}` }, 500, headers);

    return json({ ok: true, status: "rejected" }, 200, headers);
  } catch (e) {
    console.error("[admin-resolve-match-request] error:", e);
    return json({ error: "Internal server error" }, 500, cors(null));
  }
});
