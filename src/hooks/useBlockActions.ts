import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface UseBlockActionsProps {
  currentUserId: string;
}

export const useBlockActions = ({ currentUserId }: UseBlockActionsProps) => {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['relationship-status'] });
    queryClient.invalidateQueries({ queryKey: ['social-counts'] });
    queryClient.invalidateQueries({ queryKey: ['followers-list'] });
    queryClient.invalidateQueries({ queryKey: ['following-list'] });
    queryClient.invalidateQueries({ queryKey: ['friends-list'] });
    queryClient.invalidateQueries({ queryKey: ['nearby-users'] });
  };

  const blockUser = async (targetUserId: string) => {
    setLoading(true);
    try {
      // Insert block record
      const { error: blockError } = await supabase
        .from('user_blocks')
        .insert({
          blocker_id: currentUserId,
          blocked_id: targetUserId
        });

      if (blockError) throw blockError;

      // Clean up any friendship
      await supabase
        .from('user_friends')
        .delete()
        .or(`and(user_id.eq.${currentUserId},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${currentUserId})`);

      // Remove follows in both directions
      await supabase
        .from('user_follows')
        .delete()
        .or(`and(follower_id.eq.${currentUserId},following_id.eq.${targetUserId}),and(follower_id.eq.${targetUserId},following_id.eq.${currentUserId})`);

      toast.success('Blocked');
      invalidateQueries();
      return true;
    } catch (error) {
      console.error('Error blocking user:', error);
      toast.error("Couldn't block user");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const unblockUser = async (targetUserId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_blocks')
        .delete()
        .eq('blocker_id', currentUserId)
        .eq('blocked_id', targetUserId);

      if (error) throw error;

      toast.success('Unblocked');
      invalidateQueries();
      return true;
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast.error("Couldn't unblock user");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    blockUser,
    unblockUser
  };
};
