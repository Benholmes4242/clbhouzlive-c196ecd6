/**
 * useUnseenFriendReviews
 * Counts friend course reviews posted since the user last visited the Courses tab.
 * Uses localStorage to persist the last-seen timestamp per user.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

const STORAGE_KEY = (userId: string) => `clbhouz_courses_last_seen_${userId}`;
const MAX_BADGE = 99;

export function useUnseenFriendReviews() {
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();

  const { data: count = 0 } = useQuery({
    queryKey: ['unseen-friend-reviews', user?.id],
    queryFn: async (): Promise<number> => {
      if (!user?.id) return 0;

      // Get last-seen timestamp from localStorage
      const stored = localStorage.getItem(STORAGE_KEY(user.id));
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const lastSeen = stored ? new Date(stored) : thirtyDaysAgo;

      // Step 1: Get accepted friend IDs
      const { data: friendships } = await supabase
        .from('user_friends')
        .select('user_id, friend_id')
        .eq('status', 'accepted')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

      if (!friendships || friendships.length === 0) return 0;

      const friendIds = friendships
        .map(row => row.user_id === user.id ? row.friend_id : row.user_id)
        .filter(Boolean) as string[];

      // Step 2: Count friend reviews since last seen
      const { count: newCount } = await supabase
        .from('course_ratings')
        .select('id', { count: 'exact', head: true })
        .in('user_id', friendIds)
        .gt('created_at', lastSeen.toISOString());

      return Math.min(newCount ?? 0, MAX_BADGE);
    },
    enabled: !!user?.id,
    staleTime: 60_000,       // 1 min — don't hammer on every render
    refetchInterval: 120_000, // Poll every 2 mins
  });

  /** Call this when the user visits the Courses tab to clear the badge */
  const markCoursesAsSeen = useCallback(() => {
    if (!user?.id) return;
    localStorage.setItem(STORAGE_KEY(user.id), new Date().toISOString());
    queryClient.setQueryData(['unseen-friend-reviews', user.id], 0);
  }, [user?.id, queryClient]);

  return {
    unseenCount: count,
    hasUnseen: count > 0,
    markCoursesAsSeen,
  };
}
