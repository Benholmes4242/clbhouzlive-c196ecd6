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

    // 1. Notify support
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Clbhouz <notifications@clbhouz.co.uk>',
        to: ['support@clbhouz.co.uk'],
        subject: '🏌️ New Waitlist Signup',
        html: `<p>New beta waitlist signup:</p><p><strong>${safeEmail}</strong></p><p>Added: ${new Date().toISOString()}</p>`,
      }),
    });

    // 2. Send confirmation to the user
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Clbhouz <notifications@clbhouz.co.uk>',
        to: [email],
        subject: "You're on the Clbhouz waitlist 🏌️",
        html: `
          <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
            <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 20px;">You're on the list!</h1>
            <p style="font-size: 15px; line-height: 1.6; color: #444;">
              Thanks for your interest in Clbhouz — the world's leading course review and golf discovery platform.
              We'll be in touch as soon as your invite is ready.
            </p>
            <p style="font-size: 14px; color: #888; margin-top: 32px;">
              — The Clbhouz Team
            </p>
          </div>
        `,
      }),
    });

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
