import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { getNotificationButtonClass } from '@/components/ui/NotificationCard';

interface FriendRequestButtonsProps {
  notificationId: string;
  requestId: string;
  requesterId: string;
  requesterName: string;
  initialStatus?: 'pending' | 'accepted' | 'declined';
  isMock?: boolean;
}

type RequestState = 'pending' | 'accepted' | 'declined' | 'loading';

export const FriendRequestButtons: React.FC<FriendRequestButtonsProps> = ({
  notificationId,
  requestId,
  requesterId,
  requesterName,
  initialStatus = 'pending',
  isMock = false,
}) => {
  const [state, setState] = useState<RequestState>(initialStatus);
  const queryClient = useQueryClient();

  /**
   * Helper to find the friend request ID if it wasn't provided or is invalid.
   * This handles edge cases where the notification data is incomplete.
   */
  const findFriendRequestId = async (currentUserId: string): Promise<string | null> => {
    // First try the provided requestId if it looks valid
    if (requestId && requestId.length > 10) {
      return requestId;
    }

    // Fallback: Query the user_friends table directly using requesterId and current user
    console.log('[FriendRequestButtons] requestId missing/invalid, querying user_friends directly');
    
    const { data, error } = await supabase
      .from('user_friends')
      .select('id')
      .eq('user_id', requesterId)
      .eq('friend_id', currentUserId)
      .eq('status', 'pending')
      .maybeSingle();

    if (error) {
      console.error('[FriendRequestButtons] Error querying user_friends:', error);
      return null;
    }

    if (data?.id) {
      console.log('[FriendRequestButtons] Found friend request via fallback query:', data.id);
      return data.id;
    }

    console.warn('[FriendRequestButtons] No pending friend request found');
    return null;
  };

  const handleAccept = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isMock) {
      setState('accepted');
      toast.success("Friend added");
      return;
    }
    
    setState('loading');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Find the friend request ID (with fallback logic)
      const actualRequestId = await findFriendRequestId(user.id);
      
      if (!actualRequestId) {
        // Last resort: Try to update by user_id/friend_id without knowing the ID
        console.log('[FriendRequestButtons] Attempting update by user_id/friend_id');
        
        const { error: updateError, count } = await supabase
          .from('user_friends')
          .update({ status: 'accepted' })
          .eq('user_id', requesterId)
          .eq('friend_id', user.id)
          .eq('status', 'pending');

        if (updateError) {
          throw updateError;
        }

        // The database trigger will handle the notification for the requester
      } else {
        // Update using the found/provided request ID
        const { error: updateError } = await supabase
          .from('user_friends')
          .update({ status: 'accepted' })
          .eq('id', actualRequestId);

        if (updateError) {
          throw updateError;
        }
      }

      // Mark the notification as read and update its data
      if (notificationId) {
        await supabase
          .from('notifications')
          .update({
            is_read: true,
            updated_at: new Date().toISOString(),
            data: { 
              status: 'accepted', 
              request_id: actualRequestId || requestId, 
              requester_id: requesterId 
            },
          })
          .eq('id', notificationId);
      }

      setState('accepted');
      toast.success("Friend added");
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friendship'] });
      queryClient.invalidateQueries({ queryKey: ['relationship-status'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      // Invalidate discovery exclusions so suggested users refreshes
      queryClient.invalidateQueries({ queryKey: ['discovery-exclusions'] });
      
    } catch (error) {
      console.error('[FriendRequestButtons] Error accepting friend request:', error);
      setState('pending');
      toast.error("We couldn't accept the request. Please try again.");
    }
  };

  const handleDecline = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isMock) {
      setState('declined');
      toast.info('Friend request declined');
      return;
    }
    
    setState('loading');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Find the friend request ID (with fallback logic)
      const actualRequestId = await findFriendRequestId(user.id);
      
      if (!actualRequestId) {
        // Last resort: Try to update by user_id/friend_id
        const { error: updateError } = await supabase
          .from('user_friends')
          .update({ status: 'declined' })
          .eq('user_id', requesterId)
          .eq('friend_id', user.id)
          .eq('status', 'pending');

        if (updateError) {
          throw updateError;
        }
      } else {
        const { error: updateError } = await supabase
          .from('user_friends')
          .update({ status: 'declined' })
          .eq('id', actualRequestId);

        if (updateError) {
          throw updateError;
        }
      }

      // Mark the notification as read
      if (notificationId) {
        await supabase
          .from('notifications')
          .update({
            is_read: true,
            updated_at: new Date().toISOString(),
            data: { 
              status: 'declined', 
              request_id: actualRequestId || requestId, 
              requester_id: requesterId 
            },
          })
          .eq('id', notificationId);
      }

      setState('declined');
      toast.info('Friend request declined');
      
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      // Invalidate discovery exclusions so suggested users refreshes
      queryClient.invalidateQueries({ queryKey: ['discovery-exclusions'] });
      
    } catch (error) {
      console.error('[FriendRequestButtons] Error declining friend request:', error);
      setState('pending');
      toast.error("We couldn't decline the request. Please try again.");
    }
  };

  if (state === 'accepted') {
    return (
      <span className={getNotificationButtonClass('statusSuccess')}>
        <Check className="h-3 w-3" />
        Accepted
      </span>
    );
  }

  if (state === 'declined') {
    return (
      <span className={getNotificationButtonClass('statusError')}>
        <X className="h-3 w-3" />
        Declined
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleAccept}
        disabled={state === 'loading'}
        className={cn(getNotificationButtonClass('primary'), "disabled:opacity-60")}
      >
        {state === 'loading' ? '...' : 'Accept'}
      </button>
      <button
        onClick={handleDecline}
        disabled={state === 'loading'}
        className={cn(getNotificationButtonClass('destructive'), "disabled:opacity-60")}
      >
        Decline
      </button>
    </div>
  );
};
