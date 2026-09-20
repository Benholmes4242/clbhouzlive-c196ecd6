import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrencyUsd } from '@/i18n/format';
import { currentSeasonYear } from '../leaders-v2/data/useLeaderCategories';
import { isMissedCut, isNonStarter, isWithdrawn, normalizeStatus } from '../_shared/resultStatus';

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
  /** The season the tournament belongs to (sr_tournaments -> sr_seasons.year). */
  season_year: number | null;
}

export interface PlayerResultsOptions {
  /**
   * 'current' returns only the current season's results (the season resolution
   * is currentSeasonYear(), the single definition shared with the statistics
   * read — do not add another). 'all' is the default so existing callers keep
   * their history behaviour.
   *
   * Anything rendered under a heading that says "the season" must ask for
   * 'current': results carry no season of their own downstream, so an
   * unfiltered read silently presents last season's numbers as this season's.
   */
  season?: 'current' | 'all';
}

/**
 * Hook to fetch a player's tournament results from sr_leaderboards
 * Returns the player's finish positions, scores, and earnings for recent tournaments
 */
export function usePlayerResults(
  playerId: string | undefined,
  limit = 10,
  options: PlayerResultsOptions = {},
) {
  const season = options.season ?? 'all';
  const seasonYear = currentSeasonYear();
  return useQuery({
    queryKey: ['tourhub', 'player-results', playerId, limit, season, seasonYear],
    queryFn: async () => {
      if (!playerId) return [];

      // Query leaderboards for this player, joined with tournament info.
      // We fetch generously so the limit doesn't cut off genuinely-recent
      // tournaments before we sort client-side.
      const join = season === 'current' ? 'sr_tournaments!inner' : 'sr_tournaments';
      const seasonJoin = season === 'current' ? 'sr_seasons!inner' : 'sr_seasons';
      let query = supabase
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
          tournament:${join}(
            name,
            start_date,
            end_date,
            season:${seasonJoin}(year)
          )
        `)
        .eq('player_id', playerId);
      if (season === 'current') {
        query = query.eq('tournament.season.year', seasonYear);
      }
      const { data, error } = await query.limit(Math.max(limit * 3, 60));

      if (error) throw error;

      const mapped = (data || []).map(row => ({
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
        season_year: (row.tournament as any)?.season?.year ?? null,
      })) as PlayerTournamentResult[];

      return mapped
        .filter(r => r.tournament_end_date)
        .sort(
          (a, b) =>
            new Date(b.tournament_end_date).getTime() -
            new Date(a.tournament_end_date).getTime()
        )
        .slice(0, limit);
    },
    enabled: !!playerId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Format position for display (e.g., "1st", "T3", "MC")
 */
export function formatPosition(position: number | null, tied: boolean | null, status: string | null): string {
  // Status vocabulary: _shared/resultStatus.ts. Stored values are UPPER CASE;
  // the old lower-case 'cut' comparison matched nothing and fell through to the
  // numeric position, so a missed cut at 69 read as a 69th-place finish.
  if (isMissedCut(status)) return 'MC';
  if (isWithdrawn(status)) return normalizeStatus(status) === 'DQ' ? 'DQ' : 'WD';
  if (isNonStarter(status)) return 'DNS';
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
  if (isMissedCut(status)) return 'MC';
  if (isWithdrawn(status)) return normalizeStatus(status) === 'DQ' ? 'DQ' : 'WD';
  if (isNonStarter(status)) return 'DNS';
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
  return formatCurrencyUsd(money);
}
