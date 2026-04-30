import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { patchFollow } from '@/lib/followCache';

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

  const findFriendRequestId = async (currentUserId: string): Promise<string | null> => {
    if (requestId && requestId.length > 10) {
      return requestId;
    }
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
    if (isMock) { setState('accepted'); toast.success("Friend added"); return; }
    setState('loading');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const actualRequestId = await findFriendRequestId(user.id);
      if (!actualRequestId) {
        const { error: updateError } = await supabase
          .from('user_friends').update({ status: 'accepted' })
          .eq('user_id', requesterId).eq('friend_id', user.id).eq('status', 'pending');
        if (updateError) throw updateError;
      } else {
        const { error: updateError } = await supabase
          .from('user_friends').update({ status: 'accepted' }).eq('id', actualRequestId);
        if (updateError) throw updateError;
      }
      if (notificationId) {
        await supabase.from('notifications').update({
          is_read: true, updated_at: new Date().toISOString(),
          data: { status: 'accepted', request_id: actualRequestId || requestId, requester_id: requesterId },
        }).eq('id', notificationId);
      }
      setState('accepted');
      toast.success("Friend added");
      // auto_follow_on_friend_accept trigger creates user_follows rows in BOTH
      // directions. Patch follow caches so every surface updates without refresh.
      patchFollow(
        queryClient,
        { targetActorType: 'personal', targetActorId: requesterId, targetUserId: requesterId, viewerUserId: user.id },
        { isFollowing: true },
      );
      patchFollow(
        queryClient,
        { targetActorType: 'personal', targetActorId: user.id, targetUserId: user.id, viewerUserId: requesterId },
        { isFollowing: true },
      );
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friendship'] });
      queryClient.invalidateQueries({ queryKey: ['relationship-status'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['discovery-exclusions'] });
    } catch (error) {
      console.error('[FriendRequestButtons] Error accepting friend request:', error);
      setState('pending');
      toast.error("We couldn't accept the request. Please try again.");
    }
  };

  const handleDecline = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMock) { setState('declined'); toast.info('Friend request declined'); return; }
    setState('loading');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const actualRequestId = await findFriendRequestId(user.id);
      if (!actualRequestId) {
        const { error: updateError } = await supabase
          .from('user_friends').update({ status: 'declined' })
          .eq('user_id', requesterId).eq('friend_id', user.id).eq('status', 'pending');
        if (updateError) throw updateError;
      } else {
        const { error: updateError } = await supabase
          .from('user_friends').update({ status: 'declined' }).eq('id', actualRequestId);
        if (updateError) throw updateError;
      }
      if (notificationId) {
        await supabase.from('notifications').update({
          is_read: true, updated_at: new Date().toISOString(),
          data: { status: 'declined', request_id: actualRequestId || requestId, requester_id: requesterId },
        }).eq('id', notificationId);
      }
      setState('declined');
      toast.info('Friend request declined');
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['discovery-exclusions'] });
    } catch (error) {
      console.error('[FriendRequestButtons] Error declining friend request:', error);
      setState('pending');
      toast.error("We couldn't decline the request. Please try again.");
    }
  };

  if (state === 'accepted') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)', fontSize: 12, fontWeight: 700, color: '#16A34A' }}>
        <Check className="h-3 w-3" />
        Accepted
      </span>
    );
  }

  if (state === 'declined') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.20)', fontSize: 12, fontWeight: 700, color: '#DC2626' }}>
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
        className="disabled:opacity-60"
        style={{
          padding: '7px 18px', borderRadius: 20,
          background: '#F7931E', color: '#ffffff',
          fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(247,147,30,0.25)',
        }}
      >
        {state === 'loading' ? '...' : 'Accept'}
      </button>
      <button
        onClick={handleDecline}
        disabled={state === 'loading'}
        className="disabled:opacity-60"
        style={{
          padding: '7px 16px', borderRadius: 20,
          background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.20)',
          color: '#DC2626', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}
      >
        Decline
      </button>
    </div>
  );
};
