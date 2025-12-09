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
      // Update the friend request status to accepted
      const { error } = await supabase
        .from('user_friends')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) throw error;

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

  // Already handled states
  if (state === 'accepted') {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-full">
        <Check className="h-3 w-3" />
        Accepted
      </span>
    );
  }

  if (state === 'declined') {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/60 rounded-full">
        <X className="h-3 w-3" />
        Declined
      </span>
    );
  }

  // Pending state - show glassy Accept/Decline buttons
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleAccept}
        disabled={state === 'loading'}
        className={cn(
          "rounded-full px-4 py-1.5 text-sm font-semibold",
          "bg-emerald-500/90 text-white shadow-sm",
          "backdrop-blur-sm",
          "hover:bg-emerald-500",
          "active:scale-[0.98] transition",
          "disabled:opacity-60 disabled:cursor-not-allowed"
        )}
      >
        {state === 'loading' ? '...' : 'Accept'}
      </button>
      <button
        onClick={handleDecline}
        disabled={state === 'loading'}
        className={cn(
          "rounded-full px-4 py-1.5 text-sm font-medium",
          "border border-red-400/40",
          "text-red-500",
          "bg-white/70 backdrop-blur-sm",
          "hover:bg-white",
          "active:scale-[0.98] transition",
          "disabled:opacity-60 disabled:cursor-not-allowed"
        )}
      >
        Decline
      </button>
    </div>
  );
};
