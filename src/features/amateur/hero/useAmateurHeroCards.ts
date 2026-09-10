import { useMemo } from 'react';

import { useRoundNetScores } from '@/components/explore-tab-new/courseled/hooks/useRoundNetScores';
import { useCircleSize } from '@/features/amateur/useCircleSize';
import { useCircleLatestRounds } from '@/hooks/gam/useCircleLatestRounds';

import { buildHeroCards, pickSessionCard, type HeroCard, type HeroPool } from './heroCards';

/**
 * THE ROTATING HERO'S ONE READ (BRIEF_EXPLORE_ROTATING_HERO §1, §5, §7).
 *
 * ONE 90-DAY POOL SERVES ALL THREE WINDOWS. The 14- and 30-day cards are cut
 * from the same rows by play_date, so the hero costs one rounds read plus one
 * batched gam_round_net read — never one query per metric-window combination.
 *
 * §7 THE POOL IS THE CIRCLE WHEN THERE IS ONE, EVERYONE WHEN THERE IS NOT —
 * the same rule the leaderboard now follows, since 52 of 99 members follow
 * nobody. The head-count decides it, and the rounds read WAITS for that answer
 * rather than fetching a circle pool and swapping it.
 *
 * NO SUGGESTED ROUNDS. A hero that says "best of 57 rounds in your circle" must
 * be counting the circle, so the shortfall filler is off.
 */

/** The everyone pool caps its read; 90 days of production traffic is ~255 rounds. */
const EVERYONE_LIMIT = 600;

export interface HeroCardsResult {
  /** This session's card, or null when nothing qualifies (§5 fallback). */
  card: HeroCard | null;
  /** §10 — how many cards qualified AT THE TIME OF SELECTION. */
  qualifyingCount: number;
  pool: HeroPool;
  /** False while either read is outstanding: the fallback must not flash. */
  ready: boolean;
}

export function useAmateurHeroCards(userId: string | undefined): HeroCardsResult {
  const circle = useCircleSize(userId, !!userId);
  const hasCircle = circle.data == null ? null : circle.data > 0;
  const pool: HeroPool = hasCircle === false ? 'everyone' : 'circle';

  const rounds = useCircleLatestRounds(hasCircle == null ? undefined : userId, {
    limit: EVERYONE_LIMIT,
    includeSuggested: false,
    scope: pool,
    windowDays: 90,
    oneRoundPerMember: false,
  });

  const rows = rounds.data ?? [];
  const scoreIds = useMemo(() => rows.map((r) => r.score_id), [rows]);
  const netByScore = useRoundNetScores(scoreIds);

  const cards = useMemo(
    () => buildHeroCards({ rows, netByScore, pool }),
    [rows, netByScore, pool],
  );

  /* The pick is held for the session, so it must not be re-drawn on every
     render — it is keyed on the qualifying SET, not on the array identity. */
  const key = cards.map((c) => c.id).join(',');
  const card = useMemo(() => pickSessionCard(cards), [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    card,
    qualifyingCount: cards.length,
    pool,
    ready: !!userId && hasCircle != null && rounds.isFetched,
  };
}

export default useAmateurHeroCards;
