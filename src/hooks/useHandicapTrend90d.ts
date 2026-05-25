/**
 * useHandicapTrend90d — 90-day handicap delta for the header HandicapChip.
 *
 * Mirrors useHandicapTrend12mo, but with a ~90-day window and a ±0.3 stroke
 * threshold (vs ±0.05 on the 12mo card). The wider threshold suppresses
 * micro-fluctuations within a single round so the chip colour doesn't flip
 * on noise.
 *
 * Returns:
 *   - delta:     current − ~90-day-ago index, or null when we lack history.
 *   - direction: 'improving' (delta ≤ -0.3) — green TrendingDown
 *                'drifting'  (delta ≥ +0.3) — crimson TrendingUp
 *                'steady'    otherwise, or when history < ~80 days.
 */
import { useMemo } from 'react';
import { useHandicapHistory, useHandicapTrend } from '@/lib/whs/hooks';

export type HandicapTrend90dDirection = 'improving' | 'drifting' | 'steady';

export interface HandicapTrend90d {
  delta: number | null;
  direction: HandicapTrend90dDirection;
}

const MS_PER_DAY = 86_400_000;
const TARGET_DAYS = 90;
const MIN_HISTORY_DAYS = 80;
const THRESHOLD = 0.3;

export function useHandicapTrend90d(connectionId: string | undefined): HandicapTrend90d {
  const { data: history } = useHandicapHistory(connectionId, 'all');
  const { data: trend } = useHandicapTrend(connectionId);

  return useMemo<HandicapTrend90d>(() => {
    const current = trend?.current ?? null;
    if (current === null || !history || history.length === 0) {
      return { delta: null, direction: 'steady' };
    }

    const now = Date.now();
    const earliestTs = new Date(history[0].observed_at).getTime();
    if (now - earliestTs < MIN_HISTORY_DAYS * MS_PER_DAY) {
      return { delta: null, direction: 'steady' };
    }

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
    if (!Number.isFinite(past)) return { delta: null, direction: 'steady' };

    const raw = current - past;
    const delta = Math.round(raw * 10) / 10;
    const direction: HandicapTrend90dDirection =
      delta <= -THRESHOLD ? 'improving' : delta >= THRESHOLD ? 'drifting' : 'steady';

    return { delta, direction };
  }, [history, trend]);
}
