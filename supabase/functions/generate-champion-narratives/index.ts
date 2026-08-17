import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');

async function generateNarrative(
  tournamentName: string,
  defendingChampion: string,
  venueName: string | null,
  venueCity: string | null,
  tourName: string
): Promise<string | null> {
  if (!PERPLEXITY_API_KEY) return null;

  const query = `${defendingChampion} won ${tournamentName} golf tournament last year ${new Date().getFullYear() - 1}. What was the winning score, how many strokes did they win by, and any memorable detail about the victory? Answer in one punchy sentence of 10 words or fewer, no fluff. Example format: "Won by 3 shots with a final-round 65" or "Dominated wire-to-wire at -22 in Saudi Arabia"`;

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a golf stats assistant. Return only a single punchy sentence of 10 words or fewer describing how the player won the tournament last year. No intro, no explanation, no quotes around the sentence. Start directly with the content e.g. "Won by 3 with a closing 65" or "Dominated wire-to-wire at -22 under par". If you cannot find specific details, return null.',
          },
          { role: 'user', content: query },
        ],
        max_tokens: 60,
        temperature: 0.2,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) return null;

    // Strip Perplexity citation brackets e.g. [1][2][5] or [1, 2, 5]
    const text = raw.replace(/\[\d+(?:,\s*\d+)*\]/g, '').replace(/\s{2,}/g, ' ').trim();

    // Sanity check — reject if too long or unhelpful
    if (!text || text.length > 120 || text.toLowerCase().includes('i cannot') || text.toLowerCase().includes('i don\'t')) {
      return null;
    }

    return text;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    // Fetch all upcoming tournaments across all tours that:
    // 1. Have a defending champion
    // 2. Don't already have a narrative
    const { data: tournaments, error } = await supabase
      .from('sr_tournaments')
      .select(`
        id, name, defending_champion, venue_name, venue_city, champion_narrative,
        season:sr_seasons!inner(tour_name)
      `)
      .in('status', ['scheduled', 'created'])
      .gt('start_date', today)
      .not('defending_champion', 'is', null)
      .is('champion_narrative', null)
      .order('start_date', { ascending: true })
      .limit(20);

    if (error) throw error;

    if (!tournaments || tournaments.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No tournaments need narratives', updated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[generate-champion-narratives] Processing ${tournaments.length} tournaments`);

    let updated = 0;
    const results: any[] = [];

    for (const t of tournaments) {
      const tourName = (t.season as any)?.tour_name || 'pga';
      
      const narrative = await generateNarrative(
        t.name,
        t.defending_champion!,
        t.venue_name,
        t.venue_city,
        tourName
      );

      if (narrative) {
        const { error: updateError } = await supabase
          .from('sr_tournaments')
          .update({ champion_narrative: narrative })
          .eq('id', t.id);

        if (!updateError) {
          updated++;
          results.push({ tournament: t.name, champion: t.defending_champion, narrative });
          console.log(`[generate-champion-narratives] ✓ ${t.name}: "${narrative}"`);
        }
      } else {
        console.warn(`[generate-champion-narratives] No narrative for ${t.name} (${t.defending_champion})`);
        results.push({ tournament: t.name, champion: t.defending_champion, narrative: null });
      }

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 300));
    }

    return new Response(
      JSON.stringify({ message: `Updated ${updated}/${tournaments.length} narratives`, updated, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    console.error('[generate-champion-narratives] Error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});