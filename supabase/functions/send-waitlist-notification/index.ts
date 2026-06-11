const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    const safeEmail = (email || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    if (!email) {
      return new Response(JSON.stringify({ error: 'Missing email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not set');
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Internal alert to support
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'clbhouz <noreply@clbhouz.co.uk>',
        to: ['support@clbhouz.co.uk'],
        subject: 'New launch-list signup',
        html: `<p>New launch-list signup:</p><p><strong>${safeEmail}</strong></p><p>Added: ${new Date().toISOString()}</p>`,
      }),
    }).catch((e) => console.error('support alert failed', e));

    // 2. Subscriber confirmation — dark editorial style matching auth emails
    const confirmationHtml = `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#0A0E14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;padding:48px 24px;">
      <div style="text-align:center;margin-bottom:32px;">
        <span style="color:#FFFFFF;font-size:20px;font-weight:800;letter-spacing:0.08em;">clbhouz</span>
      </div>
      <div style="background:#0C1119;border:1px solid rgba(255,255,255,0.10);border-radius:20px;padding:28px 24px;">
        <h1 style="margin:0 0 12px;color:#FFFFFF;font-size:17px;font-weight:700;line-height:1.3;">You're on the list</h1>
        <p style="margin:0;color:rgba(255,255,255,0.6);font-size:13px;line-height:1.55;">
          clbhouz launches on the App Store and Google Play on 22 June 2026. We'll email you the moment it's live.
        </p>
      </div>
      <p style="margin:24px 0 8px;color:rgba(255,255,255,0.35);font-size:12px;line-height:1.5;text-align:center;">
        If this wasn't you, you can safely ignore this email.
      </p>
      <p style="margin:0;color:rgba(255,255,255,0.25);font-size:11px;letter-spacing:0.08em;text-align:center;text-transform:uppercase;">
        clbhouz — clbhouz.co.uk
      </p>
    </div>
  </body>
</html>`;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'clbhouz <noreply@clbhouz.co.uk>',
        to: [email],
        subject: "You're on the clbhouz launch list",
        html: confirmationHtml,
      }),
    }).catch((e) => console.error('confirmation send failed', e));

    // 3. Add to Resend global contacts (non-fatal)
    await fetch('https://api.resend.com/contacts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, unsubscribed: false }),
    }).catch(() => {});

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Waitlist notification error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
