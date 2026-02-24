/**
 * Generate AI-powered tournament predictions using Claude + Perplexity
 * 
 * This edge function:
 * 1. Fetches the next scheduled PGA tournament
 * 2. Gathers player statistics and world rankings
 * 3. Fetches real-time research via Perplexity (expert picks, injuries, etc.)
 * 4. Calls Claude API for intelligent analysis with research context
 * 5. Stores predictions in the ai_predictions table
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
  courseAnalysis: {
    winnerProfile: string;
    keyStats: string[];
    insight: string;
    skillsAnalysis?: string;
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
    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY_1') || Deno.env.get('PERPLEXITY_API_KEY');

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
    // STEP 2: Fetch Confirmed Field + Player Data
    // =============================================

    // Get PGA seasons ordered by year (newest first)
    const { data: seasons } = await supabase
      .from('sr_seasons')
      .select('id, year')
      .ilike('tour_name', 'pga')
      .order('year', { ascending: false })
      .limit(3);

    if (!seasons || seasons.length === 0) {
      throw new Error('No PGA season found');
    }

    // --- 2A: Try to get confirmed field from tee times or leaderboard ---
    let confirmedFieldPlayerIds: Set<string> | null = null;

    // Try tee_time_players first (available 2-3 days before start)
    const { data: teeTimePlayers } = await supabase
      .from('sr_tee_time_players')
      .select('player_id, sr_tee_times!inner(tournament_id)')
      .eq('sr_tee_times.tournament_id', tournament.id);

    if (teeTimePlayers && teeTimePlayers.length > 10) {
      confirmedFieldPlayerIds = new Set(teeTimePlayers.map((t: any) => t.player_id));
      console.log(`[generate-predictions] Found ${confirmedFieldPlayerIds.size} confirmed entrants from tee times`);
    } else {
      // Try leaderboard entries (available once tournament is in-progress or has field list)
      const { data: leaderboardEntries } = await supabase
        .from('sr_leaderboards')
        .select('player_id')
        .eq('tournament_id', tournament.id);

      if (leaderboardEntries && leaderboardEntries.length > 10) {
        confirmedFieldPlayerIds = new Set(leaderboardEntries.map((l: any) => l.player_id));
        console.log(`[generate-predictions] Found ${confirmedFieldPlayerIds.size} confirmed entrants from leaderboard`);
      }
    }

    const hasConfirmedField = confirmedFieldPlayerIds !== null && confirmedFieldPlayerIds.size > 0;

    // --- Fetch player statistics ---
    let playerStats: any[] = [];
    let usedSeasonId: string | null = null;
    
    for (const season of seasons) {
      const { data: stats, error: statsError } = await supabase
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

      if (!statsError && stats && stats.length > 0) {
        playerStats = stats;
        usedSeasonId = season.id;
        console.log(`[generate-predictions] Using ${season.year} season stats (${stats.length} players)`);
        break;
      }
    }

    if (playerStats.length === 0) {
      throw new Error('Failed to fetch player statistics from any season');
    }

    // Fetch world rankings
    const { data: rankings } = await supabase
      .from('sr_world_rankings')
      .select('player_id, rank, prior_rank, points')
      .order('rank', { ascending: true })
      .limit(200);

    const rankingsMap = new Map(rankings?.map(r => [r.player_id, r]) || []);

    // Combine stats with rankings, filtering to confirmed field when available
    const players: PlayerStats[] = playerStats
      .map(ps => {
        const player = ps.sr_players as any;
        const stats = (ps.raw_data as any)?.statistics || {};
        const ranking = rankingsMap.get(player.id);

        // If we have confirmed field, only include players in the field
        if (hasConfirmedField && !confirmedFieldPlayerIds!.has(player.id)) return null;

        // If no confirmed field, fall back to ranking cutoff
        if (!hasConfirmedField && (!ranking || ranking.rank > 150)) return null;

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
      .slice(0, hasConfirmedField ? 120 : 75);

    console.log(`[generate-predictions] Fetched ${players.length} players (field ${hasConfirmedField ? 'confirmed' : 'estimated'})`);

    // --- 2B: Fetch course history (past results at same venue) ---
    let courseHistoryData: { playerName: string; playerId: string; finishes: { year: number; position: number | null; score: number | null }[] }[] = [];

    try {
      // Find past tournaments at the same venue
      const { data: pastTournaments } = await supabase
        .from('sr_tournaments')
        .select('id, name, start_date')
        .eq('venue_name', tournament.venue_name)
        .eq('status', 'closed')
        .neq('id', tournament.id)
        .order('start_date', { ascending: false })
        .limit(3);

      if (pastTournaments && pastTournaments.length > 0) {
        const pastTournamentIds = pastTournaments.map(t => t.id);
        const playerIdSet = new Set(players.map(p => p.player_id));

        const { data: pastResults } = await supabase
          .from('sr_leaderboards')
          .select('player_id, tournament_id, position, score')
          .in('tournament_id', pastTournamentIds)
          .in('player_id', Array.from(playerIdSet));

        if (pastResults && pastResults.length > 0) {
          // Group by player
          const historyByPlayer = new Map<string, { year: number; position: number | null; score: number | null }[]>();
          for (const result of pastResults) {
            const pt = pastTournaments.find(t => t.id === result.tournament_id);
            const year = pt ? new Date(pt.start_date).getFullYear() : 0;
            if (!historyByPlayer.has(result.player_id)) historyByPlayer.set(result.player_id, []);
            historyByPlayer.get(result.player_id)!.push({ year, position: result.position, score: result.score });
          }

          // Map to player names
          const playerNameMap = new Map(players.map(p => [p.player_id, `${p.first_name} ${p.last_name}`]));
          for (const [playerId, finishes] of historyByPlayer) {
            const name = playerNameMap.get(playerId);
            if (name) {
              courseHistoryData.push({ playerName: name, playerId, finishes: finishes.sort((a, b) => b.year - a.year) });
            }
          }
          console.log(`[generate-predictions] Found course history for ${courseHistoryData.length} players at ${tournament.venue_name}`);
        }
      }
    } catch (err) {
      console.error('[generate-predictions] Course history fetch failed:', err);
    }

    // --- 2C: Fetch recent form (last 4 results per player) ---
    let recentFormData: { playerName: string; playerId: string; results: { tournament: string; position: number | null; score: number | null }[] }[] = [];

    try {
      const { data: recentTournaments } = await supabase
        .from('sr_tournaments')
        .select('id, name')
        .eq('status', 'closed')
        .order('end_date', { ascending: false })
        .limit(6);

      if (recentTournaments && recentTournaments.length > 0) {
        const recentIds = recentTournaments.map(t => t.id);
        const playerIdSet = new Set(players.slice(0, 50).map(p => p.player_id));

        const { data: recentResults } = await supabase
          .from('sr_leaderboards')
          .select('player_id, tournament_id, position, score')
          .in('tournament_id', recentIds)
          .in('player_id', Array.from(playerIdSet));

        if (recentResults && recentResults.length > 0) {
          const formByPlayer = new Map<string, { tournament: string; position: number | null; score: number | null }[]>();
          for (const result of recentResults) {
            const rt = recentTournaments.find(t => t.id === result.tournament_id);
            if (!formByPlayer.has(result.player_id)) formByPlayer.set(result.player_id, []);
            formByPlayer.get(result.player_id)!.push({
              tournament: rt?.name || 'Unknown',
              position: result.position,
              score: result.score,
            });
          }

          const playerNameMap = new Map(players.map(p => [p.player_id, `${p.first_name} ${p.last_name}`]));
          for (const [playerId, results] of formByPlayer) {
            const name = playerNameMap.get(playerId);
            if (name) {
              recentFormData.push({ playerName: name, playerId, results: results.slice(0, 4) });
            }
          }
        }
      }
    } catch (err) {
      console.error('[generate-predictions] Recent form fetch failed:', err);
    }

    // =============================================
    // STEP 3: Fetch Real-Time Research via Perplexity
    // =============================================

    let researchContext = '';
    
    if (perplexityApiKey) {
      console.log('[generate-predictions] Fetching real-time research via Perplexity...');
      
      try {
        const currentYear = new Date().getFullYear();
        const researchQueries = [
          `${tournament.name} ${currentYear} expert picks predictions golf betting odds movement model projections who will win`,
          `${tournament.venue_name} golf course recent winners playing style scoring trends past 5 years what type of player wins`,
          `PGA Tour player withdrawals injuries confirmed field ${tournament.name} ${currentYear} this week`,
          `Weather forecast ${tournament.venue_city || ''} ${tournament.venue_state || tournament.venue_country} ${formatDate(tournament.start_date)} to ${formatDate(tournament.end_date)} wind rain conditions`,
        ];

        const researchPromises = researchQueries.map(async (query, index) => {
          try {
            const response = await fetch('https://api.perplexity.ai/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${perplexityApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'sonar',
                messages: [
                  {
                    role: 'system',
                    content: 'You are a golf research assistant. Provide concise, factual information. Focus on recent news, statistics, and expert opinions. Keep responses under 300 words. Be specific about player names and statistics.',
                  },
                  {
                    role: 'user',
                    content: query,
                  },
                ],
                max_tokens: 500,
                temperature: 0.2,
              }),
            });

            if (response.ok) {
              const data = await response.json();
              return data.choices?.[0]?.message?.content || '';
            } else {
              const errorText = await response.text();
              console.error(`[generate-predictions] Perplexity query ${index + 1} failed:`, response.status, errorText);
              return '';
            }
          } catch (err) {
            console.error(`[generate-predictions] Perplexity query ${index + 1} error:`, err);
            return '';
          }
        });

        const researchResults = await Promise.all(researchPromises);
        
        const expertPicks = researchResults[0]?.trim() || 'No recent expert picks available.';
        const courseHistoryResearch = researchResults[1]?.trim() || 'No recent course history available.';
        const injuryNews = researchResults[2]?.trim() || 'No injury news available.';
        const weatherForecast = researchResults[3]?.trim() || 'No weather forecast available.';
        
        researchContext = `
## REAL-TIME RESEARCH (as of ${new Date().toISOString().split('T')[0]})

### Expert Picks & Betting Odds Movement
${expertPicks}

### Course History & Scoring Trends
${courseHistoryResearch}

### Injury News, Withdrawals & Field Updates
${injuryNews}

### Weather Conditions Forecast
${weatherForecast}
`;

        console.log('[generate-predictions] Research context fetched successfully');
      } catch (err) {
        console.error('[generate-predictions] Perplexity research failed:', err);
        // Continue without research - not critical
      }
    } else {
      console.log('[generate-predictions] Skipping Perplexity research (no API key configured)');
    }

    // =============================================
    // STEP 4: Build & Call Claude API
    // =============================================

    const prompt = buildAnalysisPrompt(tournament, players, researchContext, hasConfirmedField, courseHistoryData, recentFormData);

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
        max_tokens: 6000,
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
    // STEP 5: Enrich with Photo URLs & PGA Tour IDs
    // =============================================

    const playerByIdMap = new Map(players.map(p => [p.player_id, p]));
    const playerByNameMap = new Map(players.map(p => [
      `${p.first_name} ${p.last_name}`.toLowerCase(), 
      p
    ]));

    function findPlayer(playerId: string, playerName: string): PlayerStats | undefined {
      let player = playerByIdMap.get(playerId);
      if (player) return player;
      
      const normalizedName = playerName?.toLowerCase()?.trim();
      if (normalizedName) {
        player = playerByNameMap.get(normalizedName);
        if (player) {
          console.log(`[generate-predictions] Matched "${playerName}" by name, correcting ID: ${playerId} -> ${player.player_id}`);
          return player;
        }
      }
      
      console.warn(`[generate-predictions] Could not find player: ${playerName} (ID: ${playerId})`);
      return undefined;
    }

    predictions.topContenders = predictions.topContenders.map(tc => {
      const player = findPlayer(tc.playerId, tc.playerName);
      return {
        ...tc,
        playerId: player?.player_id || tc.playerId,
        photoUrl: player?.photo_url || tc.photoUrl,
        pgaTourId: player?.pga_tour_id || tc.pgaTourId,
      };
    });

    // =============================================
    // STEP 6: Store Predictions
    // =============================================

    // Split into display picks (top 5) and alternates (6-8)
    const displayPicks = predictions.topContenders.slice(0, 5);
    const alternates = predictions.topContenders.slice(5, 8);

    const { error: upsertError } = await supabase
      .from('ai_predictions')
      .upsert({
        tournament_id: tournament.id,
        predictions: displayPicks,
        dark_horses: alternates, // Repurpose dark_horses column for alternates
        course_analysis: predictions.courseAnalysis,
        confidence: predictions.confidence,
        model_version: 'claude-sonnet-4-20250514',
        prompt_version: 'v3',  // Bumped for field filtering, course history, 8 picks
        research_context: researchContext ? { raw: researchContext, fetched_at: new Date().toISOString() } : null,
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
    // STEP 7: Return Response
    // =============================================

    return new Response(
      JSON.stringify({
        success: true,
        cached: false,
        hasResearch: !!researchContext,
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
  // Predictions are NEVER stale - once generated, they're final for that tournament
  // Only regenerate via forceRegenerate (admin action)
  return false;
}

function formatStoredPredictions(stored: any) {
  return {
    topContenders: stored.predictions || [],
    darkHorses: [],
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

function buildAnalysisPrompt(
  tournament: Tournament, 
  players: PlayerStats[],
  researchContext: string = '',
  hasConfirmedField: boolean = false,
  courseHistoryData: { playerName: string; playerId: string; finishes: { year: number; position: number | null; score: number | null }[] }[] = [],
  recentFormData: { playerName: string; playerId: string; results: { tournament: string; position: number | null; score: number | null }[] }[] = [],
): string {
  const courseType = determineCourseType(tournament);
  
  // Format player data for the prompt
  const playerDataFormatted = players.slice(0, 60).map(p => ({
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

  // Build course history section
  let courseHistorySection = '';
  if (courseHistoryData.length > 0) {
    const historyLines = courseHistoryData.slice(0, 30).map(p => {
      const finishStr = p.finishes.map(f => `${f.year}: ${f.position ? `T${f.position}` : 'MC'} (${f.score ?? 'N/A'})`).join(', ');
      return `- ${p.playerName}: ${finishStr}`;
    }).join('\n');
    courseHistorySection = `
## COURSE HISTORY AT ${tournament.venue_name.toUpperCase()} (Last 3 Years)

${historyLines}

**IMPORTANT**: Heavily weight course history — players who have consistently performed well at this venue are statistically more likely to perform well again.
`;
  }

  // Build recent form section
  let recentFormSection = '';
  if (recentFormData.length > 0) {
    const formLines = recentFormData.slice(0, 25).map(p => {
      const resultStr = p.results.map(r => `${r.tournament}: ${r.position ? `T${r.position}` : 'MC'}`).join(', ');
      return `- ${p.playerName}: ${resultStr}`;
    }).join('\n');
    recentFormSection = `
## RECENT FORM (Last 4 Events)

${formLines}

**IMPORTANT**: Recent form (last 4 events) should be weighted more heavily than season averages.
`;
  }

  const fieldNote = hasConfirmedField
    ? '**Note**: The player pool below contains ONLY confirmed tournament entrants.'
    : '**Note**: Confirmed field not yet available — pool is top players by world ranking. Some may not be in the field. Cross-reference with the withdrawal/field research above.';

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

${researchContext}

${courseHistorySection}

${recentFormSection}

## FIELD DATA
${fieldNote}

${JSON.stringify(playerDataFormatted, null, 2)}

## STROKES GAINED TO COURSE FIT MATCHING

For this course type (${courseType.type}), identify which strokes gained categories matter most:
- If tight fairways / accuracy course: prioritize players with top SG: Approach and Driving Accuracy
- If long / bomber's course: prioritize players with top SG: Off the Tee and Driving Distance
- If scrambling-heavy: prioritize players with top SG: Around the Green and Scrambling %
- If putting-centric (small greens, fast surfaces): prioritize SG: Putting

Each contender's reasons MUST reference specific strokes gained categories that match the course DNA.

## ANALYSIS TASK

Create a comprehensive prediction with **exactly 8 contenders ranked 1-8**.
- Picks 1-5 are your top display picks.
- Picks 6-8 are ranked alternates (in case of withdrawals).

Factor in ALL available data:
1. **Course Fit**: Match player strokes gained profile to course demands
2. **Course History**: Past performance at this specific venue (highest weight)
3. **Current Form**: Recent results and world ranking movement
4. **Real-Time Context**: Expert opinions, injuries, withdrawals, weather conditions
5. **Statistical Excellence**: Leaders in key categories for this course type
6. **Intangibles**: Major winners at this venue type, pressure performers

For the "skillsAnalysis" in courseAnalysis, provide a detailed 2-3 sentence explanation that:
1. Identifies the 2-3 most important skills for THIS specific course
2. Explains WHY those skills matter (course characteristics like green size, fairway width, rough severity, wind)
3. Describes what type of player profile historically succeeds here

Good example: "At TPC Scottsdale, approach play is paramount - the small, firm greens demand precision with mid-irons from 150-180 yards. Putting becomes the separator on Sunday, as the slick, undulating surfaces reward exceptional distance control."
Bad example: "Players who are good at golf will do well here."

## CRITICAL: NO GAMBLING LANGUAGE

Do NOT reference betting odds, spreads, lines, prices, or any gambling-related language anywhere in your response. Focus exclusively on player form, statistics, course fit, and historical performance.

## CRITICAL: TEXT LENGTH RULES

Each contender MUST have exactly 3 reasons. Each reason MUST be a COMPLETE sentence of 50 characters or less.
The 3 reasons should cover distinct insights:
1. Recent form or momentum (e.g. "Won last week at Pebble Beach")
2. Course fit or key stat (e.g. "71% GIR leads field in precision")
3. Historical performance (e.g. "Three top-10s in last four starts")

GOOD: "Won here in 2022 and 2023" (25 chars)
GOOD: "Elite iron play, #2 in GIR this season" (39 chars)
BAD: "Two-time Phoenix Open winner (2022, 2023) with exceptional course history" (too long)

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
        "MAX 50 CHARS. Recent form insight",
        "MAX 50 CHARS. Course fit or key stat",
        "MAX 50 CHARS. Historical performance"
      ],
      "concern": "One potential weakness or risk"
    }
  ],
  "courseAnalysis": {
    "winnerProfile": "Description of typical winner at this venue",
    "keyStats": ["stat1", "stat2", "stat3"],
    "insight": "One compelling insight about course history and who tends to win here",
    "skillsAnalysis": "Detailed 2-3 sentence explanation of key skills for this course.",
    "difficulty": "Easy/Moderate/Difficult"
  },
  "confidence": 0.75,
  "reasoning": "Brief explanation of your methodology and key factors"
}

## IMPORTANT RULES

1. **Use exact player IDs from the data provided** - do not make up IDs
2. **Provide exactly 8 top contenders** ranked 1-8 (5 display + 3 alternates)
3. **Each contender MUST have exactly 3 reasons**
4. **Win probabilities should sum to approximately 60-80%** for all 8
5. **Be specific in reasons** - cite actual statistics and course history
6. **Course fit scores should be 1-100**
7. **Return ONLY valid JSON** - no markdown, no explanation outside the JSON
8. **No gambling language** - no odds, betting, lines, spreads, or wagering terms

Provide your analysis now:`;
}
