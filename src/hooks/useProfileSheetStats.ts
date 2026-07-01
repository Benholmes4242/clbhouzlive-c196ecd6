/**
 * useProfileSheetStats — composite stats for the ProfileHubSheet's
 * 4-column / 2-column stat strip.
 *
 * Returns null for any field that isn't available. The strip renders an
 * em-dash on null rather than hiding the column.
 *
 * `enabled` gates the entire 5-query fan-out so we don't pay this cost
 * at app-shell mount for users who never open the sheet. Threaded by
 * passing `undefined` id when disabled — each child hook already treats
 * that as `enabled: false`.
 */
import { useMemo } from 'react';
import { useReviewerStats } from './useReviewerStats';
import { useUserCourseSummary } from './useUserCourseSummary';
import {
  useWhsConnection,
  useAllScores,
  useHandicapTrend,
} from '@/lib/whs/hooks';

export interface ProfileSheetStats {
  rounds30d: number | null;
  lowIndex: number | null;
  reviewsCount: number | null;
  coursesPlayed: number | null;
}

export function useProfileSheetStats(
  userId: string | undefined,
  enabled: boolean = true,
): ProfileSheetStats {
  const gatedUserId = enabled ? userId : undefined;
  const { data: connection } = useWhsConnection(gatedUserId);
  const connectionId = enabled ? connection?.id : undefined;
  const { data: scores } = useAllScores(connectionId);
  const { data: trend } = useHandicapTrend(connectionId);
  const { data: reviewer } = useReviewerStats(gatedUserId);
  const { totalCoursesPlayed } = useUserCourseSummary(gatedUserId);

  const rounds30d = useMemo<number | null>(() => {
    if (!scores) return null;
    const cutoff = Date.now() - 30 * 86_400_000;
    return scores.filter(
      (s) => s.play_date && new Date(s.play_date).getTime() >= cutoff,
    ).length;
  }, [scores]);

  // Approximation: min(current, previous) within the trend window.
  // Replaced once `low_index_30d` lands on the WHS RPC.
  const lowIndex = useMemo<number | null>(() => {
    if (!trend || trend.current == null) return null;
    if (trend.previousHandicap == null) return trend.current;
    return Math.min(trend.current, trend.previousHandicap);
  }, [trend]);

  return {
    rounds30d,
    lowIndex,
    reviewsCount: reviewer?.coursesRated ?? null,
    coursesPlayed: typeof totalCoursesPlayed === 'number' ? totalCoursesPlayed : null,
  };
}
