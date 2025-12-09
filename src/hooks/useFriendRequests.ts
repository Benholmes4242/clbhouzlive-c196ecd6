import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';

interface FriendRequest {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  created_at: string;
  requester?: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
  };
}

/**
 * Hook to fetch incoming friend requests for the current user
 */
export function useFriendRequests() {
  const { user } = useSupabaseSession();
  const currentUserId = user?.id;

  const { data: requests = [], isLoading, refetch } = useQuery({
    queryKey: ['friendRequests', currentUserId],
    queryFn: async (): Promise<FriendRequest[]> => {
      if (!currentUserId) return [];
      
      // Get pending requests where I'm the receiver (friend_id)
      const { data, error } = await supabase
        .from('user_friends')
        .select(`
          id,
          user_id,
          friend_id,
          status,
          created_at
        `)
        .eq('friend_id', currentUserId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching friend requests:', error);
        return [];
      }

      // Fetch requester profiles
      if (data && data.length > 0) {
        const requesterIds = data.map(r => r.user_id);
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, display_name, username, profile_photo_url')
          .in('id', requesterIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        
        return data.map(request => ({
          ...request,
          requester: profileMap.get(request.user_id),
        }));
      }

      return data || [];
    },
    enabled: !!currentUserId,
    staleTime: 30_000,
  });

  return {
    requests,
    isLoading,
    refetch,
    count: requests.length,
  };
}
