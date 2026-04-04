import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  return new Response(JSON.stringify({ ok: false, error: 'Being rebuilt' }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
