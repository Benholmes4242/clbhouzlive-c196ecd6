import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsFor } from '../_shared/cors.ts';
import { FREE_EMAIL_DOMAINS } from '../_shared/freeEmailDomains.ts';
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  const corsHeaders = corsFor(req.headers.get('Origin'));
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const json = (status: number, body: Record<string, unknown>) =>
      new Response(JSON.stringify(body), {
        status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    const { requestId, businessId, email } = await req.json().catch(() => ({}));

    if (!requestId || !businessId || !email) {
      return json(400, { success: false, error: "Missing required fields" });
    }

    // ---- Authorisation: the caller must own/admin this business ----
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json(401, { success: false, error: "Unauthorized" });
    const supabaseUser = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
    );
    const { data: userData, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !userData?.user) return json(401, { success: false, error: "Unauthorized" });
    const callerId = userData.user.id;

    const { data: membership } = await supabase
      .from("business_members")
      .select("business_id")
      .eq("business_id", businessId)
      .eq("user_profile_id", callerId)
      .in("role", ["owner", "admin"])
      .maybeSingle();
    if (!membership) return json(403, { success: false, error: "Not authorised for this business" });

    // requires_domain_check is admin-initiated and is NOT a permission to send;
    // membership above is the permission.
    const { data: verificationRequest, error: reqError } = await supabase
      .from("business_verification_requests")
      .select("business_id, domain")
      .eq("id", requestId)
      .single();

    if (reqError || !verificationRequest) {
      return json(404, { success: false, error: "Verification request not found" });
    }
    if (verificationRequest.business_id !== businessId) {
      return json(403, { success: false, error: "Not authorised for this business" });
    }

    const emailDomain = String(email).trim().toLowerCase().split("@")[1] ?? "";
    if (!emailDomain) return json(400, { success: false, error: "Invalid email" });
    if (FREE_EMAIL_DOMAINS.has(emailDomain)) {
      return json(400, { success: false, error: "free_provider" });
    }

    const nominated = verificationRequest.domain?.toLowerCase() ?? null;
    if (nominated) {
      if (emailDomain !== nominated) {
        return json(400, { success: false, error: `Email must be from @${nominated}` });
      }
    } else {
      const { error: domainErr } = await supabase
        .from("business_verification_requests")
        .update({ domain: emailDomain })
        .eq("id", requestId);
      if (domainErr) {
        console.error("Domain write-back error:", domainErr);
        return json(500, { success: false, error: "Failed to record domain" });
      }
    }

    // Generate code and hash
    const code = generateCode();
    const codeHash = await hashCode(code);

    // Expire any existing pending verifications
    await supabase
      .from("business_domain_verifications")
      .update({ status: "expired" })
      .eq("request_id", requestId)
      .eq("status", "pending");

    // Create new verification record
    const { data: verification, error: insertError } = await supabase
      .from("business_domain_verifications")
      .insert({
        request_id: requestId,
        business_id: businessId,
        email,
        code_hash: codeHash,
        status: "pending",
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to create verification" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get business name for email
    const { data: business } = await supabase
      .from("business_accounts")
      .select("name")
      .eq("id", businessId)
      .single();

    const businessName = business?.name || "your business";

    // Send email via Resend
    if (resendApiKey) {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Clbhouz <noreply@clbhouz.co.uk>",
          to: [email],
          subject: `Your verification code: ${code}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
              <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 24px; color: #1a1a1a;">Verify your domain</h1>
              <p style="font-size: 16px; color: #4a4a4a; margin-bottom: 24px;">
                Enter this code to verify that you have access to ${email} for ${businessName}:
              </p>
              <div style="background: #f5f5f7; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1a1a1a;">${code}</span>
              </div>
              <p style="font-size: 14px; color: #8a8a8a;">
                This code expires in 15 minutes. If you didn't request this, you can safely ignore this email.
              </p>
            </div>
          `,
        }),
      });

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        console.error("Resend error:", errorText);
        // Don't fail - verification record is created, user can retry
      }
    } else {
      console.log("RESEND_API_KEY not set - code for testing:", code);
    }

    return new Response(
      JSON.stringify({ success: true, verificationId: verification.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
