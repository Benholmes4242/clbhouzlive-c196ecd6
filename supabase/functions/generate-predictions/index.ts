/**
 * Generate AI-powered tournament predictions using Claude
 * 
 * This edge function:
 * 1. Fetches the next scheduled PGA tournament
 * 2. Gathers player statistics and world rankings
 * 3. Calls Claude API for intelligent analysis
 * 4. Stores predictions in the ai_predictions table
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// =============================================
// TYPES
// =============================================

interface Tournament {
  id: string;
  name: string;
  venue_name: string;
  venue_city: string;
  venue_state: string;
  venue_country: string;
  start_date: string;
  end_date: string;
  purse: number;
  venue_par: number;
  venue_yardage: number;
}

interface PlayerStats {
  player_id: string;
  first_name: string;
  last_name: string;
  country: string;
  photo_url: string | null;
  pga_tour_id: string | null;
  world_rank: number;
  prior_rank: number;
  points: number;
  drive_avg: number;
  drive_acc: number;
  gir_pct: number;
  scrambling_pct: number;
  putt_avg: number;
  sg_total: number;
  sg_tee_green: number;
}

interface PredictionOutput {
  topContenders: {
    rank: number;
    playerId: string;
    playerName: string;
    photoUrl: string | null;
    pgaTourId: string | null;
    country: string;
    worldRanking: number;
    winProbability: number;
    courseFitScore: number;
    reasons: string[];
    concern: string;
  }[];
  darkHorses: {
    playerId: string;
    playerName: string;
    photoUrl: string | null;
    pgaTourId: string | null;
    country: string;
    worldRanking: number;
    hook: string;
    keyStat: string;
  }[];
  courseAnalysis: {
    winnerProfile: string;
    keyStats: string[];
    insight: string;
    difficulty: string;
  };
  confidence: number;
  reasoning: string;
}

// =============================================
// MAIN HANDLER
// =============================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')!;

    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body (optional tournament ID)
    let tournamentId: string | null = null;
    let forceRegenerate = false;
    try {
      const body = await req.json();
      tournamentId = body.tournamentId || null;
      forceRegenerate = body.forceRegenerate || false;
    } catch {
      // No body provided, will fetch next tournament
    }

    // =============================================
    // STEP 1: Fetch Tournament
    // =============================================
    
    let tournament: Tournament;
    
    if (tournamentId) {
      const { data, error } = await supabase
        .from('sr_tournaments')
        .select('*')
        .eq('id', tournamentId)
        .single();
      
      if (error || !data) {
        throw new Error(`Tournament not found: ${tournamentId}`);
      }
      tournament = data;
    } else {
      // Get next scheduled PGA tournament by joining with sr_seasons
      const { data: seasons } = await supabase
        .from('sr_seasons')
        .select('id')
        .ilike('tour_name', 'pga')
        .order('year', { ascending: false })
        .limit(1);
      
      const pgaSeasonId = seasons?.[0]?.id;
      if (!pgaSeasonId) {
        throw new Error('No PGA season found');
      }
      
      const { data, error } = await supabase
        .from('sr_tournaments')
        .select('*')
        .eq('status', 'scheduled')
        .eq('season_id', pgaSeasonId)
        .order('start_date', { ascending: true })
        .limit(1)
        .single();
      
      if (error || !data) {
        throw new Error('No upcoming tournament found');
      }
      tournament = data;
    }

    console.log(`[generate-predictions] Processing: ${tournament.name}`);

    // Check for existing predictions (unless force regenerate)
    if (!forceRegenerate) {
      const { data: existing } = await supabase
        .from('ai_predictions')
        .select('*')
        .eq('tournament_id', tournament.id)
        .single();

      if (existing && !isPredictionStale(existing)) {
        console.log(`[generate-predictions] Using cached predictions`);
        return new Response(
          JSON.stringify({
            success: true,
            cached: true,
            tournament: { id: tournament.id, name: tournament.name },
            predictions: formatStoredPredictions(existing),
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // =============================================
    // STEP 2: Fetch Player Data
    // =============================================

    // Get current PGA season
    const { data: season } = await supabase
      .from('sr_seasons')
      .select('id')
      .ilike('tour_name', 'pga')
      .order('year', { ascending: false })
      .limit(1)
      .single();

    if (!season) {
      throw new Error('No season found');
    }

    // Fetch player statistics
    const { data: playerStats, error: statsError } = await supabase
      .from('sr_player_statistics')
      .select(`
        player_id,
        raw_data,
        sr_players!inner (
          id,
          first_name,
          last_name,
          country,
          photo_url,
          pga_tour_id
        )
      `)
      .eq('season_id', season.id);

    if (statsError || !playerStats) {
      throw new Error('Failed to fetch player statistics');
    }

    // Fetch world rankings
    const { data: rankings } = await supabase
      .from('sr_world_rankings')
      .select('player_id, rank, prior_rank, points')
      .order('rank', { ascending: true })
      .limit(200);

    const rankingsMap = new Map(rankings?.map(r => [r.player_id, r]) || []);

    // Combine stats with rankings
    const players: PlayerStats[] = playerStats
      .map(ps => {
        const player = ps.sr_players as any;
        const stats = (ps.raw_data as any)?.statistics || {};
        const ranking = rankingsMap.get(player.id);

        if (!ranking || ranking.rank > 150) return null;

        return {
          player_id: player.id,
          first_name: player.first_name || '',
          last_name: player.last_name || '',
          country: player.country || 'USA',
          photo_url: player.photo_url,
          pga_tour_id: player.pga_tour_id,
          world_rank: ranking?.rank || 999,
          prior_rank: ranking?.prior_rank || 999,
          points: ranking?.points || 0,
          drive_avg: stats.drive_avg || 0,
          drive_acc: stats.drive_acc || 0,
          gir_pct: stats.gir_pct || 0,
          scrambling_pct: stats.scrambling_pct || 0,
          putt_avg: stats.putt_avg || 0,
          sg_total: stats.strokes_gained_total || 0,
          sg_tee_green: stats.strokes_gained_tee_green || 0,
        };
      })
      .filter((p): p is PlayerStats => p !== null)
      .sort((a, b) => a.world_rank - b.world_rank)
      .slice(0, 75);

    console.log(`[generate-predictions] Fetched ${players.length} players`);

    // =============================================
    // STEP 3: Build & Call Claude API
    // =============================================

    const prompt = buildAnalysisPrompt(tournament, players);

    console.log('[generate-predictions] Calling Claude API...');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[generate-predictions] Claude API error:', response.status, errorText);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const claudeResponse = await response.json();

    // Extract text response
    const responseText = claudeResponse.content
      ?.filter((block: any) => block.type === 'text')
      ?.map((block: any) => block.text)
      ?.join('') || '';

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[generate-predictions] Failed to parse JSON:', responseText.substring(0, 500));
      throw new Error('Failed to parse JSON from Claude response');
    }

    const predictions: PredictionOutput = JSON.parse(jsonMatch[0]);

    console.log(`[generate-predictions] Generated ${predictions.topContenders.length} contenders`);

    // =============================================
    // STEP 4: Enrich with Photo URLs & PGA Tour IDs
    // =============================================

    const playerMap = new Map(players.map(p => [p.player_id, p]));

    predictions.topContenders = predictions.topContenders.map(tc => {
      const player = playerMap.get(tc.playerId);
      return {
        ...tc,
        photoUrl: player?.photo_url || tc.photoUrl,
        pgaTourId: player?.pga_tour_id || tc.pgaTourId,
      };
    });

    predictions.darkHorses = predictions.darkHorses.map(dh => {
      const player = playerMap.get(dh.playerId);
      return {
        ...dh,
        photoUrl: player?.photo_url || dh.photoUrl,
        pgaTourId: player?.pga_tour_id || dh.pgaTourId,
      };
    });

    // =============================================
    // STEP 5: Store Predictions
    // =============================================

    const { error: upsertError } = await supabase
      .from('ai_predictions')
      .upsert({
        tournament_id: tournament.id,
        predictions: predictions.topContenders,
        dark_horses: predictions.darkHorses,
        course_analysis: predictions.courseAnalysis,
        confidence: predictions.confidence,
        model_version: 'claude-sonnet-4-20250514',
        prompt_version: 'v1',
        generated_at: new Date().toISOString(),
        expires_at: new Date(tournament.start_date).toISOString(),
      }, {
        onConflict: 'tournament_id',
      });

    if (upsertError) {
      console.error('[generate-predictions] Failed to store:', upsertError);
      throw upsertError;
    }

    console.log('[generate-predictions] Predictions stored successfully');

    // Log token usage
    const usage = claudeResponse.usage;
    if (usage) {
      console.log(`[generate-predictions] Tokens - Input: ${usage.input_tokens}, Output: ${usage.output_tokens}`);
    }

    // =============================================
    // STEP 6: Return Response
    // =============================================

    return new Response(
      JSON.stringify({
        success: true,
        cached: false,
        tournament: {
          id: tournament.id,
          name: tournament.name,
          venue: tournament.venue_name,
        },
        predictions: predictions,
        generatedAt: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[generate-predictions] Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// =============================================
// HELPER FUNCTIONS
// =============================================

function isPredictionStale(prediction: any): boolean {
  if (!prediction.generated_at) return true;
  
  const generatedAt = new Date(prediction.generated_at);
  const now = new Date();
  const hoursOld = (now.getTime() - generatedAt.getTime()) / (1000 * 60 * 60);
  
  // Regenerate if older than 24 hours
  return hoursOld > 24;
}

function formatStoredPredictions(stored: any) {
  return {
    topContenders: stored.predictions || [],
    darkHorses: stored.dark_horses || [],
    courseAnalysis: stored.course_analysis || {},
    confidence: stored.confidence || 0.7,
    reasoning: '',
  };
}

function determineCourseType(tournament: Tournament): { type: string; description: string } {
  const name = tournament.name.toLowerCase();
  const yardage = tournament.venue_yardage || 7200;
  const par = tournament.venue_par || 72;

  // Check for majors
  if (name.includes('masters') || name.includes('u.s. open') || 
      name.includes('open championship') || name.includes('pga championship')) {
    return {
      type: 'Major Championship',
      description: 'Demands excellence in all areas. Historically favors complete players with major experience and mental fortitude.'
    };
  }

  // Check for signature events
  if (name.includes('players') || name.includes('memorial') || name.includes('arnold palmer')) {
    return {
      type: 'Signature Event',
      description: 'Elite field, premium course conditions. Rewards consistent ball-striking and course management.'
    };
  }

  // Course type by characteristics
  if (yardage >= 7400) {
    return {
      type: "Bomber's Paradise",
      description: 'Length off the tee creates significant advantage. Favors long hitters who can overpower the course.'
    };
  }

  if (yardage < 7100 || par <= 70) {
    return {
      type: 'Precision Track',
      description: 'Tight fairways and small greens reward accuracy. Course management and iron play are critical.'
    };
  }

  if (par <= 70) {
    return {
      type: "Scrambler's Course",
      description: 'Par is a good score. Short game and scrambling ability separate contenders from pretenders.'
    };
  }

  return {
    type: 'Balanced Test',
    description: 'Well-rounded course that rewards all aspects of the game. No single skill dominates.'
  };
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function buildAnalysisPrompt(tournament: Tournament, players: PlayerStats[]): string {
  const courseType = determineCourseType(tournament);
  
  // Format player data for the prompt
  const playerDataFormatted = players.slice(0, 50).map(p => ({
    id: p.player_id,
    name: `${p.first_name} ${p.last_name}`,
    country: p.country,
    worldRank: p.world_rank,
    priorRank: p.prior_rank,
    momentum: p.prior_rank - p.world_rank,
    stats: {
      drivingDistance: p.drive_avg,
      drivingAccuracy: p.drive_acc,
      greensInRegulation: p.gir_pct,
      scrambling: p.scrambling_pct,
      puttingAvg: p.putt_avg,
      strokesGainedTotal: p.sg_total,
      strokesGainedTeeToGreen: p.sg_tee_green,
    }
  }));

  return `You are an expert PGA Tour analyst with deep knowledge of player statistics, course management, and tournament history. Your analysis is data-driven but also considers intangibles like pressure performance, course fit, and current form.

## TOURNAMENT INFORMATION

**Tournament**: ${tournament.name}
**Venue**: ${tournament.venue_name}
**Location**: ${tournament.venue_city}, ${tournament.venue_state || tournament.venue_country}
**Dates**: ${formatDate(tournament.start_date)} - ${formatDate(tournament.end_date)}
**Purse**: $${((tournament.purse || 0) / 1000000).toFixed(1)}M
**Course**: Par ${tournament.venue_par || 72}, ${(tournament.venue_yardage || 7200).toLocaleString()} yards
**Course Type**: ${courseType.type}
**Course Characteristics**: ${courseType.description}

## FIELD DATA (Top 50 Players by World Ranking)

${JSON.stringify(playerDataFormatted, null, 2)}

## ANALYSIS TASK

Based on the tournament information and player statistics, provide a comprehensive prediction for this tournament.

Consider these factors:
1. **Course Fit**: Which player stats matter most at this venue?
2. **Current Form**: Recent world ranking movement (momentum), strokes gained trends
3. **Statistical Excellence**: Who leads key categories that matter for this course?
4. **Intangibles**: Major winners at this venue type, pressure performers

## REQUIRED OUTPUT

Return a JSON object with this exact structure:

{
  "topContenders": [
    {
      "rank": 1,
      "playerId": "uuid-from-data",
      "playerName": "Full Name",
      "photoUrl": null,
      "pgaTourId": null,
      "country": "USA",
      "worldRanking": 1,
      "winProbability": 15.5,
      "courseFitScore": 92,
      "reasons": [
        "Specific reason 1 with data",
        "Specific reason 2 with data",
        "Specific reason 3 with data"
      ],
      "concern": "One potential weakness or risk"
    }
  ],
  "darkHorses": [
    {
      "playerId": "uuid-from-data",
      "playerName": "Full Name",
      "photoUrl": null,
      "pgaTourId": null,
      "country": "USA",
      "worldRanking": 45,
      "hook": "Why they could surprise (1 sentence)",
      "keyStat": "Key statistic that makes them dangerous"
    }
  ],
  "courseAnalysis": {
    "winnerProfile": "Description of typical winner at this venue",
    "keyStats": ["stat1", "stat2", "stat3"],
    "insight": "One compelling insight about this week's tournament",
    "difficulty": "Easy/Moderate/Difficult"
  },
  "confidence": 0.75,
  "reasoning": "Brief explanation of your methodology and key factors"
}

## IMPORTANT RULES

1. **Use exact player IDs from the data provided** - do not make up IDs
2. **Provide 10 top contenders** ranked 1-10
3. **Provide 3 dark horses** ranked 30-100 in world rankings
4. **Win probabilities should sum to approximately 70-80%** for top 10
5. **Be specific in reasons** - cite actual statistics
6. **Course fit scores should be 1-100**
7. **Return ONLY valid JSON** - no markdown, no explanation outside the JSON

Provide your analysis now:`;
}
