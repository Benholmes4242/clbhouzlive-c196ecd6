import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

type Outcome = "approved" | "rejected" | "needs_more_info";

interface Payload {
  business_id: string;
  outcome: Outcome;
  admin_note?: string | null;
}

async function resolveOwnerEmail(businessId: string): Promise<string | null> {
  const { data: members } = await supabaseAdmin
    .from("business_members")
    .select("user_id, role")
    .eq("business_id", businessId);

  const owner = (members ?? []).find((m: any) => m.role === "owner") ?? (members ?? [])[0];
  if (owner?.user_id) {
    try {
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(owner.user_id);
      if (u?.user?.email) return u.user.email;
    } catch (_) {}
    const { data: p } = await supabaseAdmin
      .from("user_profiles")
      .select("email")
      .eq("id", owner.user_id)
      .maybeSingle();
    if (p?.email) return (p.email as string) ?? null;
  }
  return null;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function shell(inner: string) {
  return `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#0f172a;background:#f8fafc;margin:0;padding:24px;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
      <div style="background:#0f172a;color:#fff;padding:18px 22px;font-weight:700;">Clbhouz</div>
      <div style="padding:22px;">
        ${inner}
        <p style="margin-top:24px;color:#64748b;font-size:12px;">This is an automated message from Clbhouz.</p>
      </div>
    </div>
    <style>.cta{display:inline-block;background:#0f172a;color:#fff!important;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600;}</style>
  </body></html>`;
}

function renderEmail(opts: { outcome: Outcome; businessName: string; adminNote?: string | null; profileUrl: string }) {
  const { outcome, businessName, adminNote, profileUrl } = opts;
  if (outcome === "approved") {
    return {
      subject: `Your course claim was approved — ${businessName}`,
      text: `Your course claim for ${businessName} has been approved. It's now linked on Clbhouz.\n\nView your profile: ${profileUrl}`,
      html: shell(`
        <h2 style="margin:0 0 8px;color:#0f172a;">Course claim approved 🎉</h2>
        <p style="margin:0 0 16px;color:#334155;">Your course claim for <strong>${businessName}</strong> has been approved and the course is now linked to your business on Clbhouz.</p>
        <a class="cta" href="${profileUrl}">View your profile</a>
      `),
    };
  }
  if (outcome === "rejected") {
    return {
      subject: `Course claim update — ${businessName}`,
      text: `We've reviewed your course claim for ${businessName} and weren't able to approve it.\n\n${adminNote ? `Reason: ${adminNote}\n\n` : ""}You can submit a new claim with updated details.`,
      html: shell(`
        <h2 style="margin:0 0 8px;color:#0f172a;">Course claim update</h2>
        <p style="margin:0 0 12px;color:#334155;">We've reviewed your course claim for <strong>${businessName}</strong> and weren't able to approve it at this time.</p>
        ${adminNote ? `<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:12px;margin:12px 0;color:#7c2d12;"><strong>Reason</strong><br/>${escapeHtml(adminNote)}</div>` : ""}
        <p style="margin:0;color:#334155;">You can submit a new claim with updated details.</p>
      `),
    };
  }
  return {
    subject: `More info needed for your course claim — ${businessName}`,
    text: `Thanks for your course claim for ${businessName}. We need a bit more before we can approve it.\n\n${adminNote ? `What we need: ${adminNote}\n` : ""}`,
    html: shell(`
      <h2 style="margin:0 0 8px;color:#0f172a;">More information needed</h2>
      <p style="margin:0 0 12px;color:#334155;">Thanks for your course claim for <strong>${businessName}</strong>. We need a bit more before we can approve it.</p>
      ${adminNote ? `<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:12px;margin:12px 0;color:#7c2d12;"><strong>What we need</strong><br/>${escapeHtml(adminNote)}</div>` : ""}
    `),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const payload = (await req.json()) as Payload;
    const { business_id, outcome, admin_note } = payload || ({} as Payload);

    if (!business_id || !outcome) {
      return new Response(JSON.stringify({ ok: false, error: "Missing business_id or outcome" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.warn("[send-course-claim-result-email] RESEND_API_KEY not set; skipping");
      return new Response(JSON.stringify({ ok: true, skipped: "no-resend-key" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: biz } = await supabaseAdmin
      .from("business_accounts")
      .select("id, name, slug")
      .eq("id", business_id)
      .maybeSingle();

    const businessName = biz?.name ?? "your business";
    const profileUrl = `https://clbhouz.co.uk/business/${biz?.slug ?? business_id}`;

    const to = await resolveOwnerEmail(business_id);
    if (!to) {
      console.warn(`[send-course-claim-result-email] no recipient email for business ${business_id}`);
      return new Response(JSON.stringify({ ok: true, skipped: "no-recipient" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { subject, text, html } = renderEmail({
      outcome,
      businessName,
      adminNote: admin_note ?? null,
      profileUrl,
    });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Clbhouz <noreply@clbhouz.co.uk>",
        to: [to],
        subject,
        text,
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[send-course-claim-result-email] Resend error", res.status, body);
      return new Response(JSON.stringify({ ok: false, error: "Resend failed" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("send-course-claim-result-email error:", e);
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
