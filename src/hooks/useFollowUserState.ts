import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from 'sonner';

export const useFollowUserState = (targetUserId: string) => {
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if already following
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user || !targetUserId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId)
          .maybeSingle();

        if (error) throw error;
        setIsFollowing(!!data);
      } catch (error) {
        console.error('Error checking follow status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkFollowStatus();
  }, [user, targetUserId]);

  // Toggle follow mutation
  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);

        if (error) throw error;
      } else {
        // Follow
        const { error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            following_id: targetUserId,
          });

        if (error) throw error;
      }
    },
    onMutate: async () => {
      // Optimistic update
      setIsFollowing(!isFollowing);
    },
    onError: (error) => {
      // Revert optimistic update
      setIsFollowing(isFollowing);
      console.error('Error toggling follow:', error);
      toast.error('Failed to update follow status');
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['user-follows'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['suggested-users'] });
    },
  });

  return {
    isFollowing,
    isLoading: isLoading || mutation.isPending,
    toggleFollow: mutation.mutate,
  };
};
