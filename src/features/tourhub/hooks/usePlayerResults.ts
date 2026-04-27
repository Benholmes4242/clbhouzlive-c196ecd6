import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PlayerTournamentResult {
  id: string;
  tournament_id: string;
  tournament_name: string;
  tournament_start_date: string;
  tournament_end_date: string;
  position: number | null;
  position_tied: boolean | null;
  score: number | null;
  strokes: number | null;
  money: number | null;
  status: string | null;
}

/**
 * Hook to fetch a player's tournament results from sr_leaderboards
 * Returns the player's finish positions, scores, and earnings for recent tournaments
 */
export function usePlayerResults(playerId: string | undefined, limit = 10) {
  return useQuery({
    queryKey: ['tourhub', 'player-results', playerId, limit],
    queryFn: async () => {
      if (!playerId) return [];
      
      // Query leaderboards for this player, joined with tournament info.
      // Order by the joined tournament's end_date (most recently played first)
      // — D19 fix. Previously ordered by created_at which tracks ingest order.
      const { data, error } = await supabase
        .from('sr_leaderboards')
        .select(`
          id,
          tournament_id,
          position,
          position_tied,
          score,
          strokes,
          money,
          status,
          tournament:sr_tournaments(
            name,
            start_date,
            end_date
          )
        `)
        .eq('player_id', playerId)
        .order('end_date', { foreignTable: 'sr_tournaments', ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Error fetching player results:', error);
        return [];
      }
      
      // Transform to flat structure
      return (data || []).map(row => ({
        id: row.id,
        tournament_id: row.tournament_id,
        tournament_name: (row.tournament as any)?.name || 'Unknown Tournament',
        tournament_start_date: (row.tournament as any)?.start_date || '',
        tournament_end_date: (row.tournament as any)?.end_date || '',
        position: row.position,
        position_tied: row.position_tied,
        score: row.score,
        strokes: row.strokes,
        money: row.money,
        status: row.status,
      })) as PlayerTournamentResult[];
    },
    enabled: !!playerId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Format position for display (e.g., "1st", "T3", "MC")
 */
export function formatPosition(position: number | null, tied: boolean | null, status: string | null): string {
  if (status === 'cut' || status === 'MC') return 'MC';
  if (status === 'WD') return 'WD';
  if (status === 'DQ') return 'DQ';
  if (position === null) return '—';
  
  const prefix = tied ? 'T' : '';
  
  if (position === 1) return `${prefix}1st`;
  if (position === 2) return `${prefix}2nd`;
  if (position === 3) return `${prefix}3rd`;
  return `${prefix}${position}th`;
}

/**
 * Format position WITHOUT ordinal suffix (e.g., "1", "T2", "T46", "MC").
 * Use in dense tabular contexts (Recent Tournaments) where ordinals add visual noise.
 *
 * IMPORTANT (Rule 28 — format changes are interface changes): consumers must
 * NOT string-match against this output to detect wins. Compare numeric
 * `position === 1` directly instead.
 */
export function formatPositionShort(position: number | null, tied: boolean | null, status: string | null): string {
  if (status === 'cut' || status === 'MC') return 'MC';
  if (status === 'WD') return 'WD';
  if (status === 'DQ') return 'DQ';
  if (position === null) return '—';
  const prefix = tied ? 'T' : '';
  return `${prefix}${position}`;
}

/**
 * Format score relative to par (e.g., "-12", "E", "+3")
 */
export function formatScore(score: number | null): string {
  if (score === null) return '—';
  if (score === 0) return 'E';
  return score > 0 ? `+${score}` : String(score);
}

/**
 * Format money/earnings
 */
export function formatMoney(money: number | null): string {
  if (money === null || money === 0) return '—';
  if (money >= 1_000_000) {
    return `$${(money / 1_000_000).toFixed(2)}M`;
  }
  return `$${money.toLocaleString()}`;
}
