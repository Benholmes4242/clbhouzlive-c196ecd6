/**
 * useHandicapTrend12mo — 12-month handicap delta for the profile hero
 * scorecard (HeroHandicapCardDark).
 *
 * Returns:
 *   - delta: number | null   — current − ~365-day-ago index, rounded to 1dp.
 *                              null when the user has insufficient history
 *                              (record began < 12 months ago) or no current
 *                              index.
 *   - direction: 'down' | 'up' | 'flat'
 *                              'down' = improved (delta < -0.05)
 *                              'up'   = drifted  (delta >  0.05)
 *                              'flat' = otherwise
 *
 * Built on top of existing useHandicapHistory(connectionId, 'all') — no new
 * DB query required. We require the earliest history point to be at least
 * 335 days old (≈11 months) to count as "12 months of history" — gives a
 * little grace so users right at the boundary aren't blanked out.
 */
import { useMemo } from 'react';
import { useHandicapHistory, useHandicapTrend } from '@/lib/whs/hooks';

export interface HandicapTrend12mo {
  delta: number | null;
  direction: 'down' | 'up' | 'flat';
}

const MS_PER_DAY = 86_400_000;
const TARGET_DAYS = 365;
const MIN_HISTORY_DAYS = 335;

export function useHandicapTrend12mo(connectionId: string | undefined): HandicapTrend12mo {
  const { data: history } = useHandicapHistory(connectionId, 'all');
  const { data: trend } = useHandicapTrend(connectionId);

  return useMemo<HandicapTrend12mo>(() => {
    const current = trend?.current ?? null;
    if (current === null || !history || history.length === 0) {
      return { delta: null, direction: 'flat' };
    }

    const now = Date.now();
    const earliestTs = new Date(history[0].observed_at).getTime();
    if (now - earliestTs < MIN_HISTORY_DAYS * MS_PER_DAY) {
      return { delta: null, direction: 'flat' };
    }

    // Find the history point closest to ~365 days ago.
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
    if (!Number.isFinite(past)) return { delta: null, direction: 'flat' };

    const raw = current - past;
    const delta = Math.round(raw * 10) / 10;
    const direction: 'down' | 'up' | 'flat' =
      delta < -0.05 ? 'down' : delta > 0.05 ? 'up' : 'flat';

    return { delta, direction };
  }, [history, trend]);
}
