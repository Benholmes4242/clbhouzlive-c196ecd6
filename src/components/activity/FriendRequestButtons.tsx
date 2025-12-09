import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';

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

  // Already handled states - show as pills
  if (state === 'accepted') {
    return (
      <span className="inline-flex h-8 items-center gap-1 rounded-full bg-emerald-500/10 px-3 text-xs font-medium text-emerald-600">
        <Check className="h-3 w-3" />
        Accepted
      </span>
    );
  }

  if (state === 'declined') {
    return (
      <span className="inline-flex h-8 items-center gap-1 rounded-full bg-red-500/5 px-3 text-xs font-medium text-red-500">
        <X className="h-3 w-3" />
        Declined
      </span>
    );
  }

  // Pending state - show glassy Accept/Decline buttons
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleAccept}
        disabled={state === 'loading'}
        className={cn(
          "h-8 rounded-full border-emerald-500 bg-emerald-500/10 px-4 text-xs font-semibold text-emerald-600",
          "hover:bg-emerald-500/15",
          "disabled:opacity-60 disabled:cursor-not-allowed"
        )}
      >
        {state === 'loading' ? '...' : 'Accept'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDecline}
        disabled={state === 'loading'}
        className={cn(
          "h-8 rounded-full border-red-400 bg-red-500/5 px-4 text-xs font-semibold text-red-500",
          "hover:bg-red-500/10",
          "disabled:opacity-60 disabled:cursor-not-allowed"
        )}
      >
        Decline
      </Button>
    </div>
  );
};
