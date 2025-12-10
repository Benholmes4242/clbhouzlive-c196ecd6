import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface FriendRequestButtonsProps {
  notificationId: string;   // notifications.id for updating is_read + data.status
  requestId: string;        // user_friends.id
  requesterId: string;      // user who sent the request
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

  // Shared base pill class for unified styling - SDS corners, 30% shorter height
  const basePillClass = "inline-flex items-center justify-center rounded-sq-xs border px-3 h-6 text-[11px] font-semibold transition-colors";

  const handleAccept = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isMock) {
      setState('accepted');
      toast.success(`You're now friends with ${requesterName}!`, {
        position: 'top-center',
        className: 'max-w-xs rounded-2xl bg-slate-900/90 text-white shadow-lg',
      });
      return;
    }

    setState('loading');
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1) Update user_friends.status -> 'accepted'
      const { error: friendError } = await supabase
        .from('user_friends')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (friendError) throw friendError;

      // 2) Create friend_accepted notification for the requester
      const { error: notifyError } = await supabase
        .from('notifications')
        .insert({
          user_id: requesterId,
          actor_id: user.id,
          type: 'friend_accepted',
          title: 'Friend request accepted',
          message: null,
          entity_type: 'profile',
          entity_id: user.id,
          is_read: false,
          data: {
            request_id: requestId,
            requester_id: requesterId,
          },
        });

      if (notifyError) {
        console.warn('Failed to create friend_accepted notification:', notifyError);
      }

      // 3) Update the original friend_request notification: is_read = true, data.status = 'accepted'
      const { error: updateNotifError } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          updated_at: new Date().toISOString(),
          data: {
            status: 'accepted',
            request_id: requestId,
            requester_id: requesterId,
          },
        })
        .eq('id', notificationId);

      if (updateNotifError) {
        console.warn('Failed to update notification status:', updateNotifError);
      }

      setState('accepted');
      toast.success(`You're now friends with ${requesterName}!`, {
        position: 'top-center',
        className: 'max-w-xs rounded-2xl bg-slate-900/90 text-white shadow-lg',
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['activity-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['relationship-status', requesterId] });
    } catch (error) {
      console.error('Error accepting friend request:', error);
      setState('pending');
      toast.error("We couldn't accept the request. Please try again.", {
        position: 'top-center',
        className: 'max-w-xs rounded-2xl bg-slate-900/90 text-white shadow-lg',
      });
    }
  };

  const handleDecline = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isMock) {
      setState('declined');
      toast.info('Friend request declined', {
        position: 'top-center',
        className: 'max-w-xs rounded-2xl bg-slate-900/90 text-white shadow-lg',
      });
      return;
    }

    setState('loading');
    
    try {
      // 1) Update user_friends.status -> 'declined'
      const { error: friendError } = await supabase
        .from('user_friends')
        .update({ status: 'declined' })
        .eq('id', requestId);

      if (friendError) throw friendError;

      // 2) Update the notification: is_read = true, data.status = 'declined'
      const { error: updateNotifError } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          updated_at: new Date().toISOString(),
          data: {
            status: 'declined',
            request_id: requestId,
            requester_id: requesterId,
          },
        })
        .eq('id', notificationId);

      if (updateNotifError) {
        console.warn('Failed to update notification status:', updateNotifError);
      }

      setState('declined');
      toast.info('Friend request declined', {
        position: 'top-center',
        className: 'max-w-xs rounded-2xl bg-slate-900/90 text-white shadow-lg',
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['activity-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['relationship-status', requesterId] });
    } catch (error) {
      console.error('Error declining friend request:', error);
      setState('pending');
      toast.error("We couldn't decline the request. Please try again.", {
        position: 'top-center',
        className: 'max-w-xs rounded-2xl bg-slate-900/90 text-white shadow-lg',
      });
    }
  };
  
  // Already handled states - show as pills with unified styling
  if (state === 'accepted') {
    return (
      <span className={cn(basePillClass, "border-emerald-500 bg-emerald-500/10 text-emerald-600 gap-1")}>
        <Check className="h-3 w-3" />
        Accepted
      </span>
    );
  }

  if (state === 'declined') {
    return (
      <span className={cn(basePillClass, "border-red-400 bg-red-500/5 text-red-500 gap-1")}>
        <X className="h-3 w-3" />
        Declined
      </span>
    );
  }

  // Pending state - show Accept/Decline buttons with unified pill styling
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleAccept}
        disabled={state === 'loading'}
        className={cn(
          basePillClass,
          "border-emerald-500 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15",
          "disabled:opacity-60 disabled:cursor-not-allowed"
        )}
      >
        {state === 'loading' ? '...' : 'Accept'}
      </button>
      <button
        onClick={handleDecline}
        disabled={state === 'loading'}
        className={cn(
          basePillClass,
          "border-red-400 bg-red-500/5 text-red-500 hover:bg-red-500/10",
          "disabled:opacity-60 disabled:cursor-not-allowed"
        )}
      >
        Decline
      </button>
    </div>
  );
};
