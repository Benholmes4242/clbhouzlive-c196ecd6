import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Allow requests from Supabase Auth Hook (no user JWT present)
  // The hook sends its own authorization via the hook secret header

  try {
    const payload = await req.json();
    const { user, email_data } = payload;
    const confirmationUrl = email_data?.confirmation_url;
    const userEmail = user?.email;
    const username = user?.user_metadata?.username || userEmail?.split('@')[0] || 'golfer';

    if (!confirmationUrl || !userEmail) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('[send-welcome-email] RESEND_API_KEY not set');
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#0a0a0a;border-radius:16px;overflow:hidden;">
        <!-- Header -->
        <tr><td style="padding:36px 32px 20px;text-align:center;">
          <img src="https://clbhouzlive.lovable.app/images/clbhouz-logo.png" alt="Clbhouz" height="32" style="height:32px;" />
          <h1 style="color:#ffffff;font-size:22px;font-weight:600;margin:24px 0 4px;">Welcome to Clbhouz, ${username}.</h1>
          <p style="color:rgba(255,255,255,0.45);font-size:14px;margin:0;">The home of golf.</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:0 32px 32px;">
          <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:24px;">
            <p style="color:rgba(255,255,255,0.65);font-size:14px;line-height:1.6;margin:0 0 24px;">
              One step to go. Tap the button below to verify your email and finish setting up your profile.
            </p>
            <div style="text-align:center;">
              <a href="${confirmationUrl}" style="display:inline-block;background:#ffffff;color:#0a0a0a;font-size:14px;font-weight:600;padding:12px 32px;border-radius:10px;text-decoration:none;">
                Verify my email
              </a>
            </div>
            <p style="color:rgba(255,255,255,0.3);font-size:12px;line-height:1.5;margin:24px 0 0;text-align:center;">
              This link expires in 24 hours. If you didn't create a Clbhouz account, you can safely ignore this email.
            </p>
          </div>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:0 32px 28px;text-align:center;">
          <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:0;">&copy; 2026 Clbhouz &middot; clbhouz.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Clbhouz <notifications@clbhouz.co.uk>',
        to: [userEmail],
        subject: 'Verify your Clbhouz account',
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('[send-welcome-email] Resend error:', body);
      return new Response(JSON.stringify({ error: 'Failed to send email' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[send-welcome-email]', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
