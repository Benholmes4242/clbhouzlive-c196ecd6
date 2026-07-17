/**
 * admin-sync-internal-secret — ONE-SHOT admin function.
 *
 * Reads `INTERNAL_FN_SECRET` from the edge-function env and updates the
 * matching entry in `vault.secrets` so cron jobs (which read via
 * `vault.decrypted_secrets`) send exactly what guarded functions expect.
 *
 * Safety: no caller-token check because the ONLY side effect is aligning
 * `vault.secrets(name='INTERNAL_FN_SECRET')` with the env value. Even an
 * unauthorized caller can only trigger the exact state we intend. The
 * SECURITY DEFINER wrappers are name-scoped ('INTERNAL_FN_SECRET' only).
 *
 * DELETE THIS FUNCTION AND THE WRAPPERS AFTER USE.
 */

import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const envSecret = Deno.env.get('INTERNAL_FN_SECRET');
  if (!envSecret) {
    return new Response(JSON.stringify({ error: 'INTERNAL_FN_SECRET missing from env' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }


  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data, error } = await supabase.rpc('upsert_internal_fn_secret', {
    p_secret: envSecret,
  });
  if (error) {
    return new Response(JSON.stringify({ error: 'vault upsert failed', detail: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true, action: data, name: 'INTERNAL_FN_SECRET' }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});

