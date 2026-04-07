/**
 * useUnseenFriendReviews
 * Counts unread friend_course_review notifications for the current user.
 * Returns both the count and the actual review details for banner display.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

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

      // Read unseen friend_course_review notifications directly
      // This keeps both the profile pill and courses dot in sync
      const { data: notifications } = await supabase
        .from('notifications')
        .select(`
          id,
          entity_id,
          data,
          created_at,
          actor_id,
          user_profiles!actor_id(display_name, username, profile_photo_url)
        `)
        .eq('user_id', user.id)
        .eq('type', 'friend_course_review')
        .eq('is_read', false)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(10);

      const reviews: UnseenFriendReview[] = (notifications || []).map((n: any) => ({
        id: n.entity_id,
        course_id: n.data?.course_id,
        course_name: n.data?.course_name || 'a course',
        rating: n.data?.rating,
        reviewer_id: n.actor_id,
        reviewer_name: n.user_profiles?.display_name
          || n.user_profiles?.username
          || 'A friend',
        reviewer_avatar: n.user_profiles?.profile_photo_url || null,
        created_at: n.created_at,
      }));

      return {
        count: Math.min(reviews.length, MAX_BADGE),
        reviews,
      };
    },
    enabled: !!user?.id,
    staleTime: 0,
    refetchInterval: 60_000,
  });

  const markCoursesAsSeen = useCallback(() => {
    if (!user?.id) return;
    queryClient.setQueryData(['unseen-friend-reviews', user.id], { count: 0, reviews: [] });
    // Also mark the DB notifications as read so the dot stays cleared on refresh
    supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('type', 'friend_course_review')
      .eq('is_read', false)
      .then(() => {});
  }, [user?.id, queryClient]);

  return {
    unseenCount: data?.count ?? 0,
    hasUnseen: (data?.count ?? 0) > 0,
    unseenReviews: data?.reviews ?? [],
    markCoursesAsSeen,
  };
}
