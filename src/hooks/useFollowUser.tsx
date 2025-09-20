import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useFollowUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, isFollowing }: { userId: string; isFollowing: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (isFollowing) {
        // Unfollow - for now, just simulate the action
        console.log('Unfollowing user:', userId);
        return false;
      } else {
        // Follow - for now, just simulate the action
        console.log('Following user:', userId);
        return true;
      }
    },
    onSuccess: (newFollowingState, { userId }) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['followStatus', userId] });
      queryClient.invalidateQueries({ queryKey: ['userProfile', userId] });
      
      toast({
        description: newFollowingState ? 'Successfully followed user' : 'Successfully unfollowed user',
      });
    },
    onError: (error) => {
      console.error('Follow/unfollow error:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to update follow status. Please try again.',
      });
    }
  });
}