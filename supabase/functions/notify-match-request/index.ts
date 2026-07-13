import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface Payload {
  user_email?: string;
  user_name?: string;
  course_name: string;
  whs_course_name?: string;
  course_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json().catch(() => ({}))) as Partial<Payload>;
    if (!body.course_name || !body.course_id) {
      return new Response(JSON.stringify({ ok: false, error: "Missing course_name or course_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.warn("RESEND_API_KEY not set; skipping email");
      return new Response(JSON.stringify({ ok: true, emailed: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userLabel = body.user_name && body.user_email
      ? `${body.user_name} <${body.user_email}>`
      : body.user_email || body.user_name || "(unknown user)";

    const whsLine = body.whs_course_name
      ? `Their WHS record calls it: "${body.whs_course_name}"`
      : "(no WHS name provided)";

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0F172A;max-width:640px;">
        <h2 style="margin:0 0 12px 0;font-size:18px;">WHS course match request</h2>
        <table style="border-collapse:collapse;font-size:14px;line-height:1.6;">
          <tr><td style="color:#64748B;padding-right:12px;">Requester</td><td>${escapeHtml(userLabel)}</td></tr>
          <tr><td style="color:#64748B;padding-right:12px;">Our course</td><td><strong>${escapeHtml(body.course_name)}</strong></td></tr>
          <tr><td style="color:#64748B;padding-right:12px;">Course ID</td><td><code>${escapeHtml(body.course_id)}</code></td></tr>
          <tr><td style="color:#64748B;padding-right:12px;">WHS name</td><td>${escapeHtml(whsLine)}</td></tr>
        </table>
        <hr style="border:none;border-top:1px solid #E2E8F0;margin:16px 0;" />
        <p style="font-size:13px;color:#64748B;margin:0;">
          Resolve: insert into whs_course_aliases and mark the request matched in the admin console.
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
          reply_to: body.user_email || undefined,
          subject: `WHS course match request: ${body.course_name}`,
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
    console.error("notify-match-request error", e);
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
