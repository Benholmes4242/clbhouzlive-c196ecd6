// supabase/functions/create-whs-invite/index.ts
// Generates a whs_invites row for a specific EG friend.
// Returns invite_code, share URL, and pre-formatted share message.
// FIXED: added CORS handling (OPTIONS preflight + headers on all responses).

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface CreateInviteRequest {
  invitee_passport_id: number;
  share_method?: "sms" | "email" | "whatsapp" | "copy_link" | "other" | "friend_sheet";
}

const SHARE_BASE_URL = "https://clbhouz.co.uk/i/";

function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

async function getAuthenticatedUser(req: Request): Promise<{ id: string; firstName: string | null } | null> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const userJwt = auth.slice(7);
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: `Bearer ${userJwt}` } } },
  );
  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) return null;
  const meta = data.user.user_metadata as Record<string, unknown> | null;
  const username = (meta?.username as string | undefined) ?? null;
  return { id: data.user.id, firstName: username };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ ok: false, error_code: "internal_error", message: "POST only" }, 405);
  }

  const user = await getAuthenticatedUser(req);
  if (!user) {
    return json({ ok: false, error_code: "not_authenticated", message: "Sign in first" }, 401);
  }

  let body: CreateInviteRequest;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error_code: "internal_error", message: "Invalid JSON" }, 400);
  }
  if (!body.invitee_passport_id) {
    return json({ ok: false, error_code: "internal_error", message: "invitee_passport_id required" }, 400);
  }

  const admin = adminClient();

  const { data: conn } = await admin
    .from("whs_connections")
    .select("id")
    .eq("user_id", user.id)
    .eq("provider", "england_golf")
    .maybeSingle();
  if (!conn) {
    return json({ ok: false, error_code: "no_connection", message: "Connect England Golf first" }, 400);
  }

  const { data: friend } = await admin
    .from("whs_friends")
    .select("friend_passport_id, friend_name, friend_home_club")
    .eq("connection_id", conn.id)
    .eq("friend_passport_id", body.invitee_passport_id)
    .maybeSingle();
  if (!friend) {
    return json({ ok: false, error_code: "friend_not_found", message: "Not in your friends list" }, 404);
  }

  const { data: existing } = await admin
    .from("whs_invites")
    .select("id, invite_code, sent_at")
    .eq("inviter_user_id", user.id)
    .eq("invitee_passport_id", body.invitee_passport_id)
    .is("redeemed_at", null)
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let inviteCode: string;
  let inviteId: string;

  if (existing && (Date.now() - new Date(existing.sent_at).getTime()) < 30 * 86400_000) {
    inviteCode = existing.invite_code;
    inviteId = existing.id;
  } else {
    const { data: codeData, error: codeErr } = await admin.rpc("generate_whs_invite_code");
    if (codeErr || !codeData) {
      console.error("[create-whs-invite] code gen failed:", codeErr);
      return json({ ok: false, error_code: "internal_error", message: "Couldn't generate invite code" }, 500);
    }
    inviteCode = codeData as string;

    const { data: inserted, error: insertErr } = await admin
      .from("whs_invites")
      .insert({
        inviter_user_id: user.id,
        inviter_connection_id: conn.id,
        invitee_passport_id: body.invitee_passport_id,
        invitee_name: friend.friend_name,
        invitee_home_club: friend.friend_home_club,
        invite_code: inviteCode,
        share_method: body.share_method ?? null,
      })
      .select("id")
      .single();

    if (insertErr || !inserted) {
      console.error("[create-whs-invite] invite insert failed:", insertErr);
      return json({ ok: false, error_code: "internal_error", message: "Couldn't create invite" }, 500);
    }
    inviteId = inserted.id;
  }

  const shareUrl = `${SHARE_BASE_URL}${inviteCode}`;
  const inviterFirstName = user.firstName ?? "your friend";
  const inviteeFirstName = friend.friend_name.split(",").pop()?.trim().split(" ")[0] ?? friend.friend_name;
  const shareMessage =
    `Hi ${inviteeFirstName} — ${inviterFirstName} invited you to Clbhouz, the new social home for golf. ` +
    `Connect your England Golf handicap and we can compare rounds. Tap: ${shareUrl}`;

  return json({
    ok: true,
    invite_id: inviteId,
    invite_code: inviteCode,
    share_url: shareUrl,
    share_message: shareMessage,
    invitee_name: friend.friend_name,
  });
});