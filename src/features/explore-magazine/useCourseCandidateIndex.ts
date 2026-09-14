import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

/**
 * THE CANDIDATE INDEX (BRIEF_COURSES_MERGED).
 *
 * ONE bounded read that the merged Courses view's SHELVES, its SEARCH and its
 * REGION DROPDOWN all answer from, so a count in the dropdown, a tile in a rail
 * and a search hit can never disagree with one another. They are the same rows.
 *
 * THE CANDIDATE RULE IS §8's, unchanged: a course with NEITHER a tracked round
 * NOR a rating is never a candidate, so it is never in this index, never in a
 * rail, never a search hit and never an option in the dropdown.
 *
 * WHY THIS IS NOT "FILTERING A FETCHED PAGE" (§6). The index is the COMPLETE
 * candidate universe, not a page of it: every rated course, every course with a
 * tracked round, and every review with prose. Measured on the production base:
 * 3,557 round rows (one column), 175 rating rows, 96 rated courses and 256
 * courses with rounds — 330 candidate courses. A search over this set is a
 * search over everything that could be a card.
 *
 * WHAT IT DOES NOT COVER, REPORTED: the 23,296-row golf_courses table. A course
 * with no round and no rating cannot be a card under §8, so a name-only match
 * against it would produce a result that cannot be rendered. The unapplied
 * docs/sql/explore_courses_merged_search.sql proposes the server-side ranked
 * path that would let a non-candidate course be surfaced deliberately instead.
 */

const DAY = 86_400_000;

export interface IndexedCourse {
  id: string;
  name: string | null;
  region: string | null;
  subCountry: string | null;
  country: string | null;
  imageUrl: string | null;
  clubId: string | null;
}

export interface IndexedReview {
  id: string;
  courseId: string;
  userId: string | null;
  rating: number | null;
  review: string;
  createdAt: string;
}

export interface CourseRatingStats {
  n: number;
  mean: number;
  firstAt: string;
  /** Ratings inside the last 30 days. */
  n30: number;
  mean30: number;
  /** Ratings inside the last 365 days. */
  n365: number;
  mean365: number;
}

export interface CourseCandidateIndex {
  courses: Map<string, IndexedCourse>;
  /** Tracked 18-hole rounds per course. */
  roundsByCourse: Map<string, number>;
  /** Distinct members who have a tracked round at the course. */
  playersByCourse: Map<string, Set<string>>;
  ratingsByCourse: Map<string, CourseRatingStats>;
  /** Reviews WITH PROSE only — §8: a rating with no words is never a card. */
  reviews: IndexedReview[];
  reviewersById: Map<string, { name: string | null; username: string | null; photo: string | null }>;
}

const EMPTY: CourseCandidateIndex = {
  courses: new Map(),
  roundsByCourse: new Map(),
  playersByCourse: new Map(),
  ratingsByCourse: new Map(),
  reviews: [],
  reviewersById: new Map(),
};

async function chunkedCourses(ids: string[]): Promise<IndexedCourse[]> {
  const out: IndexedCourse[] = [];
  for (let i = 0; i < ids.length; i += 200) {
    const slice = ids.slice(i, i + 200);
    const { data, error } = await supabase
      .from('golf_courses')
      .select('id, name, region, sub_country, country, thumbnail_image, club_id')
      .in('id', slice);
    if (error) throw error;
    for (const row of (data ?? []) as Array<{
      id: string;
      name: string | null;
      region: string | null;
      sub_country: string | null;
      country: string | null;
      thumbnail_image: string | null;
      club_id: string | null;
    }>) {
      out.push({
        id: row.id,
        name: row.name,
        region: row.region,
        subCountry: row.sub_country,
        country: row.country,
        imageUrl: row.thumbnail_image,
        clubId: row.club_id,
      });
    }
  }
  return out;
}

export function useCourseCandidateIndex(enabled: boolean) {
  const query = useQuery<CourseCandidateIndex>({
    queryKey: ['explore-magazine', 'course-candidate-index', 'v1'],
    enabled,
    staleTime: 15 * 60_000,
    queryFn: async () => {
      const [roundsResult, ratingsResult] = await Promise.all([
        supabase
          .from('gam_round_stats' as never)
          .select('course_id, user_id')
          .eq('holes_played', 18)
          .not('course_id', 'is', null)
          .limit(20000),
        supabase
          .from('course_ratings')
          .select('id, course_id, rating, review, created_at, user_id')
          .eq('is_mock', false)
          .not('course_id', 'is', null)
          .limit(4000),
      ]);
      if (roundsResult.error) throw roundsResult.error;
      if (ratingsResult.error) throw ratingsResult.error;

      const roundsByCourse = new Map<string, number>();
      const playersByCourse = new Map<string, Set<string>>();
      for (const row of (roundsResult.data ?? []) as unknown as Array<{
        course_id: string | null;
        user_id: string | null;
      }>) {
        if (!row.course_id) continue;
        roundsByCourse.set(row.course_id, (roundsByCourse.get(row.course_id) ?? 0) + 1);
        if (row.user_id) {
          const set = playersByCourse.get(row.course_id) ?? new Set<string>();
          set.add(row.user_id);
          playersByCourse.set(row.course_id, set);
        }
      }

      const now = Date.now();
      const ratingsByCourse = new Map<string, CourseRatingStats>();
      const sums = new Map<string, { s: number; n: number; s30: number; n30: number; s365: number; n365: number; first: string }>();
      const reviews: IndexedReview[] = [];
      for (const row of (ratingsResult.data ?? []) as Array<{
        id: string;
        course_id: string | null;
        rating: number | null;
        review: string | null;
        created_at: string;
        user_id: string | null;
      }>) {
        if (!row.course_id) continue;
        const prose = (row.review ?? '').trim();
        if (prose !== '') {
          reviews.push({
            id: row.id,
            courseId: row.course_id,
            userId: row.user_id ?? null,
            rating: row.rating == null ? null : Number(row.rating),
            review: prose,
            createdAt: row.created_at,
          });
        }
        if (row.rating == null) continue;
        const age = now - new Date(row.created_at).getTime();
        const entry =
          sums.get(row.course_id) ?? { s: 0, n: 0, s30: 0, n30: 0, s365: 0, n365: 0, first: row.created_at };
        const rating = Number(row.rating);
        entry.s += rating;
        entry.n += 1;
        if (age <= 30 * DAY) {
          entry.s30 += rating;
          entry.n30 += 1;
        }
        if (age <= 365 * DAY) {
          entry.s365 += rating;
          entry.n365 += 1;
        }
        if (row.created_at < entry.first) entry.first = row.created_at;
        sums.set(row.course_id, entry);
      }
      for (const [courseId, entry] of sums) {
        ratingsByCourse.set(courseId, {
          n: entry.n,
          mean: entry.s / entry.n,
          firstAt: entry.first,
          n30: entry.n30,
          mean30: entry.n30 > 0 ? entry.s30 / entry.n30 : 0,
          n365: entry.n365,
          mean365: entry.n365 > 0 ? entry.s365 / entry.n365 : 0,
        });
      }

      const candidateIds = Array.from(new Set([...roundsByCourse.keys(), ...ratingsByCourse.keys()]));
      const courseRows = await chunkedCourses(candidateIds);
      const courses = new Map(courseRows.map((row) => [row.id, row]));

      /* THE REVIEWER IS NAMED, so the reviewer's own name is searchable (§6) and
         the card's who-line is real identity from user_profiles — never a WHS
         friend row (the standing identity rule). */
      const reviewerIds = Array.from(new Set(reviews.map((r) => r.userId).filter((id): id is string => !!id)));
      const reviewersById = new Map<string, { name: string | null; username: string | null; photo: string | null }>();
      for (let i = 0; i < reviewerIds.length; i += 200) {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id, display_name, username, profile_photo_url')
          .in('id', reviewerIds.slice(i, i + 200));
        if (error) throw error;
        for (const row of (data ?? []) as Array<{
          id: string;
          display_name: string | null;
          username: string | null;
          profile_photo_url: string | null;
        }>) {
          reviewersById.set(row.id, {
            name: row.display_name,
            username: row.username,
            photo: row.profile_photo_url,
          });
        }
      }

      return { courses, roundsByCourse, playersByCourse, ratingsByCourse, reviews, reviewersById };
    },
  });

  const index = useMemo(() => query.data ?? EMPTY, [query.data]);
  return {
    index,
    isFetched: enabled ? query.isFetched : true,
    isError: !!query.error,
    refetch: query.refetch,
  };
}
