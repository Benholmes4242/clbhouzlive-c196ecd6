import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';
import { toast } from 'sonner';

export const useFollowUser = () => {
  const { user } = useSupabaseSession();
  const [loading, setLoading] = useState(false);

  const followUser = async (targetUserId: string) => {
    if (!user) {
      toast.error('Please sign in to follow users');
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
        console.error('Error following user:', error);
        toast.error('Failed to follow user');
        return false;
      }

      toast.success('Following user');
      return true;
    } catch (error) {
      console.error('Error following user:', error);
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

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);

      if (error) {
        console.error('Error unfollowing user:', error);
        toast.error('Failed to unfollow user');
        return false;
      }

      toast.success('Unfollowed user');
      return true;
    } catch (error) {
      console.error('Error unfollowing user:', error);
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