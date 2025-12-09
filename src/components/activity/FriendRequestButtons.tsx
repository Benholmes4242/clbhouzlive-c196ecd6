import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface FriendRequestButtonsProps {
  requestId: string;
  requesterId: string;
  requesterName: string;
  isMock?: boolean;
}

type RequestState = 'pending' | 'accepted' | 'declined' | 'loading';

export const FriendRequestButtons: React.FC<FriendRequestButtonsProps> = ({
  requestId,
  requesterId,
  requesterName,
  isMock = false,
}) => {
  const [state, setState] = useState<RequestState>('pending');
  const queryClient = useQueryClient();

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

      // Update the friend request status to accepted
      const { error } = await supabase
        .from('user_friends')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) throw error;

      // Create "friend_accepted" notification for the original requester
      // so they see "X accepted your friend request" in their Activity feed
      const { error: notifyError } = await supabase
        .from('notifications')
        .insert({
          user_id: requesterId, // The person who sent the request (they receive this notification)
          actor_id: user.id, // The person who accepted (current user)
          type: 'friend_accepted',
          title: 'Friend request accepted',
          message: null,
          entity_type: 'profile',
          entity_id: user.id,
          is_read: false,
        });

      if (notifyError) {
        console.warn('Failed to create friend_accepted notification:', notifyError);
        // Don't throw - the main action succeeded
      }

      setState('accepted');
      toast.success(`You're now friends with ${requesterName}!`, {
        position: 'top-center',
        className: 'max-w-xs rounded-2xl bg-slate-900/90 text-white shadow-lg',
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
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
      // Update the friend request status to declined
      const { error } = await supabase
        .from('user_friends')
        .update({ status: 'declined' })
        .eq('id', requestId);

      if (error) throw error;

      setState('declined');
      toast.info('Friend request declined', {
        position: 'top-center',
        className: 'max-w-xs rounded-2xl bg-slate-900/90 text-white shadow-lg',
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
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

  // Shared base pill class for unified styling
  const basePillClass = "inline-flex items-center justify-center rounded-full border px-4 h-9 text-xs font-semibold transition-colors";
  
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
