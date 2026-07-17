import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

import { corsFor } from '../_shared/cors.ts';
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

const CATEGORY_LABELS: Record<string, string> = {
  bug: "Bug",
  account: "Account",
  handicap: "Handicap / WHS",
  billing: "Billing",
  report: "Report a problem",
  other: "Other",
};

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

    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = userData.user.id;

    const { ticketId } = (await req.json().catch(() => ({}))) as { ticketId?: string };
    if (!ticketId) {
      return new Response(JSON.stringify({ ok: false, error: "Missing ticketId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch ticket
    const { data: ticket, error: ticketErr } = await supabaseAdmin
      .from("support_tickets")
      .select("id, user_id, category, subject, created_at")
      .eq("id", ticketId)
      .maybeSingle();

    if (ticketErr || !ticket) {
      return new Response(JSON.stringify({ ok: false, error: "Ticket not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (ticket.user_id !== callerId) {
      return new Response(JSON.stringify({ ok: false, error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: firstMsg } = await supabaseAdmin
      .from("support_messages")
      .select("body, created_at")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("display_name, username")
      .eq("user_id", ticket.user_id)
      .maybeSingle();

    const email = userData.user.email ?? "(unknown)";
    const displayName =
      (profile as any)?.display_name || (profile as any)?.username || email;

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.warn("RESEND_API_KEY not set; skipping email");
      return new Response(JSON.stringify({ ok: true, emailed: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const categoryLabel = CATEGORY_LABELS[ticket.category] ?? ticket.category;
    const bodyText = firstMsg?.body ?? "(no message body)";
    const adminUrl = `https://www.clbhouz.co.uk/admin-v2/support?ticket=${ticket.id}`;

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0F172A;max-width:640px;">
        <h2 style="margin:0 0 12px 0;font-size:18px;">New support ticket</h2>
        <table style="border-collapse:collapse;font-size:14px;line-height:1.6;">
          <tr><td style="color:#64748B;padding-right:12px;">From</td><td>${escapeHtml(displayName)} &lt;${escapeHtml(email)}&gt;</td></tr>
          <tr><td style="color:#64748B;padding-right:12px;">Category</td><td>${escapeHtml(categoryLabel)}</td></tr>
          <tr><td style="color:#64748B;padding-right:12px;">Subject</td><td><strong>${escapeHtml(ticket.subject)}</strong></td></tr>
          <tr><td style="color:#64748B;padding-right:12px;">Ticket ID</td><td>${escapeHtml(ticket.id)}</td></tr>
        </table>
        <hr style="border:none;border-top:1px solid #E2E8F0;margin:16px 0;" />
        <div style="font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(bodyText)}</div>
        <hr style="border:none;border-top:1px solid #E2E8F0;margin:16px 0;" />
        <p style="font-size:13px;color:#64748B;margin:0;">
          View in admin: <a href="${adminUrl}" style="color:#0F172A;">${adminUrl}</a>
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
          to: ["support@clbhouz.co.uk"],
          reply_to: email,
          subject: `New support ticket [${categoryLabel}] - ${ticket.subject}`,
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
    console.error("support-ticket-notify error", e);
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
