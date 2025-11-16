import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FriendProfile {
  id: string;
  username: string;
  display_name: string;
  profile_photo_url: string | null;
}

export function useUserFriends(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-friends', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_relationships' as any)
        .select(`
          following_id,
          user_profiles!user_relationships_following_id_fkey (
            id,
            username,
            display_name,
            profile_photo_url
          )
        `)
        .eq('follower_id', userId)
        .eq('status', 'following');

      if (error) throw error;

      return (data || [])
        .map((row: any) => row.user_profiles)
        .filter(Boolean) as FriendProfile[];
    },
    staleTime: 60_000,
  });
}
