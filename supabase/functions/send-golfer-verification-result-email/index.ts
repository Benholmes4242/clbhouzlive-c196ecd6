/**
 * BRIEF_VERIFICATION_PHASE_5B §5.3 — the golfer is EMAILED.
 *
 * Same Resend path and shell as the business result email; a missing key or
 * address is logged and skipped, never fatal to the decision that caused it.
 */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

import { corsFor } from '../_shared/cors.ts';
import { GOLFER_REASON_LABEL } from '../_shared/verificationRevocationReasons.ts';

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

type Outcome = "approved" | "rejected" | "removed";

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
  const corsHeaders = corsFor(req.headers.get('Origin'));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const { user_id, outcome, reason, admin_note } = await req.json() as {
      user_id: string; outcome: Outcome; reason?: string | null; admin_note?: string | null;
    };
    if (!user_id || !outcome) return json({ ok: false, error: "Missing fields" }, 400);

    let recipient: string | null = null;
    try {
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(user_id);
      recipient = u?.user?.email ?? null;
    } catch (_) { /* fall through */ }
    if (!recipient) {
      const { data: p } = await supabaseAdmin.from("user_profiles").select("email").eq("id", user_id).maybeSingle();
      recipient = (p?.email as string | undefined) ?? null;
    }
    if (!recipient) return json({ ok: true, skipped: "no_recipient" });

    const appBase = Deno.env.get("APP_BASE_URL") || "https://www.clbhouz.co.uk";
    const cause = reason ? GOLFER_REASON_LABEL[reason] ?? "" : "";

    let subject: string;
    let inner: string;
    let text: string;

    if (outcome === "approved") {
      subject = "You're verified on Clbhouz";
      text = `Your verified badge is now live across Clbhouz.\n\n${appBase}`;
      inner = `<h2 style="margin:0 0 8px;color:#0f172a;">You're verified</h2>
        <p style="margin:0 0 16px;color:#334155;">Your verified badge is now live across your profile, posts and reviews.</p>
        <a class="cta" href="${appBase}">Open Clbhouz</a>`;
    } else {
      subject = outcome === "removed" ? "Your Clbhouz verification has been removed" : "About your Clbhouz verification";
      const body = [cause || (outcome === "removed"
        ? "Your verified badge has been removed."
        : "Your verification was not granted."), admin_note].filter(Boolean).join(" ");
      text = `${body}\n\n${appBase}`;
      inner = `<h2 style="margin:0 0 8px;color:#0f172a;">Verification update</h2>
        <p style="margin:0 0 12px;color:#334155;">${escapeHtml(body)}</p>`;
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.log("[golfer-result-email] RESEND_API_KEY not set; would send", subject, "to", recipient);
      return json({ ok: true, skipped: "no_resend_key" });
    }

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "Clbhouz <noreply@clbhouz.co.uk>", to: recipient, subject, text, html: shell(inner) }),
    });
    if (!r.ok) {
      const errText = await r.text();
      console.error("[golfer-result-email] resend failed", r.status, errText);
      return json({ ok: false, error: errText }, 502);
    }
    return json({ ok: true });
  } catch (e: any) {
    console.error("[golfer-result-email] error", e);
    return json({ ok: false, error: e?.message ?? String(e) }, 500);
  }
});
