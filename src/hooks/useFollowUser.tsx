import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AppLog } from '@/lib/logger';

export const useFollowUser = () => {
  const queryClient = useQueryClient();
  const { user } = useSupabaseSession();
  const [loading, setLoading] = useState(false);

  const invalidateFollowCaches = (targetUserId: string) => {
    queryClient.invalidateQueries({ queryKey: ['relationship-status', targetUserId] });
    queryClient.invalidateQueries({ queryKey: ['relationship-statuses'] });
    queryClient.invalidateQueries({ queryKey: ['followers-paginated'] });
    queryClient.invalidateQueries({ queryKey: ['following-paginated'] });
    queryClient.invalidateQueries({ queryKey: ['social-counts'] });
  };

  const followUser = async (targetUserId: string) => {
    if (!user) {
      toast.error('Please sign in to follow users');
      return false;
    }

    if (targetUserId === user.id) {
      AppLog.warn('[useFollowUser]', 'Attempted self-follow — blocked at client');
      return false;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: user.id,
          following_id: targetUserId
        });

      if (error) {
        AppLog.error('[useFollowUser]', 'Error following user:', error);
        toast.error('Failed to follow user');
        return false;
      }

      toast.success('Following user');
      invalidateFollowCaches(targetUserId);
      return true;
    } catch (error) {
      AppLog.error('[useFollowUser]', 'Error following user (RLS path):', error);
      toast.error('Failed to follow user');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const unfollowUser = async (targetUserId: string) => {
    if (!user) {
      toast.error('Please sign in to unfollow users');
      return false;
    }

    if (targetUserId === user.id) {
      AppLog.warn('[useFollowUser]', 'Attempted self-unfollow — blocked at client');
      return false;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);

      if (error) {
        AppLog.error('[useFollowUser]', 'Error unfollowing user:', error);
        toast.error('Failed to unfollow user');
        return false;
      }

      toast.success('Unfollowed user');
      invalidateFollowCaches(targetUserId);
      return true;
    } catch (error) {
      AppLog.error('[useFollowUser]', 'Error unfollowing user (RLS path):', error);
      toast.error('Failed to unfollow user');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    followUser,
    unfollowUser,
    loading
  };
};
