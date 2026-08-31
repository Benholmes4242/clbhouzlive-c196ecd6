import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsFor } from "../_shared/cors.ts";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const ADMIN_EMAILS =
  Deno.env.get("COURSE_REQUEST_ADMIN_EMAILS") ||
  Deno.env.get("BUSINESS_VERIFICATION_ADMIN_EMAILS") ||
  "support@clbhouz.co.uk";

const ADMIN_PANEL_URL = "https://clbhouz.com/admin/content?tab=course-requests";

function jsonWith(corsHeaders: Record<string, string>) {
  return (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
}

function esc(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

serve(async (req) => {
  const corsHeaders = corsFor(req.headers.get("Origin"));
  const json = jsonWith(corsHeaders);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
    if (userErr || !userData?.user) return json({ ok: false, error: "Unauthorized" }, 401);
    const user = userData.user;

    const body = await req.json().catch(() => ({}));
    const course_name = (body?.course_name ?? "").toString().trim();
    const location = (body?.location ?? "").toString().trim();
    const country = (body?.country ?? "").toString().trim() || null;
    const note = (body?.note ?? "").toString().trim() || null;
    // BRIEF_HOME_CLUB_PICKER §3.3 — a home-club request records WHO asked, so
    // resolving it can connect them (and everyone else who asked) automatically.
    const isHomeClub = body?.home_club === true;

    if (!course_name) return json({ ok: false, error: "Missing course_name" }, 400);
    if (!location) return json({ ok: false, error: "Missing location" }, 400);
    if (course_name.length > 200 || location.length > 300) {
      return json({ ok: false, error: "Input too long" }, 400);
    }

    if (isHomeClub) {
      // Dedupe PER MEMBER, not per club: several members may (and should) be
      // able to request the same missing club so resolving it connects them all.
      const { data: mine } = await supabaseAdmin
        .from("course_requests")
        .select("id")
        .eq("status", "pending")
        .eq("home_club_for_user_id", user.id)
        .limit(1);
      if (mine && mine.length > 0) {
        return json(
          { ok: true, duplicate: true, message: "You've already asked us for a club — we'll connect you as soon as it's added." },
          200,
        );
      }
    } else {
      const { data: dupes } = await supabaseAdmin
        .from("course_requests")
        .select("id")
        .eq("status", "pending")
        .ilike("course_name", course_name)
        .limit(1);
      if (dupes && dupes.length > 0) {
        return json(
          { ok: true, duplicate: true, message: "That course has already been requested — we're on it." },
          200,
        );
      }
    }

    const { data: inserted, error: insErr } = await supabaseAdmin
      .from("course_requests")
      .insert({
        requested_by: user.id,
        course_name,
        location,
        country,
        note,
        home_club_for_user_id: isHomeClub ? user.id : null,
      })
      .select("id, created_at")
      .single();

    if (insErr) {
      console.error("course_requests insert failed:", insErr.message);
      return json({ ok: false, error: "Could not save request" }, 500);
    }

    if (isHomeClub) {
      // §3.5 — show the member their own answer as a PENDING placeholder.
      // It is never a real club: no id is written and nothing joins to it.
      const key = course_name.toLowerCase().replace(/[^a-z0-9]/g, "");
      const { error: pendErr } = await supabaseAdmin
        .from("user_profiles")
        .update({
          home_club_pending_name: course_name,
          home_club_pending_key: key || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
      if (pendErr) console.error("pending home club write failed:", pendErr.message);
    }

    let requesterName = "A user";
    try {
      const { data: prof } = await supabaseAdmin
        .from("user_profiles")
        .select("display_name, username")
        .eq("id", user.id)
        .maybeSingle();
      requesterName = prof?.display_name || prof?.username || user.email || "A user";
    } catch (_) { /* non-fatal */ }
    const requesterEmail = user.email || "unknown";

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      const subject = isHomeClub
        ? `Home club request: ${course_name}`
        : `New course request: ${course_name}`;
      const text =
        `New course request on Clbhouz\n\n` +
        `Course: ${course_name}\n` +
        `Location: ${location}\n` +
        (country ? `Country: ${country}\n` : "") +
        (note ? `Note: ${note}\n` : "") +
        `Requested by: ${requesterName} (${requesterEmail})\n\n` +
        `Review in admin panel: ${ADMIN_PANEL_URL}`;
      const html = `
<!DOCTYPE html><html><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0F172A;">
  <h2 style="font-weight:500;">New course request</h2>
  <table style="font-size:14px;border-collapse:collapse;">
    <tr><td style="color:#64748B;padding:4px 16px 4px 0;">Course</td><td style="font-weight:500;">${esc(course_name)}</td></tr>
    <tr><td style="color:#64748B;padding:4px 16px 4px 0;">Location</td><td>${esc(location)}</td></tr>
    ${country ? `<tr><td style="color:#64748B;padding:4px 16px 4px 0;">Country</td><td>${esc(country)}</td></tr>` : ""}
    ${note ? `<tr><td style="color:#64748B;padding:4px 16px 4px 0;">Note</td><td>${esc(note)}</td></tr>` : ""}
    <tr><td style="color:#64748B;padding:4px 16px 4px 0;">Requested by</td><td>${esc(requesterName)} (${esc(requesterEmail)})</td></tr>
  </table>
  <p style="margin-top:20px;">
    <a href="${ADMIN_PANEL_URL}" style="background:#F7931E;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:500;display:inline-block;">Review in admin panel</a>
  </p>
</body></html>`.trim();

      const adminList = ADMIN_EMAILS.split(",").map((e) => e.trim()).filter(Boolean);
      for (const adminEmail of adminList) {
        try {
          const resp = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Authorization": `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "Clbhouz <noreply@clbhouz.co.uk>",
              to: adminEmail, subject, text, html,
            }),
          });
          if (!resp.ok) console.error(`Course-request email failed to ${adminEmail}:`, await resp.text());
        } catch (e) {
          console.error(`Course-request email error to ${adminEmail}:`, e);
        }
      }
    } else {
      console.log("RESEND_API_KEY not configured, skipping course-request email");
    }

    return json({ ok: true, id: inserted?.id });
  } catch (e) {
    console.error("request-course unhandled error:", e);
    return json({ ok: false, error: "Internal error" }, 500);
  }
});
