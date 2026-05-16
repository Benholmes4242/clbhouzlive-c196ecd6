import React, { useState } from 'react';
import { Flag } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { callCreateInvite } from '@/lib/whs/api';
import { shareInvite, firstName } from '@/lib/whs/share';
import { useSentInvites, whsKeys } from '@/lib/whs/hooks';
import { fmtRelative } from '@/lib/whs/utils/nameFormat';
import type { WhsFriendActivityWithImage } from '@/lib/whs/types';

const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
const INK = 'var(--hcp-t-100)';
const INK_MUTE = 'var(--hcp-t-60)';
const AMBER_INK = '#9A6116';

interface Props {
  activity: WhsFriendActivityWithImage;
}

export const NonClbhouzFriendBody: React.FC<Props> = ({ activity }) => {
  const queryClient = useQueryClient();
  const { data: invites } = useSentInvites();
  const [sending, setSending] = useState(false);

  const pendingInvite = invites?.find(
    (i) =>
      i.invitee_passport_id === activity.friend_passport_id && i.status === 'pending',
  );

  const fname = firstName(activity.friend_name);

  const handleInvite = async () => {
    setSending(true);
    const res = await callCreateInvite(activity.friend_passport_id, 'copy_link');
    setSending(false);
    if (!res.ok || !res.share_url) {
      toast.error(res.message ?? `Couldn't create invite`);
      return;
    }
    queryClient.invalidateQueries({ queryKey: whsKeys.sentInvites() });
    await shareInvite({
      share_url: res.share_url,
      share_message: res.share_message ?? '',
      invitee_name: res.invitee_name ?? activity.friend_name,
    });
  };

  return (
    <div style={{ padding: '32px 20px 24px', textAlign: 'center', fontFamily: FONT_GEIST }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          margin: '0 auto 16px',
          background: 'rgba(247,147,30,0.10)',
          border: '1px solid rgba(247,147,30,0.20)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Flag size={28} color="#C97211" strokeWidth={2.2} />
      </div>
      <h3
        style={{
          margin: '0 0 8px',
          fontSize: 18,
          fontWeight: 800,
          color: 'var(--hcp-t-100)',
          fontFamily: FONT_GEIST,
        }}
      >
        See {fname}'s hole by hole
      </h3>
      <p
        style={{
          margin: '0 auto 20px',
          fontSize: 13,
          color: INK_MUTE,
          lineHeight: 1.5,
          maxWidth: 280,
        }}
      >
        Invite {fname} to clbhouz to unlock detailed round data, head-to-head comparisons, and shared achievements.
      </p>

      {pendingInvite ? (
        <>
          <button
            onClick={handleInvite}
            disabled={sending}
            style={{
              padding: '12px 24px',
              borderRadius: 999,
              background: 'var(--hcp-bg-1)',
              border: '1px solid #F7931E',
              color: AMBER_INK,
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '0.02em',
              cursor: sending ? 'default' : 'pointer',
              opacity: sending ? 0.7 : 1,
              fontFamily: FONT_GEIST,
            }}
          >
            {sending ? 'Preparing\u2026' : `Resend invite to ${fname}`}
          </button>
          <p style={{ margin: '10px 0 0', fontSize: 11, color: 'var(--hcp-t-40)' }}>
            Originally sent {fmtRelative(pendingInvite.sent_at, { compact: false })}
          </p>
        </>
      ) : (
        <button
          onClick={handleInvite}
          disabled={sending}
          style={{
            padding: '12px 24px',
            borderRadius: 999,
            background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
            border: 'none',
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '0.02em',
            boxShadow: '0 4px 12px rgba(247,147,30,0.30)',
            cursor: sending ? 'default' : 'pointer',
            opacity: sending ? 0.7 : 1,
            fontFamily: FONT_GEIST,
          }}
        >
          {sending ? 'Preparing\u2026' : `Invite ${fname}`}
        </button>
      )}
    </div>
  );
};

export default NonClbhouzFriendBody;
