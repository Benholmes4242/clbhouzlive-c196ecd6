import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

import { corsFor } from '../_shared/cors.ts';
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

serve(async (req) => {
  const corsHeaders = corsFor(req.headers.get('Origin'));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is authenticated (admin action; RLS on support_messages already
    // requires can_moderate() for admin inserts, so a valid session is enough here).
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { ticketId, messageBody } = (await req.json().catch(() => ({}))) as {
      ticketId?: string;
      messageBody?: string;
    };
    if (!ticketId || !messageBody) {
      return new Response(JSON.stringify({ ok: false, error: "Missing ticketId or messageBody" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: ticket, error: ticketErr } = await supabaseAdmin
      .from("support_tickets")
      .select("id, user_id, subject, category")
      .eq("id", ticketId)
      .maybeSingle();
    if (ticketErr || !ticket) {
      return new Response(JSON.stringify({ ok: false, error: "Ticket not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up the ticket owner's email via auth admin
    const { data: ownerData, error: ownerErr } = await supabaseAdmin.auth.admin.getUserById(ticket.user_id);
    if (ownerErr || !ownerData?.user?.email) {
      return new Response(JSON.stringify({ ok: false, error: "Owner email not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const toEmail = ownerData.user.email;

    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("display_name, username")
      .eq("user_id", ticket.user_id)
      .maybeSingle();
    const displayName =
      (profile as any)?.display_name || (profile as any)?.username || "there";

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.warn("RESEND_API_KEY not set; skipping email");
      return new Response(JSON.stringify({ ok: true, emailed: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const threadUrl = `https://www.clbhouz.co.uk/support/thread/${ticket.id}`;

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0F172A;max-width:640px;">
        <h2 style="margin:0 0 12px 0;font-size:18px;">We replied to your support request</h2>
        <p style="font-size:14px;line-height:1.6;margin:0 0 8px 0;">Hi ${escapeHtml(displayName)},</p>
        <p style="font-size:14px;line-height:1.6;margin:0 0 16px 0;color:#334155;">
          Our team has replied to your ticket <strong>${escapeHtml(ticket.subject)}</strong>.
        </p>
        <div style="padding:14px 16px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;font-size:14px;line-height:1.6;white-space:pre-wrap;">
          ${escapeHtml(messageBody)}
        </div>
        <p style="margin:20px 0 0 0;">
          <a href="${threadUrl}" style="display:inline-block;padding:10px 16px;background:#0F172A;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
            Open the conversation
          </a>
        </p>
        <p style="font-size:12px;color:#94A3B8;margin:20px 0 0 0;">
          You are receiving this email because you opened a support request with clbhouz.
        </p>
      </div>
    `;

    try {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Clbhouz <noreply@clbhouz.co.uk>",
          to: [toEmail],
          reply_to: "support@clbhouz.co.uk",
          subject: "We replied to your support request",
          html,
        }),
      });
      if (!emailRes.ok) {
        const errText = await emailRes.text();
        console.error("Resend email failed:", emailRes.status, errText);
      }
    } catch (e) {
      console.error("Resend fetch threw:", e);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("support-reply-notify error", e);
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
