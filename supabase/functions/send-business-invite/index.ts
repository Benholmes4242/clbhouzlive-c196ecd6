import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

import { corsFor } from '../_shared/cors.ts';
import { forbidden, resolveCaller, unauthorized } from '../_shared/callerAuth.ts';

const APP_URL = Deno.env.get("APP_URL") || "https://www.clbhouz.co.uk";

interface Payload {
  inviteId: string;
}

serve(async (req) => {
  const corsHeaders = corsFor(req.headers.get('Origin'));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { inviteId } = (await req.json()) as Payload;
    if (!inviteId) {
      return new Response(JSON.stringify({ error: "inviteId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: invite, error: inviteErr } = await supabase
      .from("business_invites")
      .select("id, business_id, invited_by, invitee_email, invitee_user_id, role, status, token, expires_at")
      .eq("id", inviteId)
      .maybeSingle();

    if (inviteErr) throw inviteErr;
    if (!invite) throw new Error("Invite not found");
    if (invite.status !== "pending") {
      return new Response(JSON.stringify({ success: true, skipped: "not_pending" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve destination email — either the raw invitee_email or the linked user's auth email
    let toEmail = invite.invitee_email as string | null;
    if (!toEmail && invite.invitee_user_id) {
      const { data: authUser } = await supabase.auth.admin.getUserById(invite.invitee_user_id);
      toEmail = authUser?.user?.email ?? null;
    }
    if (!toEmail) {
      return new Response(JSON.stringify({ success: true, skipped: "no_email" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: business } = await supabase
      .from("business_accounts")
      .select("name, logo_url, slug")
      .eq("id", invite.business_id)
      .maybeSingle();

    const { data: inviter } = await supabase
      .from("user_profiles")
      .select("display_name, username")
      .eq("id", invite.invited_by)
      .maybeSingle();

    let inviterEmail: string | null = null;
    try {
      const { data: inviterAuth } = await supabase.auth.admin.getUserById(invite.invited_by);
      inviterEmail = inviterAuth?.user?.email ?? null;
    } catch { /* noop */ }

    const businessName = business?.name || "a business";
    const inviterName = inviter?.display_name || inviter?.username || "A teammate";
    const roleLabel = ({ owner: "Owner", admin: "Admin", editor: "Editor", analyst: "Analyst" } as Record<string, string>)[invite.role] || invite.role;
    const acceptUrl = `${APP_URL}/business/invite/accept?token=${encodeURIComponent(invite.token || "")}`;

    const subject = `You've been invited to join ${businessName} on clbhouz`;
    const text = `${inviterName} invited you to join ${businessName} on clbhouz as ${roleLabel}.\n\nAccept the invite: ${acceptUrl}\n\nThis link expires on ${new Date(invite.expires_at).toDateString()}.`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#F4F6F8; margin:0; padding:24px; color:#0F172A; }
    .wrap { max-width: 520px; margin: 0 auto; background:#FFFFFF; border:1px solid rgba(15,23,42,0.08); border-radius:16px; overflow:hidden; }
    .header { padding:24px; text-align:center; border-bottom:1px solid rgba(15,23,42,0.06); }
    .logo { width:56px; height:56px; border-radius:18px; object-fit:cover; }
    .body { padding:24px; line-height:1.55; font-size:14.5px; }
    .cta { display:inline-block; margin:18px 0 6px; padding:12px 22px; background:#0F172A; color:#FFF !important; text-decoration:none; border-radius:12px; font-weight:600; }
    .muted { color:#64748B; font-size:12px; margin-top:20px; }
    .role { display:inline-block; padding:2px 10px; border-radius:999px; background:rgba(247,147,30,0.10); color:#B4650C; font-weight:600; font-size:12px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      ${business?.logo_url ? `<img src="${business.logo_url}" class="logo" alt="${businessName}" />` : ''}
      <h2 style="margin:12px 0 0; font-size:19px; letter-spacing:-0.01em;">You're invited</h2>
    </div>
    <div class="body">
      <p><strong>${inviterName}</strong> invited you to join <strong>${businessName}</strong> on clbhouz as <span class="role">${roleLabel}</span>.</p>
      <p>Tap the button below to accept and join the team.</p>
      <p style="text-align:center;"><a href="${acceptUrl}" class="cta">Accept invite</a></p>
      <p class="muted">This link expires on ${new Date(invite.expires_at).toDateString()}. If you didn't expect this, you can ignore this email.</p>
    </div>
  </div>
</body>
</html>`.trim();

    if (resendApiKey) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "clbhouz <noreply@clbhouz.co.uk>",
          to: toEmail,
          subject,
          text,
          html,
          reply_to: inviterEmail || undefined,
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error("[send-business-invite] resend failed", res.status, errText);
        return new Response(JSON.stringify({ success: false, error: errText }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      console.log("[send-business-invite] RESEND_API_KEY missing, skipping send.");
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[send-business-invite]", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
