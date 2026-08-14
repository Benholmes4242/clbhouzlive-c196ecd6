/**
 * useDiscoverPrompt (BRIEF_DISCOVER_ONE_THING) — resolves the ONE thing the
 * page asks the member to do. Strict priority, first match wins:
 *
 *   1 rate   — a played course with no rating   (usePlayedUnratedCourses)
 *   2 finish — a rating with no category detail (course_ratings breakdowns)
 *   3 photo  — a tracked round in the last 14 days at a course the member
 *              has posted no media from        (useCareerRounds + own posts)
 *
 * Nothing outstanding => null, and the row does not render at all.
 * Signed out => null, no queries fire.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DISCOVER_PROMPT_KEY } from '../discoverQueryKeys';
import { usePlayedUnratedCourses } from '@/hooks/usePlayedUnratedCourses';
import { useCareerRounds } from '@/hooks/gam/useCareerRounds';
import { useFriendIdSet } from './useFriendIdSet';
import { useCircleLatestRounds } from '@/hooks/gam/useCircleLatestRounds';
import { RAIL_CAP } from '../FriendsPlayedRail';

export type DiscoverPromptKind = 'rate' | 'finish' | 'photo' | 'friends';

export interface DiscoverPrompt {
  kind: DiscoverPromptKind;
  /** Empty for 'friends' — there is no course behind that ask. */
  courseId: string;
  courseName: string;
  thumbnail: string | null;
  /**
   * WHEN the thing happened, so the row can state a fact instead of hedging
   * with "recently" (BRIEF_ONE_THING_ROW_CRAFT). Every kind already had a date
   * in the rows it filters on, so NO new fetch was needed:
   *   rate   — last_played from usePlayedUnratedCourses
   *   finish — review_date (falling back to created_at) on the rating
   *   photo  — play_date on the tracked round
   * Null only when the underlying column is null, and always null for
   * 'friends', whose line is a promise rather than a date.
   */
  at: string | null;
}



interface MissingDetailRow {
  course_id: string;
  name: string;
  thumbnail_image: string | null;
  review_date: string | null;
}

/** Ratings that exist but carry no category breakdown, newest first. */
function useRatingsMissingDetail(userId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: [...DISCOVER_PROMPT_KEY, 'missing-detail', userId],
    enabled: !!userId && enabled,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<MissingDetailRow[]> => {
      const { data, error } = await supabase
        .from('course_ratings')
        .select(
          'course_id, review_date, created_at, design_score, condition_score, clubhouse_score, facilities_score, golf_courses(name, thumbnail_image)',
        )
        .eq('user_id', userId as string)
        .eq('is_mock', false)
        .gt('rating', 0)
        .or(
          'design_score.is.null,condition_score.is.null,clubhouse_score.is.null,facilities_score.is.null',
        )
        .order('created_at', { ascending: false })
        .limit(25);
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        course_id: r.course_id,
        name: r.golf_courses?.name ?? '',
        thumbnail_image: r.golf_courses?.thumbnail_image ?? null,
        review_date: r.review_date ?? r.created_at ?? null,
      }));
    },
  });
}

/** Course ids the member has already posted about (any media / any post). */
function usePostedCourseIds(userId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: [...DISCOVER_PROMPT_KEY, 'posted-courses', userId],
    enabled: !!userId && enabled,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await supabase
        .from('posts')
        .select('course_id')
        .eq('user_id', userId as string)
        .not('course_id', 'is', null)
        .limit(500);
      if (error) throw error;
      return new Set((data ?? []).map((p: any) => p.course_id as string));
    },
  });
}

export function useDiscoverPrompt(userId: string | undefined): {
  prompt: DiscoverPrompt | null;
  resolved: boolean;
} {
  const { courses: playedUnrated, loading: unratedLoading } =
    usePlayedUnratedCourses(userId);

  const rateMatch = useMemo(() => {
    const sorted = [...playedUnrated].sort(
      (a, b) =>
        new Date(b.last_played ?? 0).getTime() - new Date(a.last_played ?? 0).getTime(),
    );
    return sorted[0] ?? null;
  }, [playedUnrated]);

  const needFinish = !!userId && !unratedLoading && !rateMatch;
  const missingDetail = useRatingsMissingDetail(userId, needFinish);

  const finishMatch = useMemo(
    () => (missingDetail.data ?? []).find((r) => !!r.name) ?? null,
    [missingDetail.data],
  );

  const needPhoto =
    needFinish && !missingDetail.isLoading && !finishMatch;

  const rounds = useCareerRounds(needPhoto ? userId : undefined);
  const posted = usePostedCourseIds(userId, needPhoto);

  // 4 friends — LAST, and only on ZERO accepted friendships. A member with
  // friends who have not played is looking at a data gap they cannot act on;
  // nagging there would fire every quiet fortnight.
  const friendIds = useFriendIdSet(userId);


  const photoMatch = useMemo(() => {
    if (!needPhoto || !rounds.data || !posted.data) return null;
    const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
    return (
      rounds.data.find(
        (r) =>
          !!r.course_id &&
          !!r.course_name &&
          new Date(r.play_date).getTime() >= cutoff &&
          !posted.data!.has(r.course_id as string),
      ) ?? null
    );
  }, [needPhoto, rounds.data, posted.data]);

  // The SAME query the rail runs — identical key and options, so this reads the
  // rail's cache and adds no round-trip.
  const circleRounds = useCircleLatestRounds(userId, {
    limit: RAIL_CAP,
    allowMultiplePerFriend: true,
  });



  if (!userId) return { prompt: null, resolved: true };

  if (unratedLoading) return { prompt: null, resolved: false };

  if (rateMatch) {
    return {
      resolved: true,
      prompt: {
        kind: 'rate',
        courseId: rateMatch.course_id,
        courseName: rateMatch.name,
        thumbnail: rateMatch.thumbnail_image ?? null,
        at: rateMatch.last_played ?? null,

      },
    };
  }

  if (missingDetail.isLoading) return { prompt: null, resolved: false };

  if (finishMatch) {
    return {
      resolved: true,
      prompt: {
        kind: 'finish',
        courseId: finishMatch.course_id,
        courseName: finishMatch.name,
        thumbnail: finishMatch.thumbnail_image,
        at: finishMatch.review_date,

      },
    };
  }

  if (rounds.isLoading || posted.isLoading) return { prompt: null, resolved: false };

  if (photoMatch) {
    return {
      resolved: true,
      prompt: {
        kind: 'photo',
        courseId: photoMatch.course_id as string,
        courseName: photoMatch.course_name as string,
        thumbnail: null,
        at: (photoMatch.play_date as string | null) ?? null,

      },
    };
  }

  if (friendIds.isLoading || circleRounds.isPending) return { prompt: null, resolved: false };

  // 4 friends — LAST, and it STANDS DOWN while "Who's been playing" is showing
  // suggested tiles (BRIEF_WHOS_BEEN_PLAYING 4.1/4.2). Its copy promises rounds
  // that would then be visible directly beneath it, and two asks for the same
  // thing on one screen is one too many. The kind, its copy and its route to
  // the Find golfers sheet all remain: this is still the right prompt when the
  // rail genuinely cannot fill.
  const railRows = circleRounds.data ?? [];
  if ((friendIds.data?.size ?? 0) === 0 && railRows.length === 0) {
    return {
      resolved: true,
      prompt: {
        kind: 'friends',
        courseId: '',
        courseName: '',
        thumbnail: null,
        at: null,
      },
    };
  }


  return { prompt: null, resolved: true };
}
