import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Daily Schedule Sync - Syncs tournament schedules for ALL major tours
 * Runs at 6 AM UTC daily via pg_cron
 */

// Tours to sync - includes all supported professional golf tours
const TOURS_TO_SYNC = [
  'pga',    // PGA Tour
  'euro',   // DP World Tour
  'lpga',   // LPGA Tour
  'liv',    // LIV Golf
  'pgad',   // Korn Ferry Tour
  'champ',  // Champions Tour
];

// Years to sync
const YEARS_TO_SYNC = [2025, 2026];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results: { tour: string; year: number; status: string; records?: number; error?: string }[] = [];

    console.log(`[Daily Schedule Sync] Starting sync for ${TOURS_TO_SYNC.length} tours x ${YEARS_TO_SYNC.length} years`);

    // Sync each tour and year combination
    for (const tour of TOURS_TO_SYNC) {
      for (const year of YEARS_TO_SYNC) {
        try {
          console.log(`[Daily Schedule Sync] Syncing ${tour} ${year}...`);
          
          // Call the sportradar-sync function internally
          const response = await fetch(`${supabaseUrl}/functions/v1/sportradar-sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              action: 'schedule',
              tourId: tour,
              year: year,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            results.push({
              tour,
              year,
              status: 'success',
              records: data.records_synced || 0,
            });
            console.log(`[Daily Schedule Sync] ${tour} ${year}: ${data.records_synced} tournaments synced`);
          } else {
            const errorText = await response.text();
            results.push({
              tour,
              year,
              status: 'error',
              error: errorText.substring(0, 200),
            });
            console.error(`[Daily Schedule Sync] ${tour} ${year} failed: ${errorText}`);
          }
        } catch (error) {
          results.push({
            tour,
            year,
            status: 'error',
            error: error.message,
          });
          console.error(`[Daily Schedule Sync] ${tour} ${year} exception: ${error.message}`);
        }
      }
    }

    // Log the sync status to sr_cron_status
    const successCount = results.filter(r => r.status === 'success').length;
    const totalRecords = results.reduce((sum, r) => sum + (r.records || 0), 0);

    await supabase.from('sr_cron_status').insert({
      job_name: 'daily-schedule-sync',
      status: successCount === results.length ? 'success' : 'partial',
      message: `Synced ${totalRecords} tournaments across ${successCount}/${results.length} tour/year combinations`,
      metadata: { results },
    });

    console.log(`[Daily Schedule Sync] Complete: ${totalRecords} total tournaments synced`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${totalRecords} tournaments across ${TOURS_TO_SYNC.length} tours`,
        details: results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Daily Schedule Sync] Fatal error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
