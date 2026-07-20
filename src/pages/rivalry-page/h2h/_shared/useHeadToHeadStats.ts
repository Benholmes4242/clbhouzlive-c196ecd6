/**
 * useHeadToHeadStats — fetches lifetime + form data for both players in a
 * rivalry and composes the HeadToHeadStats payload consumed by the
 * HeadToHeadSection. Hidden (returns null) when the rival is a non-Clbhouz
 * friend (no rivalUserId).
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchTrophyAggregates, fetchHandicapHistory } from '@/lib/whs/api';
import type { HeadToHeadStats, PlayerStats } from '@/pages/rivalry-page/h2h/_shared/h2hStats';

const MS_PER_DAY = 86_400_000;
const TARGET_DAYS = 90;
const MIN_HISTORY_DAYS = 80;

interface GamRow {
  user_id: string;
  play_date: string;
  gross_score: number | null;
  stableford_points: number | null;
  sub_80: boolean | null;
  sub_70: boolean | null;
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

function compute90dDeltaFromHistory(
  history: { observed_at: string; handicap_index: number | null }[],
  current: number | null,
): number | null {
  if (current === null || history.length === 0) return null;

  const now = Date.now();
  const earliestTs = new Date(history[0].observed_at).getTime();
  if (now - earliestTs < MIN_HISTORY_DAYS * MS_PER_DAY) return null;

  const targetTs = now - TARGET_DAYS * MS_PER_DAY;
  let closest = history[0];
  let closestDiff = Math.abs(new Date(closest.observed_at).getTime() - targetTs);
  for (const pt of history) {
    const diff = Math.abs(new Date(pt.observed_at).getTime() - targetTs);
    if (diff < closestDiff) {
      closest = pt;
      closestDiff = diff;
    }
  }

  const past = Number(closest.handicap_index);
  if (!Number.isFinite(past)) return null;

  return Math.round((current - past) * 10) / 10;
}


function summariseGam(rows: GamRow[]): {
  sub80_rounds: number;
  best_stableford: number | null;
  lowest_net: number | null;
  last5_avg_vs_par: number | null;
  is_hot: boolean;
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

  let lowest_net: number | null = null;
  for (const r of eighteen) {
    if (
      r.gross_score == null ||
      r.hcp_at_time == null ||
      !Number.isFinite(r.gross_score) ||
      !Number.isFinite(r.hcp_at_time)
    )
      continue;
    const net = r.gross_score - Math.round(r.hcp_at_time);
    if (lowest_net == null || net < lowest_net) lowest_net = net;
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

  let hotCount = 0;
  for (const r of last5) {
    if (
      r.gross_score == null ||
      r.course_par == null ||
      r.hcp_at_time == null
    )
      continue;
    const net = r.gross_score - Math.round(r.hcp_at_time);
    if (net <= r.course_par + 2) hotCount += 1;
  }
  const is_hot = hotCount >= 3;

  return { sub80_rounds, best_stableford, lowest_net, last5_avg_vs_par: avg, is_hot };
}

export function useHeadToHeadStats(
  viewerId: string | undefined,
  viewerConnectionId: string | undefined,
  rivalUserId: string | null | undefined,
  rivalName: string | null | undefined,
  bestMargins: { me: number | null; them: number | null },
) {
  return useQuery({
    queryKey: ['h2h-stats', viewerId, rivalUserId],
    enabled: !!viewerId && !!viewerConnectionId && !!rivalUserId,
    staleTime: 60_000,
    queryFn: async (): Promise<
      (HeadToHeadStats & { meBestMargin: number | null; themBestMargin: number | null }) | null
    > => {
      if (!viewerId || !viewerConnectionId || !rivalUserId) return null;

      // 1. Rival's connection (any one)
      const { data: rivalConn } = await supabase
        .from('whs_connections' as never)
        .select('id')
        .eq('user_id', rivalUserId)
        .limit(1)
        .maybeSingle();
      const rivalConnectionId = (rivalConn as { id?: string } | null)?.id as string | undefined;

      // 2. Both TrophyAggregates in parallel
      const [meAgg, themAgg] = await Promise.all([
        fetchTrophyAggregates(viewerId, viewerConnectionId),
        rivalConnectionId
          ? fetchTrophyAggregates(rivalUserId, rivalConnectionId)
          : Promise.resolve(null),
      ]);

      // 3. gam_round_stats for both users
      const { data: gamRows } = await supabase
        .from('gam_round_stats' as never)
        .select(
          'user_id, play_date, gross_score, stableford_points, sub_80, sub_70, beat_par, course_par, hcp_at_time, holes_played',
        )
        .in('user_id', [viewerId, rivalUserId]);
      const gam = (gamRows as unknown as GamRow[]) ?? [];
      const meGam = gam.filter((r) => r.user_id === viewerId);
      const themGam = gam.filter((r) => r.user_id === rivalUserId);

      // 4. Handicap history (snapshots ∪ score-derived) for both connections
      const [meHistory, themHistory] = await Promise.all([
        fetchHandicapHistory(viewerConnectionId, 'all'),
        rivalConnectionId
          ? fetchHandicapHistory(rivalConnectionId, 'all')
          : Promise.resolve([] as Awaited<ReturnType<typeof fetchHandicapHistory>>),
      ]);

      const meCurrent =
        meHistory.length > 0
          ? (() => {
              const v = Number(meHistory[meHistory.length - 1].handicap_index);
              return Number.isFinite(v) ? v : null;
            })()
          : null;
      const themCurrent =
        themHistory.length > 0
          ? (() => {
              const v = Number(themHistory[themHistory.length - 1].handicap_index);
              return Number.isFinite(v) ? v : null;
            })()
          : null;

      const meDelta = compute90dDeltaFromHistory(meHistory, meCurrent);
      const themDelta = compute90dDeltaFromHistory(themHistory, themCurrent);


      // ── Compose ─────────────────────────────────────────────────────
      const me: PlayerStats = emptyPlayer();
      const them: PlayerStats = emptyPlayer();

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

      const meGamSummary = summariseGam(meGam);
      const themGamSummary = summariseGam(themGam);
      me.sub80_rounds = meGamSummary.sub80_rounds;
      me.best_stableford = meGamSummary.best_stableford;
      me.lowest_net = meGamSummary.lowest_net;
      me.last5_avg_vs_par = meGamSummary.last5_avg_vs_par;
      me.is_hot = meGamSummary.is_hot;
      them.sub80_rounds = themGamSummary.sub80_rounds;
      them.best_stableford = themGamSummary.best_stableford;
      them.lowest_net = themGamSummary.lowest_net;
      them.last5_avg_vs_par = themGamSummary.last5_avg_vs_par;
      them.is_hot = themGamSummary.is_hot;

      me.handicap_index = meCurrent;
      them.handicap_index = themCurrent;
      me.delta90 = meDelta;
      them.delta90 = themDelta;

      return {
        me,
        them,
        meBestMargin: bestMargins.me,
        themBestMargin: bestMargins.them,
        rivalName: rivalName ?? 'Rival',
      };
    },
  });
}
