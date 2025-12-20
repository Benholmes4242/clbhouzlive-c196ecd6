import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';

/**
 * Hook to get the list of user IDs that the current user follows
 */
export function useFollowedUsers() {
  const { user } = useSupabaseSession();
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFollowedUsers = async () => {
      if (!user?.id) {
        setFollowedIds([]);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', user.id);

        if (error) throw error;

        const ids = data?.map(f => f.following_id) || [];
        setFollowedIds(ids);
      } catch (err) {
        console.error('Error fetching followed users:', err);
        setFollowedIds([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFollowedUsers();
  }, [user?.id]);

  return { followedIds, isLoading };
}

export default useFollowedUsers;
