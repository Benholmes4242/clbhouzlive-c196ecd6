import { useMemo } from 'react';

import { useRoundNetScores } from '@/components/explore-tab-new/courseled/hooks/useRoundNetScores';
import { useCircleSize } from '@/features/amateur/useCircleSize';
import { useCircleLatestRounds } from '@/hooks/gam/useCircleLatestRounds';

import {
  buildHeroCards,
  pickSessionCard,
  SINGLE_ROUND_METRICS,
  type HeroCard,
  type HeroMetric,
  type HeroPool,
} from './heroCards';

/**
 * THE ROTATING HERO'S READS (BRIEF_EXPLORE_ROTATING_HERO §1, §5, §7).
 *
 * ONE 90-DAY POOL PER SCOPE SERVES ALL THREE WINDOWS. The 14- and 30-day cards
 * are cut from the same rows by play_date, so the hero costs at most two rounds
 * reads plus one batched gam_round_net read — never one query per metric-window
 * combination.
 *
 * TWO READS, NOT ONE, BECAUSE THE LADDER IS THREE STEPS (ruling, 10 Sep 2026).
 * A member's circle can clear the depth test at 90 days and fail it at 14, so
 * the widening decision is made PER WINDOW inside buildHeroCards and both pools
 * must be in hand when it is made. The everyone read is skipped entirely for a
 * member with no circle... no: it is the ONLY pool for them, and it is skipped
 * for nobody, because a circle that fails at 14 days needs it too. The circle
 * read is the one that is skipped, when there is no circle to read.
 *
 * NET IS THE DATABASE'S NUMBER. gam_round_net through useRoundNetScores, the
 * same source the Lowest net board reads. No formula in the app.
 *
 * NO SUGGESTED ROUNDS. A hero that says "best of 57 rounds in your circle" must
 * be counting the circle, so the shortfall filler is off in both reads.
 */

/**
 * THE READ CAPS. Measured 10 Sep 2026: 271 rounds from 22 members across 90
 * days platform-wide, so neither cap is reachable — and if one ever is,
 * `truncated` takes the pool line out of the rotation rather than printing the
 * cap as a count.
 */
const EVERYONE_LIMIT = 600;
const CIRCLE_LIMIT = 600;

export interface HeroCardsResult {
  /** This session's card, or null when nothing qualifies (§5 fallback). */
  card: HeroCard | null;
  /** §10 — how many cards qualified AT THE TIME OF SELECTION. */
  qualifyingCount: number;
  /** The POOL THE CHOSEN CARD USED, which is per card, not per member. */
  pool: HeroPool | null;
  /** False while any read is outstanding: the fallback must not flash. */
  ready: boolean;
}

export function useAmateurHeroCards(
  userId: string | undefined,
  /** Narrow the rotation while a card family is still being built. */
  families: readonly HeroMetric[] = SINGLE_ROUND_METRICS,
): HeroCardsResult {
  const circle = useCircleSize(userId, !!userId);
  const hasCircle = circle.data == null ? null : circle.data > 0;

  const circleRounds = useCircleLatestRounds(hasCircle === true ? userId : undefined, {
    limit: CIRCLE_LIMIT,
    includeSuggested: false,
    scope: 'circle',
    windowDays: 90,
    oneRoundPerMember: false,
  });
  const everyoneRounds = useCircleLatestRounds(userId, {
    limit: EVERYONE_LIMIT,
    includeSuggested: false,
    scope: 'everyone',
    windowDays: 90,
    oneRoundPerMember: false,
  });

  const circleRows = circleRounds.data ?? [];
  const everyoneRows = everyoneRounds.data ?? [];

  /* ONE BATCHED NET READ COVERING BOTH POOLS. Circle rounds are a subset of the
     everyone pool in principle, but RLS decides both, so the union is taken
     rather than assumed. */
  const scoreIds = useMemo(() => {
    const ids = new Set<string>();
    for (const r of everyoneRows) if (r.score_id) ids.add(r.score_id);
    for (const r of circleRows) if (r.score_id) ids.add(r.score_id);
    return [...ids];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [everyoneRows, circleRows]);
  const netByScore = useRoundNetScores(scoreIds);

  const familyKey = families.join(',');
  const cards = useMemo(
    () =>
      hasCircle == null
        ? []
        : buildHeroCards({
            circleRows,
            everyoneRows,
            netByScore,
            hasCircle,
            circleTruncated: circleRows.length >= CIRCLE_LIMIT,
            everyoneTruncated: everyoneRows.length >= EVERYONE_LIMIT,
            families,
          }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [circleRows, everyoneRows, netByScore, hasCircle, familyKey],
  );

  /* The pick is held for the session, so it must not be re-drawn on every
     render — it is keyed on the qualifying SET, not on the array identity. */
  const key = cards.map((c) => c.id).join(',');
  const card = useMemo(() => pickSessionCard(cards), [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    card,
    qualifyingCount: cards.length,
    pool: card?.pool ?? null,
    ready:
      !!userId &&
      hasCircle != null &&
      everyoneRounds.isFetched &&
      (hasCircle === false || circleRounds.isFetched),
  };
}

export default useAmateurHeroCards;
