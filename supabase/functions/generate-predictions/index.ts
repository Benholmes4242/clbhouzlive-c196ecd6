/**
 * Generate AI-powered tournament predictions using Consensus Engine V2
 * 
 * This edge function:
 * 1. Fetches the next scheduled PGA tournament
 * 2. Gathers player statistics and world rankings
 * 3. Fetches real-time research via Perplexity (expert picks, injuries, etc.)
 * 4. Extracts detailed stats + derives SG proxies
 * 5. Calculates data-driven course fit scores from Course DNA profiles
 * 6. Calculates venue history scores with trend analysis
 * 7. Runs multi-model consensus (Claude + optional GPT-4 + Gemini)
 * 8. Stores predictions with consensus metadata in ai_predictions
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { extractPlayerStats, deriveSGProxies, formatStatsForPrompt } from './detailedStats.ts';
import { calculateCourseFitScores, formatCourseFitForPrompt } from './courseFitCalculator.ts';
import { calculateVenueHistoryScores, formatVenueHistoryForPrompt } from './venueHistory.ts';
import { runConsensus } from './consensusEngine.ts';
import type { PlayerStats as EnrichedPlayerStats } from './detailedStats.ts';
import type { CourseDNAProfile } from './courseFitCalculator.ts';

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
  raw_data: any;  // Full raw_data for detailed stat extraction
}

// =============================================
// MAIN HANDLER
// =============================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY_1') || Deno.env.get('PERPLEXITY_API_KEY');

    if (!Deno.env.get('ANTHROPIC_API_KEY')) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    let tournamentId: string | null = null;
    let forceRegenerate = false;
    try {
      const body = await req.json();
      tournamentId = body.tournamentId || null;
      forceRegenerate = body.forceRegenerate || false;
    } catch {
      // No body provided
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
      
      if (error || !data) throw new Error(`Tournament not found: ${tournamentId}`);
      tournament = data;
    } else {
      const { data: seasons } = await supabase
        .from('sr_seasons')
        .select('id')
        .ilike('tour_name', 'pga')
        .order('year', { ascending: false })
        .limit(1);
      
      const pgaSeasonId = seasons?.[0]?.id;
      if (!pgaSeasonId) throw new Error('No PGA season found');
      
      const { data, error } = await supabase
        .from('sr_tournaments')
        .select('*')
        .eq('status', 'scheduled')
        .eq('season_id', pgaSeasonId)
        .order('start_date', { ascending: true })
        .limit(1)
        .single();
      
      if (error || !data) throw new Error('No upcoming tournament found');
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

    const { data: seasons } = await supabase
      .from('sr_seasons')
      .select('id, year')
      .ilike('tour_name', 'pga')
      .order('year', { ascending: false })
      .limit(3);

    if (!seasons || seasons.length === 0) throw new Error('No PGA season found');

    // --- 2A: Try to get confirmed field ---
    let confirmedFieldPlayerIds: Set<string> | null = null;

    const { data: teeTimePlayers } = await supabase
      .from('sr_tee_time_players')
      .select('player_id, sr_tee_times!inner(tournament_id)')
      .eq('sr_tee_times.tournament_id', tournament.id);

    if (teeTimePlayers && teeTimePlayers.length > 10) {
      confirmedFieldPlayerIds = new Set(teeTimePlayers.map((t: any) => t.player_id));
      console.log(`[generate-predictions] Found ${confirmedFieldPlayerIds.size} confirmed entrants from tee times`);
    } else {
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

    // --- Fetch player statistics (with raw_data for detailed extraction) ---
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

    if (playerStats.length === 0) throw new Error('Failed to fetch player statistics from any season');

    // Fetch world rankings
    const { data: rankings } = await supabase
      .from('sr_world_rankings')
      .select('player_id, rank, prior_rank, points')
      .order('rank', { ascending: true })
      .limit(200);

    const rankingsMap = new Map(rankings?.map(r => [r.player_id, r]) || []);

    // Build player array with raw_data preserved
    const players: PlayerStats[] = playerStats
      .map(ps => {
        const player = ps.sr_players as any;
        const stats = (ps.raw_data as any)?.statistics || {};
        const ranking = rankingsMap.get(player.id);

        if (hasConfirmedField && !confirmedFieldPlayerIds!.has(player.id)) return null;
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
          raw_data: ps.raw_data,
        };
      })
      .filter((p): p is PlayerStats => p !== null)
      .sort((a, b) => a.world_rank - b.world_rank)
      .slice(0, hasConfirmedField ? 120 : 75);

    console.log(`[generate-predictions] Fetched ${players.length} players (field ${hasConfirmedField ? 'confirmed' : 'estimated'})`);

    // --- 2B: Fetch course history ---
    let courseHistoryData: { playerName: string; playerId: string; finishes: { year: number; position: number | null; score: number | null }[] }[] = [];
    // Also build venue results for venueHistory calculator
    let venueResults: Array<{ player_id: string; position: number | null; score: number | null; year: number; status: string | null }> = [];

    try {
      const { data: pastTournaments } = await supabase
        .from('sr_tournaments')
        .select('id, name, start_date')
        .eq('venue_name', tournament.venue_name)
        .eq('status', 'closed')
        .neq('id', tournament.id)
        .order('start_date', { ascending: false })
        .limit(5);

      if (pastTournaments && pastTournaments.length > 0) {
        const pastTournamentIds = pastTournaments.map(t => t.id);
        const playerIdSet = new Set(players.map(p => p.player_id));

        const { data: pastResults } = await supabase
          .from('sr_leaderboards')
          .select('player_id, tournament_id, position, score, status')
          .in('tournament_id', pastTournamentIds)
          .in('player_id', Array.from(playerIdSet));

        if (pastResults && pastResults.length > 0) {
          const historyByPlayer = new Map<string, { year: number; position: number | null; score: number | null }[]>();
          for (const result of pastResults) {
            const pt = pastTournaments.find(t => t.id === result.tournament_id);
            const year = pt ? new Date(pt.start_date).getFullYear() : 0;
            if (!historyByPlayer.has(result.player_id)) historyByPlayer.set(result.player_id, []);
            historyByPlayer.get(result.player_id)!.push({ year, position: result.position, score: result.score });

            // Also push to venueResults for the venue history calculator
            venueResults.push({
              player_id: result.player_id,
              position: result.position,
              score: result.score,
              year,
              status: (result as any).status || null,
            });
          }

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

    // --- 2C: Fetch recent form ---
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
                  { role: 'system', content: 'You are a golf research assistant. Provide concise, factual information. Focus on recent news, statistics, and expert opinions. Keep responses under 300 words. Be specific about player names and statistics.' },
                  { role: 'user', content: query },
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
        
        researchContext = `
## REAL-TIME RESEARCH (as of ${new Date().toISOString().split('T')[0]})

### Expert Picks & Betting Odds Movement
${researchResults[0]?.trim() || 'No recent expert picks available.'}

### Course History & Scoring Trends
${researchResults[1]?.trim() || 'No recent course history available.'}

### Injury News, Withdrawals & Field Updates
${researchResults[2]?.trim() || 'No injury news available.'}

### Weather Conditions Forecast
${researchResults[3]?.trim() || 'No weather forecast available.'}
`;

        console.log('[generate-predictions] Research context fetched successfully');
      } catch (err) {
        console.error('[generate-predictions] Perplexity research failed:', err);
      }
    } else {
      console.log('[generate-predictions] Skipping Perplexity research (no API key configured)');
    }

    // =============================================
    // STEP 4: V2 Data Enrichment Pipeline
    // =============================================

    console.log('[generate-predictions] Starting V2 data enrichment pipeline...');

    // --- 4A: Fetch Course DNA profile ---
    let courseDNA: any = null;
    try {
      const { data: dnaResult } = await supabase
        .from('course_dna_profiles')
        .select('*')
        .eq('venue_name', tournament.venue_name)
        .single();
      
      courseDNA = dnaResult;

      if (!courseDNA) {
        console.log('[generate-predictions] No course DNA profile — attempting on-the-fly build');
        try {
          await fetch(`${supabaseUrl}/functions/v1/build-course-dna`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ venueName: tournament.venue_name }),
          });
          const { data: freshDNA } = await supabase
            .from('course_dna_profiles')
            .select('*')
            .eq('venue_name', tournament.venue_name)
            .single();
          courseDNA = freshDNA;
        } catch (e) {
          console.warn('[generate-predictions] On-the-fly course DNA build failed:', e);
        }
      }

      if (courseDNA) {
        console.log(`[generate-predictions] Course DNA: ${courseDNA.course_type} for ${courseDNA.venue_name}`);
      }
    } catch (err) {
      console.warn('[generate-predictions] Course DNA fetch failed:', err);
    }

    // --- 4B: Extract detailed stats + derive SG proxies ---
    const recentFormMap = new Map(recentFormData.map(r => [r.playerId, r.results.map(res => ({
      tournament: res.tournament,
      position: res.position || 999,
      score: res.score || 0,
    }))]));

    const courseHistoryMap = new Map(courseHistoryData.map(c => [c.playerId, c.finishes.map(f => ({
      year: f.year,
      position: f.position || 999,
      score: f.score || 0,
    }))]));

    let enrichedPlayers: EnrichedPlayerStats[] = players.map((player) => {
      const extracted = extractPlayerStats(player.raw_data);
      return {
        playerId: player.player_id,
        playerName: `${player.first_name} ${player.last_name}`,
        ...extracted,
        sgPuttingProxy: null,
        sgApproachProxy: null,
        sgOffTeeProxy: null,
        sgAroundGreenProxy: null,
        worldRank: player.world_rank || null,
        priorRank: player.prior_rank || null,
        rankMomentum: (player.prior_rank && player.world_rank)
          ? player.prior_rank - player.world_rank : null,
        recentResults: recentFormMap.get(player.player_id) || [],
        venueHistory: courseHistoryMap.get(player.player_id) || [],
      };
    });

    // Derive SG proxies from field averages
    enrichedPlayers = deriveSGProxies(enrichedPlayers);
    console.log(`[generate-predictions] Enriched ${enrichedPlayers.length} players with detailed stats + SG proxies`);

    // --- 4C: Calculate course fit scores ---
    let courseFitScores = new Map<string, any>();
    let fitScoreMap = new Map<string, number>();

    if (courseDNA) {
      const dnaProfile: CourseDNAProfile = {
        venueName: courseDNA.venue_name,
        drivingDistanceImportance: courseDNA.driving_distance_importance || 0,
        drivingAccuracyImportance: courseDNA.driving_accuracy_importance || 0,
        girImportance: courseDNA.gir_importance || 0,
        scramblingImportance: courseDNA.scrambling_importance || 0,
        puttingImportance: courseDNA.putting_importance || 0,
        sgOffTeeImportance: courseDNA.sg_off_tee_importance || 0,
        sgApproachImportance: courseDNA.sg_approach_importance || 0,
        sgAroundGreenImportance: courseDNA.sg_around_green_importance || 0,
        sgPuttingImportance: courseDNA.sg_putting_importance || 0,
        courseType: courseDNA.course_type || 'balanced',
        avgWinningScore: courseDNA.avg_winning_score || null,
      };

      courseFitScores = calculateCourseFitScores(dnaProfile, enrichedPlayers);

      for (const [playerId, result] of courseFitScores) {
        fitScoreMap.set(playerId, result.fitScore);
      }

      console.log(`[generate-predictions] Calculated course fit for ${courseFitScores.size} players`);
    } else {
      console.log('[generate-predictions] No course DNA — skipping calculated fit scores');
    }

    // --- 4D: Calculate venue history scores ---
    const playerNameMap = new Map(players.map(p => [p.player_id, `${p.first_name} ${p.last_name}`]));
    const venueHistoryScores = calculateVenueHistoryScores(venueResults, playerNameMap);
    console.log(`[generate-predictions] Calculated venue history for ${venueHistoryScores.size} players`);

    // --- 4E: Build enriched prompt sections ---
    const fieldPlayerIds = players.map(p => p.player_id);

    const courseFitSection = courseFitScores.size > 0
      ? formatCourseFitForPrompt(courseFitScores, fieldPlayerIds, 30)
      : 'No calculated course fit data available.';

    const venueHistorySection = venueHistoryScores.size > 0
      ? formatVenueHistoryForPrompt(venueHistoryScores, fieldPlayerIds, 30)
      : 'No venue history data available.';

    // Build per-player detailed stats for prompt
    const detailedStatsSection = enrichedPlayers.slice(0, 40).map(p => {
      return `${p.playerName}: ${formatStatsForPrompt(p)}`;
    }).join('\n');

    // =============================================
    // STEP 5: Build Prompt & Run Consensus Engine
    // =============================================

    const prompt = buildAnalysisPrompt(
      tournament, players, researchContext, hasConfirmedField,
      courseHistoryData, recentFormData,
      courseFitSection, venueHistorySection, detailedStatsSection,
      courseDNA?.course_type || null,
    );

    console.log('[generate-predictions] Running consensus engine...');

    const consensus = await runConsensus(
      '', // system prompt is embedded in the user prompt
      prompt,
      fitScoreMap,
    );

    console.log(`[generate-predictions] Consensus complete: ${consensus.consensusMethod}, ${consensus.topContenders.length} contenders`);

    // =============================================
    // STEP 6: Enrich with Photo URLs & PGA Tour IDs + Override courseFitScore
    // =============================================

    const playerByIdMap = new Map(players.map(p => [p.player_id, p]));
    const playerByNameMap = new Map(players.map(p => [
      `${p.first_name} ${p.last_name}`.toLowerCase(), p
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

    const enrichedContenders = consensus.topContenders.map(tc => {
      const player = findPlayer(tc.playerId, tc.playerName);
      return {
        rank: tc.rank,
        playerId: player?.player_id || tc.playerId,
        playerName: tc.playerName,
        photoUrl: player?.photo_url || null,
        pgaTourId: player?.pga_tour_id || null,
        country: player?.country || 'USA',
        worldRanking: player?.world_rank || 999,
        winProbability: tc.winProbability,
        // CRITICAL: Use CALCULATED fit score, not AI-guessed
        courseFitScore: fitScoreMap.get(player?.player_id || tc.playerId) ?? tc.courseFitScore ?? null,
        reasons: tc.reasons,
        concern: '',
        isDarkHorse: tc.isDarkHorse,
        consensusScore: tc.consensusScore,
        modelVotes: tc.modelVotes,
      };
    });

    // =============================================
    // STEP 7: Store Predictions with Consensus Data
    // =============================================

    const displayPicks = enrichedContenders.slice(0, 5);
    const alternates = enrichedContenders.slice(5, 8);

    const { error: upsertError } = await supabase
      .from('ai_predictions')
      .upsert({
        tournament_id: tournament.id,
        predictions: displayPicks,
        dark_horses: alternates,
        course_analysis: consensus.courseAnalysis,
        confidence: consensus.consensusConfidence,
        model_version: 'consensus_v1',
        prompt_version: 'v4',
        consensus_data: {
          method: consensus.consensusMethod,
          agreementScore: consensus.agreementScore,
          modelResults: consensus.modelResults.map(r => ({
            model: r.model,
            success: r.success,
            latencyMs: r.latencyMs,
            picksCount: r.picks.length,
            picks: r.picks.map(p => ({ playerId: p.playerId, playerName: p.playerName, rank: p.rank })),
            error: r.error,
          })),
          courseDNA: courseDNA ? {
            courseType: courseDNA.course_type,
            venueName: courseDNA.venue_name,
          } : null,
          enrichmentStats: {
            playersEnriched: enrichedPlayers.length,
            courseFitCalculated: courseFitScores.size,
            venueHistoryCalculated: venueHistoryScores.size,
          },
        },
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

    console.log('[generate-predictions] Predictions stored successfully with consensus data');

    // =============================================
    // STEP 8: Return Response
    // =============================================

    return new Response(
      JSON.stringify({
        success: true,
        cached: false,
        hasResearch: !!researchContext,
        consensusMethod: consensus.consensusMethod,
        agreementScore: consensus.agreementScore,
        modelsUsed: consensus.modelResults.map(r => ({ model: r.model, success: r.success })),
        tournament: {
          id: tournament.id,
          name: tournament.name,
          venue: tournament.venue_name,
        },
        predictions: {
          topContenders: enrichedContenders,
          courseAnalysis: consensus.courseAnalysis,
          confidence: consensus.consensusConfidence,
        },
        generatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[generate-predictions] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// =============================================
// HELPER FUNCTIONS
// =============================================

function isPredictionStale(prediction: any): boolean {
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

function determineCourseType(tournament: Tournament, courseDNAType?: string | null): { type: string; description: string } {
  if (courseDNAType) {
    const typeMap: Record<string, { type: string; description: string }> = {
      bombers_paradise: { type: "Bomber's Paradise", description: 'Length off the tee creates significant advantage. Favors long hitters who can overpower the course.' },
      precision_track: { type: 'Precision Track', description: 'Tight fairways and small greens reward accuracy. Course management and iron play are critical.' },
      scrambling_course: { type: "Scrambler's Course", description: 'Short game separates contenders. Scrambling and putting are paramount.' },
      balanced: { type: 'Balanced Test', description: 'Rewards all aspects of the game. No single skill dominates.' },
      putting_paradise: { type: 'Putting Paradise', description: 'Greens are the great equalizer. Elite putting separates winners from the pack.' },
    };
    if (typeMap[courseDNAType]) return typeMap[courseDNAType];
  }

  const name = tournament.name.toLowerCase();
  const yardage = tournament.venue_yardage || 7200;
  const par = tournament.venue_par || 72;

  if (name.includes('masters') || name.includes('u.s. open') || 
      name.includes('open championship') || name.includes('pga championship')) {
    return { type: 'Major Championship', description: 'Demands excellence in all areas. Historically favors complete players with major experience and mental fortitude.' };
  }
  if (name.includes('players') || name.includes('memorial') || name.includes('arnold palmer')) {
    return { type: 'Signature Event', description: 'Elite field, premium course conditions. Rewards consistent ball-striking and course management.' };
  }
  if (yardage >= 7400) return { type: "Bomber's Paradise", description: 'Length off the tee creates significant advantage.' };
  if (yardage < 7100 || par <= 70) return { type: 'Precision Track', description: 'Tight fairways and small greens reward accuracy.' };
  return { type: 'Balanced Test', description: 'Well-rounded course that rewards all aspects of the game.' };
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
  courseHistoryData: any[] = [],
  recentFormData: any[] = [],
  courseFitSection: string = '',
  venueHistorySection: string = '',
  detailedStatsSection: string = '',
  courseDNAType: string | null = null,
): string {
  const courseType = determineCourseType(tournament, courseDNAType);
  
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

  let courseHistorySection = '';
  if (courseHistoryData.length > 0) {
    const historyLines = courseHistoryData.slice(0, 30).map((p: any) => {
      const finishStr = p.finishes.map((f: any) => `${f.year}: ${f.position ? `T${f.position}` : 'MC'} (${f.score ?? 'N/A'})`).join(', ');
      return `- ${p.playerName}: ${finishStr}`;
    }).join('\n');
    courseHistorySection = `
## COURSE HISTORY AT ${tournament.venue_name.toUpperCase()} (Last 5 Years)

${historyLines}

**IMPORTANT**: Heavily weight course history — players who have consistently performed well at this venue are statistically more likely to perform well again.
`;
  }

  let recentFormSection = '';
  if (recentFormData.length > 0) {
    const formLines = recentFormData.slice(0, 25).map((p: any) => {
      const resultStr = p.results.map((r: any) => `${r.tournament}: ${r.position ? `T${r.position}` : 'MC'}`).join(', ');
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
    : '**Note**: Confirmed field not yet available — pool is top players by world ranking. Some may not be in the field.';

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

## CALCULATED COURSE FIT SCORES (statistically derived from historical correlations — use as STRONG signal)
${courseFitSection}

## VENUE HISTORY SCORES (numerical composite with trend analysis)
${venueHistorySection}

## DETAILED PLAYER STATISTICS (with derived SG component estimates)
${detailedStatsSection}

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

## IMPORTANT: The courseFitScore values above are STATISTICALLY CALCULATED from historical correlations at this venue. 
Use them as a strong signal for your rankings. You may adjust ±10 points based on intangibles, but do not ignore them.

## ANALYSIS TASK

Create a comprehensive prediction with **exactly 8 contenders ranked 1-8**.
- Picks 1-5 are your top display picks.
- Picks 6-8 are ranked alternates.

Factor in ALL available data:
1. **Calculated Course Fit**: Use the statistically derived fit scores above as primary signal
2. **Course History**: Past performance at this specific venue (highest weight)
3. **Current Form**: Recent results and world ranking movement
4. **Real-Time Context**: Expert opinions, injuries, withdrawals, weather conditions
5. **Statistical Excellence**: Leaders in key categories for this course type
6. **Venue History Score**: Numerical venue history with trend analysis

## CRITICAL: NO GAMBLING LANGUAGE

Do NOT reference betting odds, spreads, lines, prices, or any gambling-related language.

## CRITICAL: TEXT LENGTH RULES

Each contender MUST have exactly 3 reasons. Each reason MUST be a COMPLETE sentence of 50 characters or less.

GOOD: "Won here in 2022 and 2023" (25 chars)
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
    "insight": "One compelling insight about course history",
    "skillsAnalysis": "Detailed 2-3 sentence explanation of key skills for this course.",
    "difficulty": "Easy/Moderate/Difficult"
  },
  "confidence": 0.75,
  "reasoning": "Brief explanation of your methodology"
}

## IMPORTANT RULES

1. **Use exact player IDs from the data provided** - do not make up IDs
2. **Provide exactly 8 top contenders** ranked 1-8
3. **Each contender MUST have exactly 3 reasons**
4. **Win probabilities should sum to approximately 60-80%** for all 8
5. **Be specific in reasons** - cite actual statistics and course history
6. **Course fit scores should be 1-100**
7. **Return ONLY valid JSON** - no markdown, no explanation outside the JSON
8. **No gambling language**

Provide your analysis now:`;
}
