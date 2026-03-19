import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
          <tr>
            <td style="padding:32px 0;text-align:center;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;">Welcome to Clbhouz, ${username}.</h1>
              <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.5);">The home of golf.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 0;">
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.6);">
                One step to go. Tap the button below to verify your email and finish setting up your profile.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${confirmationUrl}" style="display:inline-block;padding:14px 32px;background-color:rgba(232,97,10,0.9);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:16px;">
                      Verify my email
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:rgba(255,255,255,0.3);">
                This link expires in 24 hours. If you didn't create a Clbhouz account, ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 0 0;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.2);">&copy; 2026 Clbhouz &middot; clbhouz.com</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Clbhouz <noreply@clbhouz.com>',
        to: [userEmail],
        subject: `Verify your Clbhouz account`,
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
