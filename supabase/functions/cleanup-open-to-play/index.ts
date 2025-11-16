import { createClient } from 'jsr:@supabase/supabase-js@2';
import { cors } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const corsHeaders = cors(req.headers.get('origin'));

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    console.log('[cleanup-open-to-play] Starting cleanup...');

    // Call the database function to cleanup expired Open to Play statuses
    const { error } = await supabase.rpc('cleanup_expired_open_to_play');

    if (error) {
      console.error('[cleanup-open-to-play] Error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[cleanup-open-to-play] Cleanup completed successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Cleanup completed' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('[cleanup-open-to-play] Exception:', error);
    return new Response(
      JSON.stringify({ error: error.message ?? 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
