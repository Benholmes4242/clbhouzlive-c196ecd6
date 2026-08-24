import { useMemo } from 'react';

import type { CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';

import { useCourseCardMeta } from './useCourseCardMeta';
import { useRoundHoleShapes } from './useRoundHoleShapes';
import {
  orderForWeek,
  usePlayedCourseIds,
  useGolfThisWeek,
  useWeekScopeCourses,
  type WeekScope,
} from './useGolfThisWeek';
import { useWeekRegionCounts, type RegionSelection } from './useWeekRegionCounts';
import { selectMoment, type Moment } from '../roundMoment';

/**
 * THE PAGE HERO'S SUBJECT (BRIEF_DISCOVER_WORLD_CLASS §1.1).
 *
 * IT SHOWS THE BEST STORY, NOT THE BEST SCORE. The lowest gross is row 1 of the
 * BEST THIS WEEK chip immediately beneath the hero, and a hero that repeats the
 * chip under it is a bigger version of nothing. So the hero surfaces the most
 * recent notable round and the chips keep the numbers — two different questions,
 * no duplication. Ace/albatross rarity alone can hold against a newer moment.
 *
 * ZERO NEW NETWORK REQUESTS (§1.4, ACCEPTANCE k). Every hook below is the SAME
 * hook GolfThisWeek calls with the SAME arguments, so every read resolves out of
 * the react-query cache the section already populated: the scope allow-list, the
 * seven-day rounds, the course meta and the ONE batched hole-shape read. There is
 * no query, no RPC and no field here that the section did not already fetch.
 *
 * MOMENT detection remains in roundMoment.ts. This hook only chooses between
 * already-classified rounds by recency and the explicit rarity exception.
 */

type HeroCandidate = { row: CircleRoundRow; moment: Moment };

const isRarity = (moment: Moment) =>
  moment.kind === 'eagle' && (moment.feat === 'ace' || moment.feat === 'albatross');

/**
 * Amendment 1: recency chooses the story. An ace or albatross is the sole
 * exception and holds the slot against every ordinary notable moment; when
 * more than one rarity exists, the newest rarity wins. Input order is never
 * trusted because the rail deliberately reorders self/new-course rounds.
 */
export function selectDiscoverHeroCandidate(candidates: readonly HeroCandidate[]): HeroCandidate | null {
  const notable = candidates.filter(({ moment }) => moment.kind !== 'plain');
  if (notable.length === 0) return null;
  const rarity = notable.filter(({ moment }) => isRarity(moment));
  const pool = rarity.length > 0 ? rarity : notable;
  return [...pool].sort((a, b) => String(b.row.play_date).localeCompare(String(a.row.play_date)))[0] ?? null;
}

export interface DiscoverHeroSubject {
  row: CircleRoundRow;
  moment: Moment;
  courseName: string | null;
  region: string | null;
  imageUrl: string | null;
}

export interface DiscoverHeroResult {
  /** `null` means NO HERO RENDERS — no placeholder, no reserved height (§1.1). */
  subject: DiscoverHeroSubject | null;
  /** True while the section's own reads are in flight. The hero renders nothing. */
  isPending: boolean;
  /** Reported figures (§REPORT 1 and 5). Cheap, derived, no extra read. */
  stats: { rounds: number; allPlain: boolean; withImage: number };
}

export function useDiscoverHero(
  userId: string | undefined,
  scope: WeekScope,
  region: RegionSelection | null,
): DiscoverHeroResult {
  const scopeCourses = useWeekScopeCourses(userId, scope);
  const roundsQuery = useGolfThisWeek(userId, scope, scopeCourses.courseIds);
  const all = roundsQuery.data ?? [];

  const courseIds = useMemo(
    () => all.map((r) => r.course_id).filter((v): v is string => !!v),
    [all],
  );
  const played = usePlayedCourseIds(userId);
  const playedSet = useMemo(() => new Set(played.ids), [played.ids]);
  const metaQuery = useCourseCardMeta(courseIds);
  const meta = metaQuery.data;

  const regions = useWeekRegionCounts(all, meta);
  const inRegion = useMemo(
    () => all.filter((r) => regions.matches(r, region)),
    [all, regions, region],
  );
  const ordered = useMemo(() => orderForWeek(inRegion, playedSet), [inRegion, playedSet]);

  const scoreIds = useMemo(() => ordered.map((r) => r.score_id), [ordered]);
  const holeShapes = useRoundHoleShapes(scoreIds);

  const isPending = !!userId && (roundsQuery.isPending || !scopeCourses.ready);

  return useMemo(() => {
    const withImage = ordered.filter((r) => !!meta?.get(r.course_id ?? '')?.imageUrl).length;

    let allPlain = true;
    const candidates = ordered.map((r) => {
      const shape = holeShapes?.get(r.score_id ?? '') ?? null;
      const moment = selectMoment(shape?.holes ?? []);
      if (moment.kind !== 'plain') allPlain = false;
      return { row: r, moment };
    });
    const best = selectDiscoverHeroCandidate(candidates);

    const subject: DiscoverHeroSubject | null =
      best
        ? {
            row: best.row,
            moment: best.moment,
            courseName: meta?.get(best.row.course_id ?? '')?.name ?? best.row.course_name ?? null,
            region: meta?.get(best.row.course_id ?? '')?.region ?? null,
            imageUrl: meta?.get(best.row.course_id ?? '')?.imageUrl ?? null,
          }
        : null;

    return {
      subject: isPending ? null : subject,
      isPending,
      stats: { rounds: ordered.length, allPlain: ordered.length > 0 && allPlain, withImage },
    };
  }, [ordered, holeShapes, meta, isPending]);
}

export default useDiscoverHero;
