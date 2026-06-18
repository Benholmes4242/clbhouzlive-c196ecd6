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

async function resolveOwnerEmail(businessId: string, fallback: string | null): Promise<string | null> {
  // Try business_members owner → user_profiles
  const { data: members } = await supabaseAdmin
    .from("business_members")
    .select("user_id, role")
    .eq("business_id", businessId);

  const owner = (members ?? []).find((m: any) => m.role === "owner") ?? (members ?? [])[0];
  if (owner?.user_id) {
    // Try auth users (admin) first
    try {
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(owner.user_id);
      if (u?.user?.email) return u.user.email;
    } catch (_) {}
    const { data: p } = await supabaseAdmin
      .from("user_profiles")
      .select("email")
      .eq("id", owner.user_id)
      .maybeSingle();
    if (p?.email) return p.email as string;
  }
  return fallback;
}

function renderEmail(opts: {
  outcome: Outcome;
  businessName: string;
  adminNote?: string | null;
  profileUrl: string;
  verificationUrl: string;
}) {
  const { outcome, businessName, adminNote, profileUrl, verificationUrl } = opts;

  if (outcome === "approved") {
    return {
      subject: `${businessName} is verified on Clbhouz 🎉`,
      text:
`Great news — ${businessName} is now verified on Clbhouz.

Your verified badge is now live across your profile, posts and reviews.

View your profile: ${profileUrl}`,
      html: shell(`
        <h2 style="margin:0 0 8px;color:#0f172a;">You're verified 🎉</h2>
        <p style="margin:0 0 16px;color:#334155;"><strong>${businessName}</strong> is now verified on Clbhouz. Your badge is live across your profile, posts and reviews.</p>
        <a class="cta" href="${profileUrl}">View your profile</a>
      `),
    };
  }
  if (outcome === "rejected") {
    return {
      subject: `Verification update for ${businessName}`,
      text:
`We've reviewed your verification request for ${businessName} and weren't able to approve it at this time.

${adminNote ? `Reason: ${adminNote}\n\n` : ""}You can update your details and reapply: ${verificationUrl}`,
      html: shell(`
        <h2 style="margin:0 0 8px;color:#0f172a;">Verification update</h2>
        <p style="margin:0 0 12px;color:#334155;">We've reviewed your verification request for <strong>${businessName}</strong> and weren't able to approve it at this time.</p>
        ${adminNote ? `<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:12px;margin:12px 0;color:#7c2d12;"><strong>Reason</strong><br/>${escapeHtml(adminNote)}</div>` : ""}
        <a class="cta" href="${verificationUrl}">Update and reapply</a>
      `),
    };
  }
  return {
    subject: `We need a bit more to verify ${businessName}`,
    text:
`Thanks for your verification request for ${businessName}. We need a bit more information before we can approve it.

${adminNote ? `What we need: ${adminNote}\n\n` : ""}Continue your request: ${verificationUrl}`,
    html: shell(`
      <h2 style="margin:0 0 8px;color:#0f172a;">More information needed</h2>
      <p style="margin:0 0 12px;color:#334155;">Thanks for your verification request for <strong>${businessName}</strong>. We need a bit more before we can approve it.</p>
      ${adminNote ? `<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:12px;margin:12px 0;color:#7c2d12;"><strong>What we need</strong><br/>${escapeHtml(adminNote)}</div>` : ""}
      <a class="cta" href="${verificationUrl}">Continue your request</a>
    `),
  };
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const payload = (await req.json()) as Payload;
    const { business_id, outcome, admin_note } = payload;
    if (!business_id || !outcome) {
      return new Response(JSON.stringify({ ok: false, error: "Missing fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: biz } = await supabaseAdmin
      .from("business_accounts")
      .select("id, name, slug, email")
      .eq("id", business_id)
      .maybeSingle();

    if (!biz) {
      return new Response(JSON.stringify({ ok: false, error: "Business not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const recipient = await resolveOwnerEmail(business_id, biz.email ?? null);
    if (!recipient) {
      console.warn(`[result-email] no recipient for business ${business_id}`);
      return new Response(JSON.stringify({ ok: true, skipped: "no_recipient" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const appBase = Deno.env.get("APP_BASE_URL") || "https://clbhouz.com";
    const profileUrl = biz.slug ? `${appBase}/business/${biz.slug}` : `${appBase}/businesses/manage`;
    const verificationUrl = `${appBase}/business/${biz.id}/verification`;

    const { subject, text, html } = renderEmail({
      outcome,
      businessName: biz.name ?? "Your business",
      adminNote: admin_note ?? null,
      profileUrl,
      verificationUrl,
    });

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.log("[result-email] RESEND_API_KEY not set, would send to", recipient, subject);
      return new Response(JSON.stringify({ ok: true, skipped: "no_resend_key" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Clbhouz <noreply@clbhouz.co.uk>",
        to: recipient,
        subject, text, html,
      }),
    });

    if (!r.ok) {
      const errText = await r.text();
      console.error("[result-email] resend failed", r.status, errText);
      return new Response(JSON.stringify({ ok: false, error: errText }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("[result-email] error", e);
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
