import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FriendProfile {
  id: string;
  username: string;
  display_name: string;
  profile_photo_url: string | null;
}

/**
 * Fetches accepted friends for a user.
 * Friends can appear in either user_id or friend_id column.
 * Uses 2-step fetch to avoid PostgREST FK-join issues.
 */
export function useUserFriends(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-friends', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];

      // Step 1: Get friend IDs from user_friends
      const { data: rows, error } = await supabase
        .from('user_friends')
        .select('user_id, friend_id')
        .eq('status', 'accepted')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

      if (error) {
        console.error('[useUserFriends] Failed to fetch friend rows:', error);
        throw error;
      }

      if (!rows || rows.length === 0) return [];

      // Extract the "other" user's ID
      const friendIds = rows
        .map((row) => (row.user_id === userId ? row.friend_id : row.user_id))
        .filter(Boolean) as string[];

      if (friendIds.length === 0) return [];

      // Step 2: Fetch profiles for those IDs
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, username, display_name, profile_photo_url')
        .in('id', friendIds)
        .is('deleted_at', null);

      if (profilesError) {
        console.error('[useUserFriends] Failed to fetch friend profiles:', profilesError);
        throw profilesError;
      }

      // Build a map and preserve order from friendIds
      const profilesById = new Map((profiles || []).map((p) => [p.id, p]));

      return friendIds
        .map((id) => profilesById.get(id))
        .filter(Boolean) as FriendProfile[];
    },
    staleTime: 60_000,
  });
}
