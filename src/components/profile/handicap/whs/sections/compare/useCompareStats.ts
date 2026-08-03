/**
 * useCompareStats - MOVED here from the deleted rivalry page's
 * useHeadToHeadStats, trimmed to what the compare sheet needs.
 *
 * Fetches both sides' aggregates and form so the sheet can render season
 * figures even when the two members have NEVER shared a round (Mode 2). Best
 * margin is no longer threaded in: the sheet derives it from the shared-round
 * results it already has.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchTrophyAggregates, fetchHandicapHistory } from '@/lib/whs/api';
import type { HeadToHeadStats, PlayerStats } from './h2hStats';

interface GamRow {
  user_id: string;
  play_date: string;
  gross_score: number | null;
  stableford_points: number | null;
  sub_80: boolean | null;
  beat_par: boolean | null;
  course_par: number | null;
  hcp_at_time: number | null;
  holes_played?: number | null;
}

function emptyPlayer(): PlayerStats {
  return {
    birdies: 0,
    eagles: 0,
    albatrosses: 0,
    aces: 0,
    sub80_rounds: 0,
    sub_par_rounds: 0,
    top100_played: 0,
    rounds_played: 0,
    lowest_gross: null,
    best_stableford: null,
    lowest_net: null,
    handicap_index: null,
    delta90: null,
    last5_avg_vs_par: null,
    is_hot: false,
  };
}

function summariseGam(rows: GamRow[]): {
  sub80_rounds: number;
  best_stableford: number | null;
  last5_avg_vs_par: number | null;
} {
  const eighteen = rows.filter((r) => (r.holes_played ?? 18) === 18);
  const sub80_rounds = eighteen.filter((r) => r.sub_80 === true).length;

  let best_stableford: number | null = null;
  for (const r of eighteen) {
    if (r.stableford_points != null && Number.isFinite(r.stableford_points)) {
      if (best_stableford == null || r.stableford_points > best_stableford) {
        best_stableford = r.stableford_points;
      }
    }
  }

  const last5 = [...eighteen]
    .sort((a, b) => (b.play_date || '').localeCompare(a.play_date || ''))
    .slice(0, 5);

  let avg: number | null = null;
  if (last5.length > 0) {
    const diffs = last5
      .filter((r) => r.gross_score != null && r.course_par != null)
      .map((r) => (r.gross_score as number) - (r.course_par as number));
    if (diffs.length > 0) {
      const sum = diffs.reduce((a, b) => a + b, 0);
      avg = Math.round((sum / diffs.length) * 10) / 10;
    }
  }

  return { sub80_rounds, best_stableford, last5_avg_vs_par: avg };
}

export function useCompareStats(
  viewerId: string | undefined,
  viewerConnectionId: string | undefined,
  targetUserId: string | null | undefined,
  targetName: string | null | undefined,
) {
  return useQuery({
    queryKey: ['handicap-compare-stats', viewerId, targetUserId],
    enabled: !!viewerId && !!viewerConnectionId && !!targetUserId,
    staleTime: 60_000,
    queryFn: async (): Promise<HeadToHeadStats | null> => {
      if (!viewerId || !viewerConnectionId || !targetUserId) return null;

      const { data: targetConn } = await supabase
        .from('whs_connections' as never)
        .select('id')
        .eq('user_id', targetUserId)
        .limit(1)
        .maybeSingle();
      const targetConnectionId = (targetConn as { id?: string } | null)?.id as
        | string
        | undefined;

      const [meAgg, themAgg] = await Promise.all([
        fetchTrophyAggregates(viewerId, viewerConnectionId),
        targetConnectionId
          ? fetchTrophyAggregates(targetUserId, targetConnectionId)
          : Promise.resolve(null),
      ]);

      const { data: gamRows } = await supabase
        .from('gam_round_stats' as never)
        .select(
          'user_id, play_date, gross_score, stableford_points, sub_80, beat_par, course_par, hcp_at_time, holes_played',
        )
        .in('user_id', [viewerId, targetUserId]);
      const gam = (gamRows as unknown as GamRow[]) ?? [];

      const [meHistory, themHistory] = await Promise.all([
        fetchHandicapHistory(viewerConnectionId, 'all'),
        targetConnectionId
          ? fetchHandicapHistory(targetConnectionId, 'all')
          : Promise.resolve(
              [] as Awaited<ReturnType<typeof fetchHandicapHistory>>,
            ),
      ]);

      const latestIndex = (
        history: Awaited<ReturnType<typeof fetchHandicapHistory>>,
      ): number | null => {
        if (history.length === 0) return null;
        const v = Number(history[history.length - 1].handicap_index);
        return Number.isFinite(v) ? v : null;
      };

      const me = emptyPlayer();
      const them = emptyPlayer();

      if (meAgg) {
        me.birdies = meAgg.hole_stats.birdies_count ?? 0;
        me.eagles = meAgg.hole_stats.eagles_count ?? 0;
        me.albatrosses = meAgg.hole_stats.albatross_count ?? 0;
        me.aces = meAgg.hole_stats.aces_count ?? 0;
        me.sub_par_rounds = meAgg.hole_stats.sub_par_rounds_count ?? 0;
        me.rounds_played = meAgg.hole_stats.total_rounds_count ?? 0;
        me.lowest_gross = meAgg.hole_stats.best_gross ?? null;
        me.top100_played = meAgg.course_stats.top100_lists?.global ?? 0;
      }
      if (themAgg) {
        them.birdies = themAgg.hole_stats.birdies_count ?? 0;
        them.eagles = themAgg.hole_stats.eagles_count ?? 0;
        them.albatrosses = themAgg.hole_stats.albatross_count ?? 0;
        them.aces = themAgg.hole_stats.aces_count ?? 0;
        them.sub_par_rounds = themAgg.hole_stats.sub_par_rounds_count ?? 0;
        them.rounds_played = themAgg.hole_stats.total_rounds_count ?? 0;
        them.lowest_gross = themAgg.hole_stats.best_gross ?? null;
        them.top100_played = themAgg.course_stats.top100_lists?.global ?? 0;
      }

      const meSummary = summariseGam(gam.filter((r) => r.user_id === viewerId));
      const themSummary = summariseGam(
        gam.filter((r) => r.user_id === targetUserId),
      );
      me.sub80_rounds = meSummary.sub80_rounds;
      me.best_stableford = meSummary.best_stableford;
      me.last5_avg_vs_par = meSummary.last5_avg_vs_par;
      them.sub80_rounds = themSummary.sub80_rounds;
      them.best_stableford = themSummary.best_stableford;
      them.last5_avg_vs_par = themSummary.last5_avg_vs_par;

      me.handicap_index = latestIndex(meHistory);
      them.handicap_index = latestIndex(themHistory);

      return { me, them, rivalName: targetName ?? 'Player' };
    },
  });
}
