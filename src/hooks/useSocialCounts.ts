import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SocialCounts {
  followers: number;
  following: number;
  friends: number;
}

export function useSocialCounts(userId: string | undefined) {
  return useQuery({
    queryKey: ['social-counts', userId],
    enabled: !!userId,
    queryFn: async (): Promise<SocialCounts> => {
      if (!userId) {
        return { followers: 0, following: 0, friends: 0 };
      }

      // Fetch followers count
      const { count: followersCount } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

      // Fetch following count
      const { count: followingCount } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

      // Fetch friends count (accepted friendships where user is either party)
      const { count: friendsCount } = await supabase
        .from('user_friends')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'accepted')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

      return {
        followers: followersCount || 0,
        following: followingCount || 0,
        friends: friendsCount || 0
      };
    },
    staleTime: 30_000, // 30 seconds
  });
}
