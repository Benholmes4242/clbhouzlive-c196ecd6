/**
 * useWatchPersonalSignals
 *
 * Pulls the lightweight personal signal sets used to re-rank the Watch /
 * Clips feeds client-side. Returns:
 *   - playedCourseIds:   courses the viewer has played
 *   - wantToPlayCourseIds: courses on the viewer's "want to play" shortlist
 *   - followingUserIds:  creators the viewer follows
 *
 * Friend boost is derived per-post from the existing `creatorRelation` field
 * on FeedPost (no extra fetch required).
 *
 * All three queries are individually cached and tolerant — any failure
 * returns an empty Set so ranking degrades gracefully.
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PersonalSignals {
  playedCourseIds: Set<string>;
  wantToPlayCourseIds: Set<string>;
  followingUserIds: Set<string>;
  isLoading: boolean;
}

const STALE_MS = 5 * 60 * 1000;
const GC_MS = 30 * 60 * 1000;

export function useWatchPersonalSignals(userId: string | undefined): PersonalSignals {
  const playedQuery = useQuery({
    queryKey: ['watch-personal:played', userId],
    queryFn: async (): Promise<Set<string>> => {
      if (!userId) return new Set();
      const { data, error } = await supabase
        .from('user_course_activity' as any)
        .select('course_id')
        .eq('user_id', userId);
      if (error || !data) return new Set();
      return new Set(
        (data as unknown as Array<{ course_id: string | null }>)
          .map(r => r.course_id)
          .filter((id): id is string => !!id)
      );
    },
    enabled: !!userId,
    staleTime: STALE_MS,
    gcTime: GC_MS,
  });

  const wantToPlayQuery = useQuery({
    queryKey: ['watch-personal:want-to-play', userId],
    queryFn: async (): Promise<Set<string>> => {
      if (!userId) return new Set();
      const { data, error } = await supabase
        .from('course_shortlists')
        .select('course_id')
        .eq('user_id', userId)
        .in('list_key', ['want_to_play', 'wishlist']);
      if (error || !data) return new Set();
      return new Set(
        (data as unknown as Array<{ course_id: string | null }>)
          .map(r => r.course_id)
          .filter((id): id is string => !!id)
      );
    },
    enabled: !!userId,
    staleTime: STALE_MS,
    gcTime: GC_MS,
  });

  const followingQuery = useQuery({
    queryKey: ['watch-personal:following', userId],
    queryFn: async (): Promise<Set<string>> => {
      if (!userId) return new Set();
      const { data, error } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', userId);
      if (error || !data) return new Set();
      return new Set(
        (data as Array<{ following_id: string | null }>)
          .map(r => r.following_id)
          .filter((id): id is string => !!id)
      );
    },
    enabled: !!userId,
    staleTime: STALE_MS,
    gcTime: GC_MS,
  });

  return useMemo<PersonalSignals>(() => ({
    playedCourseIds: playedQuery.data ?? new Set<string>(),
    wantToPlayCourseIds: wantToPlayQuery.data ?? new Set<string>(),
    followingUserIds: followingQuery.data ?? new Set<string>(),
    isLoading: playedQuery.isLoading || wantToPlayQuery.isLoading || followingQuery.isLoading,
  }), [
    playedQuery.data, wantToPlayQuery.data, followingQuery.data,
    playedQuery.isLoading, wantToPlayQuery.isLoading, followingQuery.isLoading,
  ]);
}

/**
 * Compute additive personal boost for a single post. Caller passes pre-fetched
 * signal sets so this is O(1) per post.
 *   +10 played course
 *   + 5 want-to-play
 *   + 8 followed creator
 *   + 3 friend creator_relation
 */
export function computePersonalBoost(
  post: { courseId?: string; userId: string; creatorRelation: string },
  signals: { playedCourseIds: Set<string>; wantToPlayCourseIds: Set<string>; followingUserIds: Set<string> }
): number {
  let boost = 0;
  if (post.courseId && signals.playedCourseIds.has(post.courseId)) boost += 10;
  if (post.courseId && signals.wantToPlayCourseIds.has(post.courseId)) boost += 5;
  if (signals.followingUserIds.has(post.userId)) boost += 8;
  if (post.creatorRelation === 'friend') boost += 3;
  return boost;
}
