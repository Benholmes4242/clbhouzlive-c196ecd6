/**
 * @deprecated This hook is deprecated. Use `useFriendship` from '@/hooks/useFriendship' instead.
 * 
 * This wrapper exists for backward compatibility. The underlying `useFriendship` hook
 * properly creates notifications when friend requests are sent/accepted.
 * 
 * Database triggers now also ensure notifications are created for:
 * - friend_request (on INSERT with status='pending')
 * - friend_accepted (on UPDATE when status changes to 'accepted')
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface UseFriendActionsProps {
  currentUserId: string;
}

/**
 * @deprecated Use `useFriendship` hook instead for new implementations.
 * This hook is maintained for backward compatibility with existing components.
 */
export const useFriendActions = ({ currentUserId }: UseFriendActionsProps) => {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const invalidateQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['relationship-status'] });
    queryClient.invalidateQueries({ queryKey: ['social-counts'] });
    queryClient.invalidateQueries({ queryKey: ['friends-list'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['friendship'] });
    queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    queryClient.invalidateQueries({ queryKey: ['friends'] });
    queryClient.invalidateQueries({ queryKey: ['friends-paginated'] });
    // Invalidate discovery exclusions so suggested users refreshes
    queryClient.invalidateQueries({ queryKey: ['discovery-exclusions'] });
  }, [queryClient]);

  /**
   * Send a friend request to another user.
   * The database trigger will automatically create a notification for the recipient.
   */
  const sendFriendRequest = useCallback(async (targetUserId: string, relationship?: any): Promise<boolean> => {
    // Check block state if relationship provided
    if (relationship?.hasBlockedThem || relationship?.isBlockedByThem) {
      toast.error("Action not allowed", {
        description: "You can't interact with this user.",
      });
      return false;
    }

    if (!currentUserId) {
      toast.error('Please sign in to send friend requests');
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

      if (error) {
        // Check for duplicate constraint error
        if (error.code === '23505') {
          toast.error('Friend request already exists');
          return false;
        }
        throw error;
      }

      // Note: Notification is now created automatically by database trigger
      toast.success('Friend request sent');
      invalidateQueries();
      return true;
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error("Couldn't send request");
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentUserId, invalidateQueries]);

  /**
   * Accept a friend request from another user.
   * The database trigger will automatically create a notification for the requester.
   */
  const acceptFriendRequest = useCallback(async (requesterId: string): Promise<boolean> => {
    if (!currentUserId) {
      toast.error('Please sign in to accept friend requests');
      return false;
    }

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

      // Note: Notification is now created automatically by database trigger
      toast.success('Friend request accepted');
      invalidateQueries();
      return true;
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast.error("Couldn't accept request");
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentUserId, invalidateQueries]);

  /**
   * Decline a friend request from another user.
   */
  const declineFriendRequest = useCallback(async (requesterId: string): Promise<boolean> => {
    if (!currentUserId) {
      toast.error('Please sign in');
      return false;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_friends')
        .update({ status: 'declined' })
        .eq('user_id', requesterId)
        .eq('friend_id', currentUserId)
        .eq('status', 'pending');

      if (error) throw error;

      toast.success('Friend request declined');
      invalidateQueries();
      return true;
    } catch (error) {
      console.error('Error declining friend request:', error);
      toast.error("Couldn't decline request");
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentUserId, invalidateQueries]);

  /**
   * Cancel a pending friend request that you sent.
   */
  const cancelFriendRequest = useCallback(async (targetUserId: string): Promise<boolean> => {
    if (!currentUserId) {
      toast.error('Please sign in');
      return false;
    }

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
      toast.error("Couldn't cancel request");
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentUserId, invalidateQueries]);

  /**
   * Remove an existing friendship.
   */
  const unfriend = useCallback(async (friendId: string): Promise<boolean> => {
    if (!currentUserId) {
      toast.error('Please sign in');
      return false;
    }

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
      toast.error("Couldn't remove friend");
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentUserId, invalidateQueries]);

  return {
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    unfriend
  };
};
