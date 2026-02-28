import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';
import { toast } from 'sonner';

export type FriendshipStatus = 
  | 'none'           // No relationship
  | 'request_sent'   // I sent them a request
  | 'request_received' // They sent me a request
  | 'friends'        // Accepted friends
  | 'declined'       // Request was declined
  | 'blocked';       // One party blocked

interface FriendshipData {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
}

/**
 * Hook to manage friendship status with a single target user
 */
export function useFriendship(targetUserId: string | undefined) {
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();
  const currentUserId = user?.id;

  // Check friendship status between current user and target
  const { data, isLoading } = useQuery({
    queryKey: ['friendship', currentUserId, targetUserId],
    queryFn: async (): Promise<{ status: FriendshipStatus; relationshipId?: string }> => {
      if (!currentUserId || !targetUserId) {
        return { status: 'none' };
      }
      
      // Query for any relationship between the two users
      const { data: friendship } = await supabase
        .from('user_friends')
        .select('id, user_id, friend_id, status')
        .or(
          `and(user_id.eq.${currentUserId},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${currentUserId})`
        )
        .in('status', ['pending', 'accepted', 'blocked'])
        .maybeSingle();
      
      if (!friendship) {
        return { status: 'none' };
      }

      const relationshipId = friendship.id;

      if (friendship.status === 'blocked') {
        return { status: 'blocked', relationshipId };
      }

      if (friendship.status === 'accepted') {
        return { status: 'friends', relationshipId };
      }

      // Pending - determine who sent the request
      if (friendship.status === 'pending') {
        if (friendship.user_id === currentUserId) {
          return { status: 'request_sent', relationshipId };
        } else {
          return { status: 'request_received', relationshipId };
        }
      }

      return { status: 'none' };
    },
    enabled: !!currentUserId && !!targetUserId && currentUserId !== targetUserId,
    staleTime: 30_000,
  });

  const friendshipStatus = data?.status ?? 'none';
  const relationshipId = data?.relationshipId;

  // Send friend request
  const sendRequestMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId || !targetUserId) throw new Error('Missing user IDs');
      
      const { error } = await supabase
        .from('user_friends')
        .insert({
          user_id: currentUserId,
          friend_id: targetUserId,
          status: 'pending',
        });
      
      if (error) {
        // Check if it's a duplicate constraint error
        if (error.code === '23505') {
          throw new Error('Friend request already exists');
        }
        throw error;
      }
      // Notification is created by database trigger - no frontend insert needed
    },
    onSuccess: () => {
      toast.success('Friend request sent');
      invalidateQueries();
    },
    onError: (error) => {
      console.error('Error sending friend request:', error);
      toast.error(error.message || 'Failed to send friend request');
    },
  });

  // Cancel friend request (for requests I sent)
  const cancelRequestMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId || !relationshipId) throw new Error('Missing data');
      
      const { error } = await supabase
        .from('user_friends')
        .delete()
        .eq('id', relationshipId)
        .eq('user_id', currentUserId); // Only delete if I'm the requester
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Friend request cancelled');
      invalidateQueries();
    },
    onError: (error) => {
      console.error('Error cancelling request:', error);
      toast.error('Failed to cancel request');
    },
  });

  // Accept friend request
  const acceptRequestMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId || !relationshipId) throw new Error('Missing data');
      
      const { error } = await supabase
        .from('user_friends')
        .update({ status: 'accepted' })
        .eq('id', relationshipId)
        .eq('friend_id', currentUserId); // Only accept if I'm the receiver
      
      if (error) throw error;
      // Notification is created by database trigger - no frontend insert needed
    },
    onSuccess: () => {
      toast.success('Request accepted');
      invalidateQueries();
    },
    onError: (error) => {
      console.error('Error accepting request:', error);
      toast.error("Couldn't accept request");
    },
  });

  // Decline friend request
  const declineRequestMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId || !relationshipId) throw new Error('Missing data');
      
      const { error } = await supabase
        .from('user_friends')
        .update({ status: 'declined' })
        .eq('id', relationshipId)
        .eq('friend_id', currentUserId); // Only decline if I'm the receiver
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Friend request declined');
      invalidateQueries();
    },
    onError: (error) => {
      console.error('Error declining request:', error);
      toast.error('Failed to decline request');
    },
  });

  // Unfriend (remove accepted friendship)
  const unfriendMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId || !relationshipId) throw new Error('Missing data');
      
      const { error } = await supabase
        .from('user_friends')
        .delete()
        .eq('id', relationshipId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Removed from friends');
      invalidateQueries();
    },
    onError: (error) => {
      console.error('Error removing friend:', error);
      toast.error('Failed to remove friend');
    },
  });

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['friendship', currentUserId, targetUserId] });
    queryClient.invalidateQueries({ queryKey: ['relationship-status', targetUserId] });
    queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    queryClient.invalidateQueries({ queryKey: ['friends'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    // Invalidate discovery exclusions so suggested users refreshes
    queryClient.invalidateQueries({ queryKey: ['discovery-exclusions'] });
  };

  const isUpdating = 
    sendRequestMutation.isPending || 
    cancelRequestMutation.isPending || 
    acceptRequestMutation.isPending || 
    declineRequestMutation.isPending ||
    unfriendMutation.isPending;

  return {
    status: friendshipStatus,
    isLoading,
    isUpdating,
    sendRequest: sendRequestMutation.mutateAsync,
    cancelRequest: cancelRequestMutation.mutateAsync,
    acceptRequest: acceptRequestMutation.mutateAsync,
    declineRequest: declineRequestMutation.mutateAsync,
    unfriend: unfriendMutation.mutateAsync,
  };
}
