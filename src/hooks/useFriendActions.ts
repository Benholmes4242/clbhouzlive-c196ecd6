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
import { AppLog } from '@/lib/logger';
import { patchFollow } from '@/lib/followCache';
import type { RelationshipStatusRow } from '@/hooks/useRelationshipStatuses';

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
    queryClient.invalidateQueries({ queryKey: ['relationship-statuses'] });
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
  const sendFriendRequest = useCallback(async (targetUserId: string, relationship?: RelationshipStatusRow): Promise<boolean> => {
    // Self-guard
    if (targetUserId === currentUserId) {
      AppLog.warn('[useFriendActions]', 'Attempted self-friend — blocked at client');
      return false;
    }

    // Check block state if relationship provided
    if (relationship?.is_blocking || relationship?.is_blocked) {
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
      const { error: insertError } = await supabase
        .from('user_friends')
        .insert({
          user_id: currentUserId,
          friend_id: targetUserId,
          status: 'pending'
        });

      if (insertError && insertError.code !== '23505') {
        throw insertError;
      }

      if (insertError) {
        // Unique-violation: check what's actually there
        const { data: existing, error: fetchError } = await supabase
          .from('user_friends')
          .select('id, user_id, friend_id, status')
          .or(
            `and(user_id.eq.${currentUserId},friend_id.eq.${targetUserId}),` +
            `and(user_id.eq.${targetUserId},friend_id.eq.${currentUserId})`
          )
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (!existing) {
          toast.error('Friend request already exists');
          return false;
        }
        if (existing.status === 'accepted') {
          toast.info("You're already friends");
          return false;
        }
        if (existing.status === 'pending') {
          toast.info('Friend request already pending');
          return false;
        }
        if (existing.status === 'blocked') {
          toast.error("You can't send a friend request to this user");
          return false;
        }

        // Stale declined row — resurrect as pending from current user
        const { error: updateError } = await supabase
          .from('user_friends')
          .update({
            user_id: currentUserId,
            friend_id: targetUserId,
            status: 'pending',
          })
          .eq('id', existing.id);

        if (updateError) throw updateError;
      }

      // Note: Notification is now created automatically by database trigger
      toast.success('Friend request sent');
      invalidateQueries();
      return true;
    } catch (error) {
      AppLog.error('[useFriendActions]', 'Error sending friend request:', error);
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

      // auto_follow_on_friend_accept trigger creates user_follows rows in BOTH
      // directions. Patch follow caches so every surface updates without refresh.
      patchFollow(
        queryClient,
        { targetActorType: 'personal', targetActorId: requesterId, targetUserId: requesterId, viewerUserId: currentUserId },
        { isFollowing: true },
      );
      patchFollow(
        queryClient,
        { targetActorType: 'personal', targetActorId: currentUserId, targetUserId: currentUserId, viewerUserId: requesterId },
        { isFollowing: true },
      );

      // Note: Notification is now created automatically by database trigger
      toast.success('Friend request accepted');
      invalidateQueries();
      return true;
    } catch (error) {
      AppLog.error('[useFriendActions]', 'Error accepting friend request:', error);
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
        .delete()
        .eq('user_id', requesterId)
        .eq('friend_id', currentUserId)
        .eq('status', 'pending');

      if (error) throw error;

      toast.success('Friend request declined');
      invalidateQueries();
      return true;
    } catch (error) {
      AppLog.error('[useFriendActions]', 'Error declining friend request:', error);
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
      AppLog.error('[useFriendActions]', 'Error cancelling friend request:', error);
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
      AppLog.error('[useFriendActions]', 'Error removing friend:', error);
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
