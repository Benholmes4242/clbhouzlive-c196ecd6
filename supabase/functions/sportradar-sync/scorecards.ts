/** Scorecard pull for one tour event. Each player's round is ONE upsert of up
 * to 18 rows; a hole without positive strokes is stored with null strokes and
 * null score_to_par (never 0), so a later final pull overwrites it. */
export interface ScorecardDeps {
  fetchJson: (url: string, description: string) => Promise<any>;
  baseUrl: (tour: string) => string;
}

export function scorecardRows(tournamentId: string, playerId: string, round: number, holes: any[]) {
  return holes.map((hole: any) => {
    const played = typeof hole.strokes === 'number' && hole.strokes > 0;
    return {
      tournament_id: tournamentId,
      player_id: playerId,
      round_number: round,
      hole_number: hole.number,
      strokes: played ? hole.strokes : null,
      par: hole.par,
      score_to_par: played ? hole.strokes - (hole.par || 0) : null,
      raw_data: hole,
    };
  });
}

export async function syncScorecardsWith(
  supabase: any,
  deps: ScorecardDeps,
  tour: string,
  year: number,
  tournamentSrId: string, 
  roundType: string = 'rounds',
  roundNumber?: number
) {
  if (!tournamentSrId) {
    return { records: 0, message: 'Tournament ID required', debug: { error: 'missing_tournament_id' } };
  }

  const { data: tournament } = await supabase
    .from('sr_tournaments')
    .select('id')
    .eq('sr_id', tournamentSrId)
    .maybeSingle();

  if (!tournament) {
    return { records: 0, message: 'Tournament not found in database', debug: { tournamentSrId } };
  }

  let totalRecords = 0;
  const roundsToFetch = roundNumber ? [roundNumber] : [1, 2, 3, 4];
  const debugInfo: any[] = [];

  for (const round of roundsToFetch) {
    // Per docs: /{year}/tournaments/{id}/rounds/{round_number}/scores.json
    const roundPadded = String(round).padStart(2, '0');
    const url = `${deps.baseUrl(tour)}/${year}/tournaments/${tournamentSrId}/${roundType}/${roundPadded}/scores.json`;
    
    try {
      const data = await deps.fetchJson(url, `Scorecards R${round}`);
      debugInfo.push({ round, url, status: 'success' });

      const players = data.players || data.round?.players || [];
      for (const playerEntry of players) {
        const player = playerEntry.player || playerEntry;
        const playerSrId = player.id;
        
        if (!playerSrId) continue;

        let playerId: string | null = null;
        const { data: existingPlayer } = await supabase
          .from('sr_players')
          .select('id')
          .eq('sr_id', playerSrId)
          .maybeSingle();

        if (existingPlayer) {
          playerId = existingPlayer.id;
        } else {
          const { data: newPlayer } = await supabase.from('sr_players').insert({
            sr_id: playerSrId,
            first_name: player.first_name,
            last_name: player.last_name,
            full_name: `${player.first_name || ''} ${player.last_name || ''}`.trim(),
            raw_data: player,
          }).select().single();
          playerId = newPlayer?.id;
        }

        // Store hole-by-hole scores
        const holes = playerEntry.scores || playerEntry.holes || [];
        if (playerId && holes.length > 0) {
          const rows = scorecardRows(tournament.id, playerId, round, holes);
          const { error } = await supabase.from('sr_scorecards').upsert(rows, { onConflict: 'tournament_id,player_id,round_number,hole_number' });
          if (!error) totalRecords += rows.length;
        }

        // Also store round-level aggregates if available
        // Sportradar v3 may nest stats at top level OR under .statistics
        const stats = playerEntry.statistics || {};
        const hasRoundData = (
          playerEntry.score !== undefined || playerEntry.strokes !== undefined ||
          playerEntry.birdies !== undefined || stats.birdies !== undefined
        );
        if (playerId && hasRoundData) {
          const roundUpdate: Record<string, any> = {
            round_score:   playerEntry.score       ?? stats.score       ?? null,
            round_strokes: playerEntry.strokes     ?? stats.strokes     ?? null,
            thru:          playerEntry.thru         ?? stats.thru        ?? null,
            birdies:       playerEntry.birdies      ?? stats.birdies     ?? null,
            bogeys:        playerEntry.bogeys       ?? stats.bogeys      ?? null,
            eagles:        playerEntry.eagles        ?? stats.eagles      ?? null,
            pars:          playerEntry.pars          ?? stats.pars        ?? null,
            double_bogeys: playerEntry.double_bogeys ?? stats.double_bogeys ?? null,
            holes_in_one:  playerEntry.holes_in_one  ?? stats.holes_in_one  ?? null,
            other_scores:  playerEntry.other_scores  ?? stats.other_scores  ?? null,
            starting_hole: playerEntry.starting_hole ?? stats.starting_hole ?? null,
          };
          console.log(`[Scorecards] Round ${round} stats for ${player.first_name} ${player.last_name}: birdies=${roundUpdate.birdies}, eagles=${roundUpdate.eagles}, score=${roundUpdate.round_score}`);
          await supabase.from('sr_scorecards')
            .update(roundUpdate)
            .eq('tournament_id', tournament.id)
            .eq('player_id', playerId)
            .eq('round_number', round)
            .eq('hole_number', 1);
        }
      }
    } catch (e) {
      debugInfo.push({ round, url, status: 'error', error: e.message });
      console.log(`Round ${round} scorecards not available: ${e.message}`);
    }
  }

  return { 
    records: totalRecords, 
    message: `Synced ${totalRecords} scorecard entries`,
    debug: { rounds: debugInfo }
  };
}
