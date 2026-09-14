import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_FILTERS } from '@/components/explore-tab-new/courseled/boardFilters';
import { useBoardCourses } from '@/components/explore-tab-new/courseled/hooks/useBoardCourses';
import { useCourseCardMeta } from '@/components/explore-tab-new/courseled/hooks/useCourseCardMeta';

import { courseEventStrength, courseHeadline, type CourseEventKind } from './courseHeadline';
import type { CourseShelfRow } from './useCourseShelves';
import type { StreamItem } from './streamItem';
import type { ScoreScope, ViewerScoreScope } from './useViewerScoreScope';
import { useTop100RankIndex } from './useTop100RankIndex';

/**
 * THE COURSES VIEW (BRIEF_EXPLORE_MAGAZINE PHASE C, §5b).
 *
 * GEOGRAPHY IS NEVER RE-DERIVED. Club, county and country arrive from the shared
 * useViewerScoreScope resolver, exactly as Scores (B2) and the C1 shelves do.
 *
 * THE SET IS get_board_courses THROUGH useBoardCourses, the existing hook. The
 * county narrowing is the C1 PATH and for the same recorded reason: board_pool's
 * ok_region predicate has NO county branch and an invented p_region_kind falls
 * through `else true`, which would silently pass every course. So the read is
 * BOUNDED by sub_country and narrowed to golf_courses.region client-side.
 *
 * THE HEADLINE IS AN EVENT OR A STABLE FACT, NEVER EMPTY (§5b):
 *   1. RATINGS BURST — two or more ratings at that course in the last 30 days,
 *      with the sample's mean. Read once, for every course on the view, from
 *      course_ratings; the same read feeds the courses:top-rated shelf.
 *   2. RECENT LOW — the 30-day board's low round at that course, with the member
 *      who shot it. low_gross and low_by describe the SAME round by the board's
 *      own contract; they are never recombined with a figure from elsewhere.
 *   3. STABLE FACT — "{rounds} rounds tracked, rated {rating} from {count}", or
 *      "{rounds} rounds tracked here" where the course carries no rating.
 *
 * A NON-CANDIDATE IS A COURSE WITH NEITHER: no tracked rounds AND no rating. It
 * has no honest sentence, so it does not enter the view at all (§5b, §6.3).
 *
 * DISTANCE IS NOT RENDERED. §5b allows a distance in the who-line ONLY when the
 * viewer's location is already available, and nothing on this page holds a
 * settled coordinate — asking for one would be the new permission prompt the
 * brief forbids. The who-line is therefore the area alone. Reported.
 */

const THIRTY_DAYS_MS = 30 * 86_400_000;
/** §5b/§7 the top-rated shelf floors the sample at two ratings. */
export const TOP_RATED_FLOOR = 2;

export interface RecentRatings {
  courseId: string;
  count: number;
  mean: number;
}

/**
 * §5b courses:top-rated — "Highest rated this month". course_ratings created in
 * the last 30 days, grouped by course, floored at TOP_RATED_FLOOR ratings, mean
 * descending. ONE read, shared with the course headline above.
 */
export function useRecentCourseRatings(enabled: boolean) {
  const query = useQuery<RecentRatings[]>({
    queryKey: ['explore-magazine', 'recent-course-ratings-30d'],
    enabled,
    staleTime: 15 * 60_000,
    queryFn: async () => {
      const since = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();
      const { data, error } = await supabase
        .from('course_ratings')
        .select('course_id, rating, created_at')
        .gte('created_at', since)
        .not('course_id', 'is', null)
        .limit(4000);
      if (error) throw error;
      const groups = new Map<string, { sum: number; count: number }>();
      for (const row of (data ?? []) as Array<{ course_id: string | null; rating: number | null }>) {
        if (!row.course_id || row.rating == null) continue;
        const entry = groups.get(row.course_id) ?? { sum: 0, count: 0 };
        entry.sum += Number(row.rating);
        entry.count += 1;
        groups.set(row.course_id, entry);
      }
      return Array.from(groups.entries())
        .map(([courseId, entry]) => ({ courseId, count: entry.count, mean: entry.sum / entry.count }))
        .sort((a, b) => (b.mean - a.mean) || (b.count - a.count) || a.courseId.localeCompare(b.courseId));
    },
  });

  /** Every group, floor included, for the headline. The shelf takes the cut. */
  const byCourse = useMemo(() => {
    const map = new Map<string, RecentRatings>();
    for (const row of query.data ?? []) map.set(row.courseId, row);
    return map;
  }, [query.data]);

  const shelfIds = useMemo(
    () => (query.data ?? []).filter((row) => row.count >= TOP_RATED_FLOOR).slice(0, 14).map((row) => row.courseId),
    [query.data],
  );
  const meta = useCourseCardMeta(shelfIds);

  const rows = useMemo<CourseShelfRow[]>(
    () =>
      shelfIds.map((courseId) => {
        const group = byCourse.get(courseId) as RecentRatings;
        const course = meta.data?.get(courseId);
        return {
          courseId,
          name: course?.name ?? null,
          area: course?.region ?? course?.subCountry ?? null,
          imageUrl: course?.imageUrl ?? null,
          rounds: 0,
          rating: group.mean,
          ratingCount: group.count,
          rank: null,
          rankScope: null,
        };
      }),
    [shelfIds, byCourse, meta.data],
  );

  return {
    rows,
    byCourse,
    isFetched: !enabled ? true : query.isFetched && (shelfIds.length === 0 || meta.isFetched),
  };
}

/** Top 100 rank AND THE LIST IT CAME FROM, regional first, read once from the
 *  membership index. The previous local query resolved "world" against a slug
 *  that does not exist in top100_lists, so nothing was ever world and every
 *  ranked course was labelled GB&I downstream. */
function useTop100Ranks(courseIds: string[]) {
  const enabled = courseIds.length > 0;
  const { index, isFetched } = useTop100RankIndex(enabled);
  return { ranks: index, isFetched: enabled ? isFetched : true };
}

/** Re-exported so existing importers keep their symbol (D3 moved the type
 *  next to the shared headline composer). */
export type { CourseEventKind };

export interface CoursesView {
  items: StreamItem[];
  /** Real candidate total before the page reveal, never a rendered count. */
  total: number;
  isFetched: boolean;
}

const EMPTY_VIEW: CoursesView = { items: [], total: 0, isFetched: true };

export function useScopeCourses(
  viewerId: string | undefined,
  scope: ScoreScope,
  geography: ViewerScoreScope,
  enabled: boolean,
): CoursesView {
  const { t, i18n } = useTranslation('courses');

  /* THE READ IS BOUNDED BY THE NATION where we know it — for county and club as
     well, because both sit inside it. World asks for no region at all. */
  const bounded = scope !== 'world' && !!geography.country;
  const filtersAll = useMemo(
    () => ({
      ...DEFAULT_FILTERS,
      window: 'all' as const,
      regionKind: bounded ? ('sub_country' as const) : null,
      regionValue: bounded ? geography.country : null,
    }),
    [bounded, geography.country],
  );
  const filtersRecent = useMemo(() => ({ ...filtersAll, window: '30' as const }), [filtersAll]);

  const allTime = useBoardCourses(viewerId, filtersAll, { limit: 60, enabled, sort: 'played' });
  const recent = useBoardCourses(viewerId, filtersRecent, { limit: 60, enabled, sort: 'played' });

  const boardIds = useMemo(() => (allTime.data?.rows ?? []).map((row) => row.course_id), [allTime.data]);
  const meta = useCourseCardMeta(enabled ? boardIds : []);
  const ratings = useRecentCourseRatings(enabled);

  /* SCOPE FILTERS THE SET (§5b). Club is the club's own course(s) by canonical
     club id; county is golf_courses.region exactly, never the board's display
     `area`, which falls back to sub_country and would fold a whole nation in. */
  const scoped = useMemo(() => {
    const rows = allTime.data?.rows ?? [];
    if (!enabled) return [];
    return rows.filter((row) => {
      const course = meta.data?.get(row.course_id);
      if (scope === 'club') return !!geography.primaryClubId && course?.clubId === geography.primaryClubId;
      if (scope === 'county') return !!geography.county && course?.rawRegion === geography.county;
      if (scope === 'country') return !!geography.country && course?.subCountry === geography.country;
      return true;
    });
  }, [allTime.data, meta.data, scope, geography.primaryClubId, geography.county, geography.country, enabled]);

  const scopedIds = useMemo(() => scoped.map((row) => row.course_id), [scoped]);
  const { ranks, isFetched: ranksFetched } = useTop100Ranks(enabled ? scopedIds : []);

  const recentByCourse = useMemo(() => {
    const map = new Map<string, { gross: number; toPar: number | null; by: string | null }>();
    for (const row of recent.data?.rows ?? []) {
      if (row.low_gross == null) continue;
      map.set(row.course_id, { gross: row.low_gross, toPar: row.low_to_par, by: row.low_by });
    }
    return map;
  }, [recent.data]);

  const items = useMemo<StreamItem[]>(() => {
    if (!enabled) return [];
    const out: Array<{ item: StreamItem; event: CourseEventKind; strength: number }> = [];

    for (const row of scoped) {
      const course = meta.data?.get(row.course_id);
      const burst = ratings.byCourse.get(row.course_id) ?? null;
      const low = recentByCourse.get(row.course_id) ?? null;
      const rank = ranks?.get(row.course_id) ?? null;

      /* §5b/§6.3 NEITHER ROUNDS NOR A RATING IS NOT A CANDIDATE. */
      if (row.rounds <= 0 && row.rating == null) continue;

      /* ONE LADDER, TWO CALLERS (D3): the same composer the server stream uses,
         so the RPC's Courses page and this fallback read identical copy. */
      const burstQualifies = !!burst && burst.count >= 2;
      const event: CourseEventKind = burstQualifies ? 'ratings' : low ? 'low' : 'stable';
      const strength = courseEventStrength(event, burst?.count ?? null);
      const headline =
        courseHeadline(t, {
          event,
          burstCount: burst?.count ?? null,
          burstMean: burst?.mean ?? null,
          lowGross: low?.gross ?? null,
          lowBy: low?.by ?? null,
          rounds: row.rounds,
          rating: row.rating,
          ratingCount: row.rating_count,
        }) ?? '';


      const ring: StreamItem['ring'] =
        geography.primaryClubId && course?.clubId === geography.primaryClubId
          ? 'club'
          : geography.county && course?.rawRegion === geography.county
            ? 'county'
            : geography.country && course?.subCountry === geography.country
              ? 'country'
              : 'world';

      out.push({
        event,
        strength,
        item: {
          id: `course:${row.course_id}`,
          kind: 'course',
          ring,
          lane: 'news',
          /* Ordering only, never rendered: event strength, then rating, then the
             tracked-round count (§5). */
          score: strength * 100 + (row.rating ?? 0) * 5 + Math.min(row.rounds, 100) / 100,
          consequence: null,
          subject: {
            course_id: row.course_id,
            course_name: row.name ?? course?.name ?? null,
            region: course?.region ?? row.area ?? null,
            sub_country: course?.subCountry ?? null,
            image_url: row.thumbnail_image ?? course?.imageUrl ?? null,
            /* THE RESOLVER HOLDS THE SHELL until it settles — never a gradient
               standing in for an unknown photograph. */
            pending: !meta.isFetched,
          },
          who: null,
          facts: {
            headline,
            rating: row.rating,
            rating_n: row.rating_count,
            top100_world: rank?.world ? rank.rank : null,
            top100_regional: rank && !rank.world ? rank.rank : null,
            /* BRIEF_COURSES_MERGED §3 — THE PAIRING RULE READS THIS FACT. The
               merged view pairs STABLE-FACT course cards two-up and gives event
               cards the full width, so the event kind has to travel with the card
               in the fallback exactly as it already does from the RPC. */
            course_event: event,
          },

          payload: {},
          seen: false,
        },
      });
    }

    out.sort((a, b) => (b.item.score - a.item.score) || a.item.id.localeCompare(b.item.id));

    /* THE CADENCE PASS IN A SINGLE-TYPE VIEW WORKS ON THE SUB-KIND (§5): every
       card here is kind 'course', so the key is the EVENT type, and the lead run
       is not three identical shapes. Positional, nothing dropped. */
    const ordered: StreamItem[] = [];
    const pool = [...out];
    while (pool.length > 0) {
      const previous = ordered[ordered.length - 1];
      let index = 0;
      if (previous) {
        const previousKey = `${out.find((entry) => entry.item.id === previous.id)?.event ?? 'stable'}:${previous.ring ?? 'none'}`;
        const different = pool.findIndex((candidate) => `${candidate.event}:${candidate.item.ring ?? 'none'}` !== previousKey);
        if (different >= 0) index = different;
      }
      ordered.push(pool.splice(index, 1)[0].item);
    }
    return ordered;
  }, [enabled, scoped, meta.data, meta.isFetched, ratings.byCourse, recentByCourse, ranks, geography, t, i18n.language]);

  if (!enabled) return EMPTY_VIEW;

  return {
    items,
    total: items.length,
    isFetched:
      allTime.isFetched &&
      recent.isFetched &&
      (boardIds.length === 0 || meta.isFetched) &&
      ratings.isFetched &&
      ranksFetched,
  };
}
