import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

/**
 * useFollowingIdSet — who the viewer FOLLOWS, ids only, one read.
 *
 * GOLF THIS WEEK needs this to decide which cards carry a Follow button
 * (BRIEF_GOLF_THIS_WEEK §2.2). It is a SET, resolved once for the whole
 * section: a per-card follow-status query in a ten-card rail would be ten
 * round trips for a button most cards do not show.
 *
 * Reads the legacy `user_follows` projection rather than `follows` because the
 * mirror trigger keeps it current and every other reader on this page already
 * uses it. Follows are OUTBOUND only — being followed is not a choice the
 * viewer made and must not suppress the button.
 */
export function useFollowingIdSet(userId: string | undefined) {
  return useQuery({
    queryKey: ['courseled', 'following-ids', userId],
    queryFn: async (): Promise<Set<string>> => {
      if (!userId) return new Set<string>();
      const { data } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', userId);
      return new Set(
        ((data ?? []) as Array<{ following_id: string }>).map((r) => r.following_id),
      );
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export default useFollowingIdSet;
