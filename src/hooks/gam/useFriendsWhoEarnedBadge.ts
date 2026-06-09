import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FriendWhoEarnedBadge {
  friend_user_id: string;
  friend_name: string;
  friend_avatar_url: string | null;
  earned_at: string;
  friend_tier: number | null;
}

/**
 * Returns the viewer's clbhouz friends who have earned a given badge.
 * Backed by RPC `get_friends_who_earned_badge` (already deployed, SECURITY DEFINER).
 */
export function useFriendsWhoEarnedBadge(
  badgeId: string | undefined,
  viewerUserId: string | undefined,
  limit = 5,
) {
  return useQuery({
    queryKey: ['friends-earned-badge', badgeId, viewerUserId, limit],
    enabled: Boolean(badgeId && viewerUserId),
    staleTime: 60_000,
    queryFn: async (): Promise<FriendWhoEarnedBadge[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_friends_who_earned_badge', {
        p_badge_id: badgeId,
        p_viewer_user_id: viewerUserId,
        p_limit: limit,
      });
      if (error) throw error;
      return (data ?? []) as FriendWhoEarnedBadge[];
    },
  });
}
