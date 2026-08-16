import { useMemo } from 'react';

import type { Moment } from '@/components/explore-tab-new/courseled/hooks/useMomentsOfTheWeek';
import { useUserStatsCourseMap } from '@/contexts/UserStatsCoursesContext';

/**
 * COMMUNITY RAILS (BRIEF_COMMUNITY_PAGE_V2 §4).
 *
 * The page reads ONE all-time pool (useMomentsOfTheWeek(null)) and shapes it
 * here. No rail issues its own query: a rail that fetches is a rail that can
 * disagree with the grid below it about what exists.
 *
 * RELEVANCE ORDER, not a fixed running order. A member who has played nothing
 * must not be shown an empty "courses you have played" rail in slot one, and a
 * member with twelve rounds must not have it buried under a generic rail. Each
 * rail declares a WEIGHT; rails sort by weight descending and empties are
 * dropped before ordering, so position is earned by having something to say.
 *
 * ONE TILE PER COURSE ON CROSS-COURSE RAILS (REFINE §2). Every rail here is
 * about a SET OF PLACES, so three tiles of the same club is three quarters of a
 * rail spent on one subject. V2 §4.2b specified ordering "by moment rank within
 * a course", which is exactly what produced that; it was wrong. Some rails now
 * fall under MIN_RAIL_TILES and disappear — correct, since a rail that only had
 * three tiles because one club supplied all three never had three subjects.
 */

/** A rail needs enough tiles to read as a row rather than a stray tile. */
export const MIN_RAIL_TILES = 3;

/** Rails never grow unbounded — the tail of a 40-tile rail is never reached. */
export const MAX_RAIL_TILES = 12;

/** Moments newer than this are "recent" for the featured lead. */
export const FEATURED_WINDOW_DAYS = 30;

const DAY = 86_400_000;

export type RailId = 'played' | 'nearby' | 'top100' | 'video' | 'busiest';

export interface CommunityRail {
  id: RailId;
  /** i18n key suffix under courses:community.rails. */
  titleKey: RailId;
  moments: Moment[];
  /** Higher sorts earlier. Computed, never hardcoded per rail. */
  weight: number;
}

interface Args {
  /** The ALL-TIME pool. */
  moments: Moment[];
  /** sub_country of the member's own region, when known. */
  memberRegion?: string | null;
  /** Course ids that are Top 100 ranked, when the caller knows them. */
  top100CourseIds?: Set<string>;
}

/**
 * Counts moments per course over the whole pool. Used by the busiest rail and
 * by the club rail, so both agree on what "busiest" means.
 */
export function countByCourse(moments: Moment[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const x of moments) m.set(x.courseId, (m.get(x.courseId) ?? 0) + 1);
  return m;
}

/**
 * ONE TILE PER COURSE, keeping the incoming order. The pool arrives
 * rank-ordered, so the first moment seen for a course is its highest-ranked.
 */
export function oneTilePerCourse(moments: Moment[]): Moment[] {
  const seen = new Set<string>();
  const out: Moment[] = [];
  for (const m of moments) {
    if (seen.has(m.courseId)) continue;
    seen.add(m.courseId);
    out.push(m);
  }
  return out;
}

function cap(list: Moment[]): Moment[] {
  return oneTilePerCourse(list).slice(0, MAX_RAIL_TILES);
}

export function useCommunityRails({
  moments,
  memberRegion = null,
  top100CourseIds,
}: Args): CommunityRail[] {
  // The member's own played-course map is already a single app-wide
  // subscription (Phase E context) — this must not add a second one.
  const playedMap = useUserStatsCourseMap();

  return useMemo(() => {
    if (moments.length === 0) return [];

    const perCourse = countByCourse(moments);

    const played = cap(moments.filter((m) => playedMap.has(m.courseId)));
    const nearby = memberRegion
      ? cap(moments.filter((m) => m.region === memberRegion && !playedMap.has(m.courseId)))
      : [];
    const top100 = top100CourseIds
      ? cap(moments.filter((m) => top100CourseIds.has(m.courseId)))
      : [];
    const video = cap(moments.filter((m) => m.mediaType === 'video'));

    // BUSIEST: courses with the most member media, their best tile each, so the
    // rail reads as a row of courses rather than a run of one club's photos.
    const busiestCourses = [...perCourse.entries()]
      .filter(([, n]) => n >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_RAIL_TILES)
      .map(([id]) => id);
    const busiestSet = new Set(busiestCourses);
    const busiest = cap(moments.filter((m) => busiestSet.has(m.courseId)));

    const recentCount = (list: Moment[]) => {
      const since = Date.now() - FEATURED_WINDOW_DAYS * DAY;
      return list.filter((m) => new Date(m.post.createdAt).getTime() >= since).length;
    };

    // WEIGHT = personal connection first, then freshness, then size. A rail the
    // member is IN (played, nearby) outranks an editorial one at equal size.
    const build = (id: RailId, list: Moment[], personal: number): CommunityRail => ({
      id,
      titleKey: id,
      moments: list,
      weight: personal * 1000 + recentCount(list) * 10 + list.length,
    });

    return [
      build('played', played, 3),
      build('nearby', nearby, 2),
      build('top100', top100, 1),
      build('busiest', busiest, 1),
      build('video', video, 0),
    ]
      .filter((r) => r.moments.length >= MIN_RAIL_TILES)
      .sort((a, b) => b.weight - a.weight);
  }, [moments, playedMap, memberRegion, top100CourseIds]);
}

/**
 * FEATURED LEAD — the single strongest RECENT moment (30 days), or NOTHING.
 *
 * Recency is the point of the lead: an all-time best photo at the top of the
 * page would make the page look identical every visit. When nothing in the
 * (possibly filtered) pool is inside the window the lead is ABSENT — an older
 * moment dressed as the lead, or one from outside the active filter, would be a
 * lie about what the member is looking at.
 *
 * VIDEO LEADS. The lead is the BEST VIDEO inside the window, not the newest:
 * this is a FILTER over the existing rank order, never a re-rank. When the
 * in-window pool holds no video at all the lead falls back to the strongest
 * moment whatever its type — a still hero beats no hero, and an empty block
 * would be a claim about the data rather than a design choice.
 */
export function featuredMoment(moments: Moment[]): Moment | null {
  if (moments.length === 0) return null;
  const since = Date.now() - FEATURED_WINDOW_DAYS * DAY;
  const recent = moments.filter((m) => new Date(m.post.createdAt).getTime() >= since);
  if (recent.length === 0) return null;
  return recent.find((m) => m.mediaType === 'video') ?? recent[0];
}
