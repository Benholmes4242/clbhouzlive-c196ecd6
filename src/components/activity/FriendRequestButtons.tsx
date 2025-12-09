import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      toast.success(`You're now friends with ${requesterName}!`);
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
      toast.success(`You're now friends with ${requesterName}!`);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['relationship-status', requesterId] });
    } catch (error) {
      console.error('Error accepting friend request:', error);
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
      // Update the friend request status to declined
      const { error } = await supabase
        .from('user_friends')
        .update({ status: 'declined' })
        .eq('id', requestId);

      if (error) throw error;

      setState('declined');
      toast.info('Friend request declined');
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['relationship-status', requesterId] });
    } catch (error) {
      console.error('Error declining friend request:', error);
      setState('pending');
      toast.error("We couldn't decline the request. Please try again.");
    }
  };

  // Already handled states
  if (state === 'accepted') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-sq-pill">
        <Check className="h-3 w-3" />
        Accepted
      </span>
    );
  }

  if (state === 'declined') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-muted-foreground bg-muted/60 rounded-sq-pill">
        <X className="h-3 w-3" />
        Declined
      </span>
    );
  }

  // Pending state - show Accept/Decline buttons
  return (
    <div className="flex items-center gap-1.5">
      <Button
        size="sm"
        onClick={handleAccept}
        disabled={state === 'loading'}
        className={cn(
          "h-7 px-3 text-xs font-medium rounded-sq-pill",
          "bg-emerald-600 hover:bg-emerald-700 text-white"
        )}
      >
        {state === 'loading' ? '...' : 'Accept'}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleDecline}
        disabled={state === 'loading'}
        className={cn(
          "h-7 px-2.5 text-xs font-medium rounded-sq-pill",
          "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        Decline
      </Button>
    </div>
  );
};
