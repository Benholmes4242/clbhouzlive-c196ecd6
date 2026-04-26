/**
 * usePickHistory — Fetches completed tournaments with AI predictions + actual winners
 * for the Pick Record rail on the results view.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isMajor } from '../utils/majorScope';

export interface PickHistoryEntry {
  tournamentId: string;
  tournamentName: string;
  shortName: string;
  topPickName: string;
  topPickPlayerId: string;
  predictedRank: number;
  actualPosition: number | null;
  actualPositionTied: boolean;
  isWinner: boolean;
  scoreToPar: number | null;
  year: string;
}

/** Extract a short display name from a full tournament name */
function getShortName(name: string): string {
  const skipWords = new Set(['open', 'classic', 'invitational', 'championship', 'tournament', 'the', 'at']);
  const words = name.split(/\s+/).filter(Boolean);
  for (const w of words) {
    if (!skipWords.has(w.toLowerCase()) && w.length > 2) return w;
  }
  return words[0] ?? name;
}

export function usePickHistory() {
  return useQuery({
    queryKey: ['tourhub', 'pick-history'],
    queryFn: async (): Promise<PickHistoryEntry[]> => {
      // Step 0: Get PGA season IDs (same approach as useAIPredictions)
      const { data: seasons } = await supabase
        .from('sr_seasons')
        .select('id')
        .eq('tour_name', 'pga')
        .order('year', { ascending: false })
        .limit(3);

      const pgaSeasonIds = (seasons || []).map((s: any) => s.id);
      if (!pgaSeasonIds.length) return [];

      // Also fetch EURO season IDs so cross-tour majors (e.g. The Masters) are included
      const { data: euroSeasons } = await supabase
        .from('sr_seasons')
        .select('id')
        .eq('tour_name', 'EURO')
        .order('year', { ascending: false })
        .limit(3);

      const euroSeasonIds = (euroSeasons || []).map((s: any) => s.id);
      const allSeasonIds = [...pgaSeasonIds, ...euroSeasonIds];

      // Step 1: fetch predictions with tournament data (PGA + cross-tour majors)
      const { data: predRows, error: predError } = await supabase
        .from('ai_predictions')
        .select(`
          tournament_id,
          predictions,
          sr_tournaments!inner(
            id, name, status, start_date, season_id
          )
        `)
        .in('sr_tournaments.status', ['closed', 'complete'])
        .in('sr_tournaments.season_id', allSeasonIds)
        .order('sr_tournaments(start_date)', { ascending: false })
        .limit(15);

      if (predError) {
        console.error('usePickHistory predictions error:', predError);
        return [];
      }
      if (!predRows?.length) return [];

      const tournamentIds = predRows.map(r => r.tournament_id);

      // Step 2: batch fetch ALL leaderboard data for all tournaments at once
      const { data: leaderboardData } = await supabase
        .from('sr_leaderboards')
        .select('tournament_id, position, position_tied, score, sr_players!inner(sr_id, full_name)')
        .in('tournament_id', tournamentIds)
        .not('position', 'is', null);

      // Build lookup: tournamentId -> { bySrId, byName }
      const lbByTournament = new Map<string, {
        bySrId: Map<string, { position: number; tied: boolean; score: number | null }>;
        byName: Map<string, { position: number; tied: boolean; score: number | null }>;
      }>();

      for (const row of (leaderboardData || [])) {
        const tid = row.tournament_id;
        if (!lbByTournament.has(tid)) {
          lbByTournament.set(tid, { bySrId: new Map(), byName: new Map() });
        }
        const maps = lbByTournament.get(tid)!;
        const srId = (row.sr_players as any)?.sr_id;
        const fullName = (row.sr_players as any)?.full_name;
        const entry = { position: row.position, tied: row.position_tied || false, score: (row as any).score ?? null };
        if (srId) maps.bySrId.set(srId, entry);
        if (fullName) maps.byName.set(fullName.toLowerCase(), entry);
      }

      // Step 3: build entries using pre-built leaderboard maps
      const entries: PickHistoryEntry[] = [];

      for (const row of predRows) {
        const tournament = (row as any).sr_tournaments;
        if (!tournament) continue;

        // For EURO season tournaments, only include majors (e.g. The Masters)
        if (euroSeasonIds.includes(tournament.season_id) && !isMajor(tournament.name || '')) continue;

        const rawPredictions = (row.predictions as any[]) || [];
        const maps = lbByTournament.get(row.tournament_id);
        if (!maps) continue;

        // Check ALL picks against leaderboard, find the best finisher
        let bestPick: {
          playerName: string;
          playerId: string;
          predictedRank: number;
          actualPosition: number | null;
          actualPositionTied: boolean;
          isWinner: boolean;
          scoreToPar: number | null;
        } | null = null;

        for (const pick of rawPredictions) {
          const playerName: string = pick.playerName || pick.player_name || pick.name || '';
          const playerId: string = String(pick.playerId || pick.pgaTourId || '');
          const predictedRank: number = pick.rank || pick.predictedRank || 99;
          if (!playerName) continue;
          if (predictedRank > 3) continue;  // Only count top 3 picks

          const lbEntry = maps.bySrId.get(playerId)
            ?? maps.byName.get(playerName.toLowerCase());

          const actualPosition = lbEntry?.position ?? null;
          const actualPositionTied = lbEntry?.tied ?? false;
          const isWinner = actualPosition === 1;
          const scoreToPar = lbEntry?.score ?? null;

          // Keep this pick if it finished better than current best
          // Null positions (MC/WD) are treated as worst
          if (
            bestPick === null ||
            (actualPosition !== null && (bestPick.actualPosition === null || actualPosition < bestPick.actualPosition))
          ) {
            bestPick = { playerName, playerId, predictedRank, actualPosition, actualPositionTied, isWinner, scoreToPar };
          }
        }

        if (!bestPick) continue;

        entries.push({
          tournamentId: row.tournament_id,
          tournamentName: tournament.name || '',
          shortName: getShortName(tournament.name || ''),
          topPickName: bestPick.playerName,
          topPickPlayerId: bestPick.playerId,
          predictedRank: bestPick.predictedRank,
          actualPosition: bestPick.actualPosition,
          actualPositionTied: bestPick.actualPositionTied,
          isWinner: bestPick.isWinner,
          scoreToPar: bestPick.scoreToPar,
          year: tournament.start_date
            ? new Date(tournament.start_date).getFullYear().toString()
            : new Date().getFullYear().toString(),
        });
      }

      return entries.filter(e => e.topPickName);
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}
