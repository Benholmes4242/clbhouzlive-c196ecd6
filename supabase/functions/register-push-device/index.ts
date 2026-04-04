import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ ok: false, error: 'Not authenticated' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const oneSignalAppId = Deno.env.get('ONESIGNAL_APP_ID')!;
    const oneSignalApiKey = Deno.env.get('ONESIGNAL_REST_API_KEY')!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid session' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { platform, enabled = true } = body;

    if (!platform) {
      return new Response(JSON.stringify({ ok: false, error: 'platform is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[register-push-device] Registering:', { userId: user.id, platform, enabled });

    const admin = createClient(supabaseUrl, supabaseServiceKey);
    const { error: upsertError } = await admin
      .from('user_push_devices')
      .upsert({
        user_id: user.id,
        platform,
        onesignal_external_id: user.id,
        enabled,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('[register-push-device] Upsert error:', upsertError);
      return new Response(JSON.stringify({ ok: false, error: upsertError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (enabled && oneSignalAppId && oneSignalApiKey) {
      try {
        const osRes = await fetch(`https://api.onesignal.com/apps/${oneSignalAppId}/users`, {
          method: 'POST',
          headers: {
            'Authorization': `Key ${oneSignalApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            identity: { external_id: user.id },
            subscriptions: [{
              type: platform === 'ios' ? 'iOSPush' : 'AndroidPush',
              enabled: true,
            }],
          }),
        });
        const osData = await osRes.json();
        console.log('[register-push-device] OneSignal result:', JSON.stringify(osData));
      } catch (osErr) {
        console.error('[register-push-device] OneSignal error:', osErr);
      }
    }

    console.log('[register-push-device] Success for user:', user.id);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[register-push-device] Unexpected error:', err);
    return new Response(JSON.stringify({ ok: false, error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
