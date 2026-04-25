import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from 'date-fns';

/**
 * Streak summary for the My Progress momentum card.
 *
 * Pure function. Input is intentionally minimal (only `played_at` is needed)
 * so it's trivially testable and reusable.
 *
 * Note: a follow-up cleanup item — the legacy `Top100LoggingStreak.tsx`
 * scanned 24 months backwards even though `all_rounds_for_streak` is bounded
 * to 18 months. This util scans 18 months to match the data contract; if
 * ever the input window changes, update both sides together.
 */
export type StreakRound = { played_at: string };

export type StreakSummary = {
  /** Consecutive months ending with the most recent month that has any log. */
  monthsCount: number;
  /** Whether the user has logged a round in the current calendar month. */
  hasLoggedThisMonth: boolean;
  /** One-line subline for the momentum card. */
  subline: string;
  /** Last 6 months oldest → newest. */
  last6Months: { label: string; logged: boolean }[];
};

export interface BuildStreakSummaryOptions {
  /** First name shown for non-self contexts. */
  firstName?: string;
  /** Whether the viewer is looking at their own progress. */
  isOwnProfile?: boolean;
  /** Optional override (testing). Defaults to `new Date()`. */
  now?: Date;
}

export function buildStreakSummary(
  rounds: StreakRound[],
  options: BuildStreakSummaryOptions = {}
): StreakSummary {
  const { firstName, isOwnProfile = true, now = new Date() } = options;

  const monthHasLog = (monthDate: Date) => {
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    return rounds.some((r) => {
      const played = new Date(r.played_at);
      return isWithinInterval(played, { start, end });
    });
  };

  const hasLoggedThisMonth = monthHasLog(now);

  // Walk backwards from the current month counting consecutive months.
  // If the current month is empty, allow one "skip" so a streak that
  // ended last month still reads as "1 month streak" until the user logs again.
  let monthsCount = 0;
  let cursor = now;
  for (let i = 0; i < 18; i++) {
    if (monthHasLog(cursor)) {
      monthsCount += 1;
      cursor = subMonths(cursor, 1);
    } else {
      if (i === 0 && !hasLoggedThisMonth) {
        cursor = subMonths(cursor, 1);
        continue;
      }
      break;
    }
  }

  // Last 6 months (oldest first).
  const last6Months = Array.from({ length: 6 }, (_, idx) => {
    const monthDate = subMonths(now, 5 - idx);
    return {
      label: format(monthDate, 'MMM'),
      logged: monthHasLog(monthDate),
    };
  });

  const currentMonthName = format(now, 'MMMM');

  let subline: string;
  if (hasLoggedThisMonth) {
    subline = isOwnProfile
      ? `You've logged in ${currentMonthName} — keep it up`
      : `${firstName ?? 'They'} has logged in ${currentMonthName}`;
  } else if (monthsCount > 0) {
    subline = isOwnProfile
      ? `Log one in ${currentMonthName} to continue`
      : `${firstName ?? 'They'} needs ${currentMonthName} to keep it alive`;
  } else {
    subline = isOwnProfile
      ? 'Log a Top 100 round to start'
      : `${firstName ?? 'They'} hasn't started a streak yet`;
  }

  return {
    monthsCount,
    hasLoggedThisMonth,
    subline,
    last6Months,
  };
}
