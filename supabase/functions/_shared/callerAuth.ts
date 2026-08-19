// Shared fail-closed caller identification for USER-FACING edge functions.
//
// Companion to internalAuth.ts (which guards cron/maintenance functions with a
// shared secret). Use this when the caller is a signed-in member.
//
// Why this exists: the Functions gateway no longer pre-validates legacy HS256
// JWTs, so `verify_jwt = false` is set on functions that validate in code. A
// function that self-validates MUST do it fail-closed, on every path, before it
// touches any data.
//
// getClaims() verifies the token against the project's published keys rather
// than round-tripping to the auth server, so it works under both the legacy
// shared secret and asymmetric signing keys.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

export interface Caller {
  id: string;
  email?: string;
  jwt: string;
}

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

/** Returns the authenticated caller, or null when the token is absent/invalid. */
export async function resolveCaller(req: Request): Promise<Caller | null> {
  const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const jwt = authHeader.slice(7).trim();
  if (!jwt) return null;

  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: `Bearer ${jwt}` } }, auth: { persistSession: false } },
  );

  try {
    const { data, error } = await client.auth.getClaims(jwt);
    const sub = data?.claims?.sub as string | undefined;
    if (error || !sub) return null;
    return { id: sub, email: (data?.claims?.email as string | undefined) ?? undefined, jwt };
  } catch (_) {
    return null;
  }
}

export function unauthorized(
  corsHeaders: Record<string, string>,
  message = "Unauthorized",
): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function forbidden(
  corsHeaders: Record<string, string>,
  message = "Forbidden",
): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 403,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Panel admin check, matching the admin_memberships pattern used elsewhere. */
export async function isPanelAdmin(userId: string): Promise<boolean> {
  const { data, error } = await admin()
    .from("admin_memberships")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.error("[callerAuth] admin check failed", error);
    return false;
  }
  return !!data && ["super_admin", "admin", "moderator"].includes(data.role as string);
}
