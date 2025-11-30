import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type Top100FriendSnapshot = {
  friend_id: string;
  display_name: string;
  profile_photo_url: string | null;
  home_club: string | null;
  total_top100_played: number;
};

export type Top100FriendsSnapshotResponse = {
  me: Top100FriendSnapshot | null;
  friends: Top100FriendSnapshot[];
};

export function useTop100FriendsSnapshot() {
  return useQuery({
    queryKey: ['top100-friends-snapshot'],
    queryFn: async (): Promise<Top100FriendsSnapshotResponse | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase.rpc('get_top100_friends_snapshot', {
        target_user_id: user.id,
      });

      if (error) throw error;

      const payload = (data ?? {}) as any;

      return {
        me: payload.me ?? null,
        friends: payload.friends ?? [],
      };
    },
    staleTime: 60_000,
  });
}
