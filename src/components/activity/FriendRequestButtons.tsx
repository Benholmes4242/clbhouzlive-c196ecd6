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

  const handleAccept = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMock) {
      setState('accepted');
      toast.success(`You're now friends with ${requesterName}!`);
      return;
    }
    setState('loading');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await supabase.from('user_friends').update({ status: 'accepted' }).eq('id', requestId);
      await supabase.from('notifications').insert({
        user_id: requesterId, actor_id: user.id, type: 'friend_accepted',
        title: 'Friend request accepted', entity_type: 'profile', entity_id: user.id,
        is_read: false, data: { request_id: requestId, requester_id: requesterId },
      });
      await supabase.from('notifications').update({
        is_read: true, updated_at: new Date().toISOString(),
        data: { status: 'accepted', request_id: requestId, requester_id: requesterId },
      }).eq('id', notificationId);

      setState('accepted');
      toast.success(`You're now friends with ${requesterName}!`);
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    } catch (error) {
      console.error('Error accepting friend request:', error);
      setState('pending');
      toast.error("We couldn't accept the request.");
    }
  };

  const handleDecline = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMock) { setState('declined'); toast.info('Friend request declined'); return; }
    setState('loading');
    try {
      await supabase.from('user_friends').update({ status: 'declined' }).eq('id', requestId);
      await supabase.from('notifications').update({
        is_read: true, updated_at: new Date().toISOString(),
        data: { status: 'declined', request_id: requestId, requester_id: requesterId },
      }).eq('id', notificationId);

      setState('declined');
      toast.info('Friend request declined');
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    } catch (error) {
      console.error('Error declining friend request:', error);
      setState('pending');
      toast.error("We couldn't decline the request.");
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
