/**
 * useUnseenFriendReviews
 * Counts friend course reviews posted since the user last visited the Courses tab.
 * Uses localStorage to persist the last-seen timestamp per user.
 * Returns both the count and the actual review details for banner display.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

const STORAGE_KEY = (userId: string) => `clbhouz_courses_last_seen_${userId}`;
const MAX_BADGE = 99;

export interface UnseenFriendReview {
  id: string;
  course_id: string;
  course_name: string;
  rating: number;
  reviewer_id: string;
  reviewer_name: string;
  reviewer_avatar: string | null;
  created_at: string;
}

interface UnseenFriendReviewsData {
  count: number;
  reviews: UnseenFriendReview[];
}

export function useUnseenFriendReviews() {
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();

  const { data } = useQuery<UnseenFriendReviewsData>({
    queryKey: ['unseen-friend-reviews', user?.id],
    queryFn: async (): Promise<UnseenFriendReviewsData> => {
      if (!user?.id) return { count: 0, reviews: [] };

      const stored = localStorage.getItem(STORAGE_KEY(user.id));
      const lastSeen = stored ? new Date(stored) : new Date();

      // Get accepted friend IDs
      const { data: friendships } = await supabase
        .from('user_friends')
        .select('user_id, friend_id')
        .eq('status', 'accepted')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

      if (!friendships || friendships.length === 0) return { count: 0, reviews: [] };

      const friendIds = friendships
        .map(row => row.user_id === user.id ? row.friend_id : row.user_id)
        .filter(Boolean) as string[];

      // Fetch unseen reviews with course + reviewer info
      const { data: ratings } = await supabase
        .from('course_ratings')
        .select(`
          id,
          course_id,
          rating,
          created_at,
          user_id,
          golf_courses!inner(name),
          user_profiles!inner(display_name, username, profile_photo_url)
        `)
        .in('user_id', friendIds)
        .gt('created_at', lastSeen.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      const reviews: UnseenFriendReview[] = (ratings || []).map((r: any) => ({
        id: r.id,
        course_id: r.course_id,
        course_name: (r.golf_courses as any)?.name || 'a course',
        rating: r.rating,
        reviewer_id: r.user_id,
        reviewer_name: (r.user_profiles as any)?.display_name
          || (r.user_profiles as any)?.username
          || 'A friend',
        reviewer_avatar: (r.user_profiles as any)?.profile_photo_url || null,
        created_at: r.created_at,
      }));

      return {
        count: Math.min(reviews.length, MAX_BADGE),
        reviews,
      };
    },
    enabled: !!user?.id,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const markCoursesAsSeen = useCallback(() => {
    if (!user?.id) return;
    localStorage.setItem(STORAGE_KEY(user.id), new Date().toISOString());
    queryClient.setQueryData(['unseen-friend-reviews', user.id], { count: 0, reviews: [] });
  }, [user?.id, queryClient]);

  return {
    unseenCount: data?.count ?? 0,
    hasUnseen: (data?.count ?? 0) > 0,
    unseenReviews: data?.reviews ?? [],
    markCoursesAsSeen,
  };
}
