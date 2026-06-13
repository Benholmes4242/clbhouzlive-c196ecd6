import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Flag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { ActivityNotification } from '@/hooks/useActivityFeed';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import {
  getActorDisplayName,
  getActorAvatarUrl,
} from '@/components/activity/rows/rowHelpers';
import { patchFollow } from '@/lib/followCache';
import {
  INK, INK_SOFT, INK_SUBTLE,
  BORDER, SURFACE, UNREAD_BG, UNREAD_BORDER,
  REVEAL, CARD_RADIUS, AMBER,
} from './tokens';

interface Props {
  notification: ActivityNotification;
  onClick: () => void;
}

type State = 'pending' | 'loading' | 'accepted' | 'declined';

export const RequestNotificationCard: React.FC<Props> = ({ notification, onClick }) => {
  const actorName = getActorDisplayName(notification);
  const avatarUrl = getActorAvatarUrl(notification);
  const username = notification.actor_username;
  const mutual = notification.data?.mutual_friends_count as number | undefined;
  const requesterId = notification.actor_id!;
  const initialStatus = (notification.data?.status as State | undefined) || 'pending';
  const [state, setState] = useState<State>(
    initialStatus === 'accepted' || initialStatus === 'declined' ? initialStatus : 'pending',
  );
  const qc = useQueryClient();

  const findFriendRequestId = async (currentUserId: string): Promise<string | null> => {
    const requestId = notification.data?.request_id as string | undefined;
    if (requestId && requestId.length > 10) return requestId;
    const { data } = await supabase
      .from('user_friends')
      .select('id')
      .eq('user_id', requesterId).eq('friend_id', currentUserId).eq('status', 'pending')
      .maybeSingle();
    return data?.id ?? null;
  };

  const handleAccept = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (notification.is_mock) { setState('accepted'); toast.success("You're now connected"); return; }
    setState('loading');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const id = await findFriendRequestId(user.id);
      if (id) {
        const { error } = await supabase.from('user_friends').update({ status: 'accepted' }).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_friends').update({ status: 'accepted' })
          .eq('user_id', requesterId).eq('friend_id', user.id).eq('status', 'pending');
        if (error) throw error;
      }
      await supabase.from('notifications').update({
        is_read: true, updated_at: new Date().toISOString(),
        data: { status: 'accepted', request_id: id, requester_id: requesterId },
      }).eq('id', notification.id);
      setState('accepted');
      toast.success("You're now connected");
      patchFollow(qc, { targetActorType: 'personal', targetActorId: requesterId, targetUserId: requesterId, viewerUserId: user.id }, { isFollowing: true });
      patchFollow(qc, { targetActorType: 'personal', targetActorId: user.id, targetUserId: user.id, viewerUserId: requesterId }, { isFollowing: true });
      qc.invalidateQueries({ queryKey: ['activity-feed'] });
      qc.invalidateQueries({ queryKey: ['friendRequests'] });
      qc.invalidateQueries({ queryKey: ['friends'] });
      qc.invalidateQueries({ queryKey: ['relationship-status'] });
    } catch (err) {
      console.error('[RequestNotificationCard] accept failed', err);
      setState('pending');
      toast.error("We couldn't accept the request. Please try again.");
    }
  };

  const handleDecline = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (notification.is_mock) { setState('declined'); toast.info('Request declined'); return; }
    setState('loading');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const id = await findFriendRequestId(user.id);
      if (id) {
        const { error } = await supabase.from('user_friends').delete().eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_friends').delete()
          .eq('user_id', requesterId).eq('friend_id', user.id).eq('status', 'pending');
        if (error) throw error;
      }
      await supabase.from('notifications').update({
        is_read: true, updated_at: new Date().toISOString(),
        data: { status: 'declined', requester_id: requesterId },
      }).eq('id', notification.id);
      setState('declined');
      toast.info('Request declined');
      qc.invalidateQueries({ queryKey: ['activity-feed'] });
      qc.invalidateQueries({ queryKey: ['friendRequests'] });
    } catch (err) {
      console.error('[RequestNotificationCard] decline failed', err);
      setState('pending');
      toast.error("We couldn't decline the request. Please try again.");
    }
  };

  const resolved = state === 'accepted' || state === 'declined';
  const resolvedText = state === 'accepted' ? "You're now connected" : 'Request declined';

  return (
    <motion.div
      {...REVEAL}
      onClick={onClick}
      className="cursor-pointer active:scale-[0.985] transition-transform"
      style={{
        background: notification.is_unread ? UNREAD_BG : SURFACE,
        border: `1px solid ${notification.is_unread ? UNREAD_BORDER : BORDER}`,
        borderRadius: CARD_RADIUS,
        padding: 14,
      }}
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div style={{ borderRadius: '34%', lineHeight: 0 }}>
            <SquircleAvatar src={avatarUrl} alt={actorName || 'User'} size={48} fallback={actorName?.charAt(0) || '?'} hideRing />
          </div>
          <span
            className="absolute -bottom-0.5 -right-0.5 h-[20px] w-[20px] rounded-full ring-2 ring-white shadow-sm flex items-center justify-center"
            style={{ background: AMBER }}
          >
            <Flag size={11} strokeWidth={2.5} color="#FFFFFF" />
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[14px] leading-[1.35]" style={{ color: INK }}>
            <span className="font-semibold">{actorName}</span>{' '}
            <span style={{ color: INK_SOFT }} className="font-normal">wants to connect</span>
          </p>
          <p className="text-[11.5px] mt-0.5 truncate" style={{ color: INK_SUBTLE }}>
            {username ? `@${username}` : null}
            {username && mutual ? ' · ' : ''}
            {mutual ? `${mutual} mutual` : null}
          </p>
        </div>

        <span className="shrink-0 text-[11px] font-medium tabular-nums self-start" style={{ color: INK_SUBTLE }}>
          {notification.time_ago}
        </span>
      </div>

      <div className="mt-3" onClick={(e) => e.stopPropagation()}>
        {resolved ? (
          <p className="text-[12.5px] font-semibold" style={{ color: state === 'accepted' ? '#16A34A' : INK_SUBTLE }}>
            {resolvedText}
          </p>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleAccept}
              disabled={state === 'loading'}
              className="flex-1 active:scale-[0.97] transition-transform disabled:opacity-60"
              style={{
                padding: '9px 16px', borderRadius: 12,
                background: INK, color: '#FFFFFF',
                fontSize: 13, fontWeight: 700, border: 'none',
              }}
            >
              {state === 'loading' ? '…' : 'Accept'}
            </button>
            <button
              onClick={handleDecline}
              disabled={state === 'loading'}
              className="flex-1 active:scale-[0.97] transition-transform disabled:opacity-60"
              style={{
                padding: '9px 16px', borderRadius: 12,
                background: 'transparent', color: INK_SOFT,
                fontSize: 13, fontWeight: 600,
                border: `1px solid ${BORDER}`,
              }}
            >
              Decline
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
