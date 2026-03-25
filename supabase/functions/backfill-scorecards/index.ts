import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tournamentSrId, tourId, year, rounds } = await req.json();

    if (!tournamentSrId || !tourId || !year) {
      return new Response(JSON.stringify({ error: 'tournamentSrId, tourId, and year are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const roundsToSync = rounds || [1, 2, 3, 4];
    const results: any[] = [];
    const syncUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/sportradar-sync`;

    for (const round of roundsToSync) {
      try {
        console.log(`[Backfill] Syncing scorecard round ${round} for tournament ${tournamentSrId}`);
        const res = await fetch(syncUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'scorecards',
            tournamentId: tournamentSrId,
            tourId,
            year,
            roundNumber: round,
          }),
        });
        const data = await res.json();
        results.push({ round, status: 'ok', data });
        console.log(`[Backfill] Round ${round} done: ${JSON.stringify(data)}`);
      } catch (e) {
        results.push({ round, status: 'error', error: e.message });
        console.warn(`[Backfill] Round ${round} failed: ${e.message}`);
      }
      // Rate limit delay
      if (round < roundsToSync[roundsToSync.length - 1]) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error(`[Backfill] Error: ${e.message}`);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
