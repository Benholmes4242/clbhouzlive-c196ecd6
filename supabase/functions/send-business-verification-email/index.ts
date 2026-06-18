import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Admin email recipients - comma-separated list
const ADMIN_EMAILS = Deno.env.get("BUSINESS_VERIFICATION_ADMIN_EMAILS") || "admin@clbhouz.com";

interface VerificationRequestPayload {
  profileId: string;
  businessName: string | null;
  businessCategory: string | null;
  businessLocation: string | null;
  businessWebsite: string | null;
  businessContactEmail: string | null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: VerificationRequestPayload = await req.json();

    const { 
      profileId, 
      businessName, 
      businessCategory, 
      businessLocation, 
      businessWebsite, 
      businessContactEmail 
    } = payload;

    if (!profileId) {
      return new Response(
        JSON.stringify({ error: "Profile ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build email content
    const adminPanelUrl = `https://clbhouz.com/admin/business-verifications`;
    
    const emailSubject = `New Business Verification Request – ${businessName || 'Unknown Business'}`;
    
    const emailBody = `
A new business has requested verification on Clbhouz.

Business: ${businessName || 'Not provided'}
Category: ${businessCategory || 'Not provided'}
Location: ${businessLocation || 'Not provided'}
Website: ${businessWebsite || 'Not provided'}
Contact Email: ${businessContactEmail || 'Not provided'}

Review in admin panel: ${adminPanelUrl}
    `.trim();

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0f172a; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; }
    .field { margin-bottom: 12px; }
    .label { font-weight: 600; color: #64748b; font-size: 12px; text-transform: uppercase; }
    .value { color: #0f172a; }
    .cta { display: inline-block; background: #0f172a; color: white !important; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 16px; }
    .footer { padding: 16px; text-align: center; color: #64748b; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">New Business Verification Request</h2>
    </div>
    <div class="content">
      <p>A new business has requested verification on Clbhouz:</p>
      
      <div class="field">
        <div class="label">Business Name</div>
        <div class="value">${businessName || 'Not provided'}</div>
      </div>
      
      <div class="field">
        <div class="label">Category</div>
        <div class="value">${businessCategory || 'Not provided'}</div>
      </div>
      
      <div class="field">
        <div class="label">Location</div>
        <div class="value">${businessLocation || 'Not provided'}</div>
      </div>
      
      <div class="field">
        <div class="label">Website</div>
        <div class="value">${businessWebsite ? `<a href="${businessWebsite}">${businessWebsite}</a>` : 'Not provided'}</div>
      </div>
      
      <div class="field">
        <div class="label">Contact Email</div>
        <div class="value">${businessContactEmail ? `<a href="mailto:${businessContactEmail}">${businessContactEmail}</a>` : 'Not provided'}</div>
      </div>
      
      <a href="${adminPanelUrl}" class="cta">Review in Admin Panel</a>
    </div>
    <div class="footer">
      This is an automated message from Clbhouz.
    </div>
  </div>
</body>
</html>
    `.trim();

    // Send email via Resend if API key is available
    if (resendApiKey) {
      const adminEmailList = ADMIN_EMAILS.split(',').map(e => e.trim()).filter(Boolean);
      
      for (const adminEmail of adminEmailList) {
        try {
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Clbhouz <noreply@clbhouz.co.uk>",
              to: adminEmail,
              subject: emailSubject,
              text: emailBody,
              html: emailHtml,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to send email to ${adminEmail}:`, errorText);
          } else {
            console.log(`Email sent successfully to ${adminEmail}`);
          }
        } catch (emailError) {
          console.error(`Error sending email to ${adminEmail}:`, emailError);
        }
      }
    } else {
      console.log("RESEND_API_KEY not configured, skipping email send");
      console.log("Email would have been sent with subject:", emailSubject);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in send-business-verification-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
