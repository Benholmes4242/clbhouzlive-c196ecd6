import type { TFunction } from 'i18next';

/**
 * ONE COURSE HEADLINE, TWO CALLERS (BRIEF_EXPLORE_MAGAZINE §5b, PHASE D3).
 *
 * The ladder and its exact locale keys used to live inside useCoursesView. Phase
 * D3 moves the Courses body onto get_explore_stream, and SQL cannot localise six
 * locales, so the RPC returns the FIGURES (event kind, burst count and mean, the
 * month's low and who shot it, tracked rounds, rating and its sample) and this
 * one function turns them into the sentence. The client composition and the
 * server stream therefore read the same copy, from the same keys, in the same
 * order:
 *   1. RATINGS BURST - two or more ratings at that course in the last 30 days.
 *   2. RECENT LOW - the month's low round, with the member who shot it.
 *   3. STABLE FACT - rounds tracked, with the rating and sample where there is
 *      one, or the rating alone where there are no tracked rounds.
 *
 * A COURSE WITH NEITHER ROUNDS NOR A RATING HAS NO HONEST SENTENCE and is not a
 * candidate at all - the callers exclude it before reaching here, and if one
 * ever arrives this returns null rather than inventing a line.
 */

export type CourseEventKind = 'ratings' | 'low' | 'stable';

export interface CourseHeadlineFacts {
  event?: CourseEventKind | null;
  burstCount?: number | null;
  burstMean?: number | null;
  lowGross?: number | null;
  lowBy?: string | null;
  rounds?: number | null;
  rating?: number | null;
  ratingCount?: number | null;
}

/** The ordering weight the event carries. Ordering only, never rendered. */
export function courseEventStrength(event: CourseEventKind, burstCount?: number | null): number {
  if (event === 'ratings') return 2 + Math.min(burstCount ?? 0, 12) / 12;
  if (event === 'low') return 1;
  return 0;
}

export function courseHeadline(t: TFunction, facts: CourseHeadlineFacts): string | null {
  const rounds = facts.rounds ?? 0;
  const rating = facts.rating ?? null;
  const ratingCount = facts.ratingCount ?? 0;

  if (facts.event === 'ratings' && (facts.burstCount ?? 0) >= 2 && facts.burstMean != null) {
    return t('amateur.stream.course.eventRatings', '{{count}} ratings this month, averaging {{mean}}.', {
      count: facts.burstCount,
      mean: Number(facts.burstMean).toFixed(1),
    });
  }
  if (facts.event === 'low' && facts.lowGross != null) {
    return facts.lowBy
      ? t('amateur.stream.course.eventLow', "{{name}}'s {{gross}} is the low here this month.", {
          name: facts.lowBy,
          gross: facts.lowGross,
        })
      : t('amateur.stream.course.eventLowAnon', '{{gross}} is the low here this month.', { gross: facts.lowGross });
  }
  if (rating != null && rounds > 0) {
    return t('amateur.stream.course.factRated', '{{rounds}} rounds tracked, rated {{rating}} from {{count}}.', {
      rounds,
      rating: Number(rating).toFixed(1),
      count: ratingCount,
    });
  }
  if (rounds > 0) {
    return t('amateur.stream.course.factRounds', '{{rounds}} rounds tracked here.', { rounds });
  }
  if (rating != null) {
    return t('amateur.stream.course.factRatedOnly', 'Rated {{rating}} from {{count}}.', {
      rating: Number(rating).toFixed(1),
      count: ratingCount,
    });
  }
  /* Neither rounds nor a rating: no sentence exists, so none is invented. */
  return null;
}
