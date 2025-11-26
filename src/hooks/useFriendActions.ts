import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useRelationshipStatus } from '@/hooks/useRelationshipStatus';

interface UseFriendActionsProps {
  currentUserId: string;
}

export const useFriendActions = ({ currentUserId }: UseFriendActionsProps) => {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  
  // Helper to check block state before friend actions
  const checkBlockStatus = (targetUserId: string, relationship: any) => {
    if (relationship?.hasBlockedThem || relationship?.isBlockedByThem) {
      toast.error("Action not allowed", {
        description: "You can't interact with this user.",
      });
      return false;
    }
    return true;
  };

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['relationship-status'] });
    queryClient.invalidateQueries({ queryKey: ['social-counts'] });
    queryClient.invalidateQueries({ queryKey: ['friends-list'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const sendFriendRequest = async (targetUserId: string, relationship?: any): Promise<boolean> => {
    // Check block state if relationship provided
    if (relationship && !checkBlockStatus(targetUserId, relationship)) {
      return false;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_friends')
        .insert({
          user_id: currentUserId,
          friend_id: targetUserId,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Friend request sent');
      invalidateQueries();
      return true;
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error('Failed to send friend request');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const acceptFriendRequest = async (requesterId: string) => {
    setLoading(true);
    try {
      // Update the friend request status to accepted
      const { error } = await supabase
        .from('user_friends')
        .update({ status: 'accepted' })
        .eq('user_id', requesterId)
        .eq('friend_id', currentUserId)
        .eq('status', 'pending');

      if (error) throw error;

      toast.success('Friend request accepted');
      invalidateQueries();
      return true;
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast.error('Failed to accept friend request');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const declineFriendRequest = async (requesterId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_friends')
        .delete()
        .eq('user_id', requesterId)
        .eq('friend_id', currentUserId)
        .eq('status', 'pending');

      if (error) throw error;

      toast.success('Friend request declined');
      invalidateQueries();
      return true;
    } catch (error) {
      console.error('Error declining friend request:', error);
      toast.error('Failed to decline friend request');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const cancelFriendRequest = async (targetUserId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_friends')
        .delete()
        .eq('user_id', currentUserId)
        .eq('friend_id', targetUserId)
        .eq('status', 'pending');

      if (error) throw error;

      toast.success('Friend request cancelled');
      invalidateQueries();
      return true;
    } catch (error) {
      console.error('Error cancelling friend request:', error);
      toast.error('Failed to cancel friend request');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const unfriend = async (friendId: string) => {
    setLoading(true);
    try {
      // Delete the friendship (works in either direction due to accepted status)
      const { error } = await supabase
        .from('user_friends')
        .delete()
        .eq('status', 'accepted')
        .or(`and(user_id.eq.${currentUserId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${currentUserId})`);

      if (error) throw error;

      toast.success('Friend removed');
      invalidateQueries();
      return true;
    } catch (error) {
      console.error('Error removing friend:', error);
      toast.error('Failed to remove friend');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    unfriend
  };
};
