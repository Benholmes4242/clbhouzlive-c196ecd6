import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CancelFriendRequestParams {
  requestId: string;
  targetUserId: string;
  targetUserName: string;
}

/**
 * Hook to cancel a sent friend request.
 * - Updates the sender's activity to show "Cancelled" state
 * - Hides the pending request from the receiver's feed
 */
export function useCancelFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, targetUserId, targetUserName }: CancelFriendRequestParams) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update the friend request status to cancelled
      const { error: updateError } = await supabase
        .from('user_friends')
        .update({ status: 'cancelled' })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Update sender's notification to cancelled type
      const { error: senderNotifyError } = await supabase
        .from('notifications')
        .update({ 
          type: 'friend_cancelled',
          data: { target_user_name: targetUserName },
        })
        .eq('user_id', user.id)
        .eq('entity_id', targetUserId)
        .eq('type', 'friend_request_sent');

      if (senderNotifyError) {
        console.warn('Failed to update sender notification:', senderNotifyError);
      }

      // Hide/delete the receiver's pending friend request notification
      const { error: hideError } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', targetUserId)
        .eq('actor_id', user.id)
        .eq('type', 'friend_request');

      if (hideError) {
        console.warn('Failed to hide receiver notification:', hideError);
      }

      return { targetUserName };
    },
    onSuccess: ({ targetUserName }) => {
      toast.info(`You cancelled your friend request to ${targetUserName}`, {
        position: 'top-center',
        className: 'max-w-xs rounded-2xl bg-slate-900/90 text-white shadow-lg',
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    },
    onError: (error) => {
      console.error('Error cancelling friend request:', error);
      toast.error("We couldn't cancel the request. Please try again.", {
        position: 'top-center',
        className: 'max-w-xs rounded-2xl bg-slate-900/90 text-white shadow-lg',
      });
    },
  });
}
