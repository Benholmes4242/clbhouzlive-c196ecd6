/**
 * BRIEF_ONE_INDEX_CHART — the member's last five rounds, shared by the profile
 * Last five rounds rail and the three index charts, so every surface marks the
 * same five in the same colours. Selection = formBars over full 18-hole rows
 * (newest five, oldest first); counting = countsTowardIndex (is_counter), and
 * counting is "known" only when some row carries is_counter.
 */
import { useMemo } from 'react';
import { countsTowardIndex } from '@/lib/whs/counting';
import { formBars, type FormBar, type FormScoreLike } from '@/features/profile-sheet-v2/sheetState';
import { isFullEighteen, useProfileRounds, type ProfileRound } from '@/components/profile/rounds/useProfileRounds';

export interface ChartRound { id: string; date: string; counts: boolean }
export interface LastFive {
  bars: FormBar[];
  byId: Map<string, ProfileRound>;
  countingKnown: boolean;
  countingIds: Set<string>;
  countingN: number;
  /** For IndexWindowChart: counts is false whenever counting is unknown. */
  rounds: ChartRound[];
}

export function lastFiveRounds(rows: ProfileRound[] | null | undefined, currentIndex: number | null): LastFive {
  // isFullEighteen FIRST: formBars only tests !is_nine_hole, and a NULL from a
  // missing whs join would slip through it.
  const fullRows = (rows ?? []).filter(isFullEighteen);
  const byId = new Map(fullRows.map((r) => [r.whs_score_id, r]));
  const bars = formBars(
    fullRows.map((r): FormScoreLike => ({
      id: r.whs_score_id,
      play_date: r.play_date,
      handicap_differential: r.handicap_differential,
      handicap_index_at_time: r.handicap_index_at_time,
      is_nine_hole: !!r.is_nine_hole,
    })),
    currentIndex,
  );
  const barRows = bars.map((b) => byId.get(b.id));
  const countingKnown = barRows.some((r) => r?.is_counter != null);
  const countingIds = new Set(bars.filter((_b, i) => { const r = barRows[i]; return r ? countsTowardIndex(r) : false; }).map((b) => b.id));
  const countingN = barRows.filter((r) => r && countsTowardIndex(r)).length;
  const rounds = bars.map((b) => ({ id: b.id, date: b.date, counts: countingKnown && countingIds.has(b.id) }));
  return { bars, byId, countingKnown, countingIds, countingN, rounds };
}

/** The chart-only view: the five rounds with counting flags, for surfaces without the rail. */
export function useLastFiveChartRounds(userId: string | null | undefined): ChartRound[] {
  const q = useProfileRounds(userId ?? undefined);
  return useMemo(() => (q.isSuccess ? lastFiveRounds(q.data, null).rounds : []), [q.isSuccess, q.data]);
}
