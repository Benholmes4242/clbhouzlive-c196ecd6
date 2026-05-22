import React, { useState } from 'react';
import { Eye, TrendingUp, Trophy, Send, type LucideIcon } from 'lucide-react';
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
const AMBER = '#F7931E';
const AMBER_INK = '#9A6116';

interface Props {
  activity: WhsFriendActivityWithImage;
}

const UNLOCK_ROWS: { icon: LucideIcon; label: string }[] = [
  { icon: Eye, label: 'Hole-by-hole scorecard' },
  { icon: TrendingUp, label: 'Head-to-head record' },
  { icon: Trophy, label: 'Shared achievements' },
];

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
    <div style={{ padding: '28px 20px 24px', fontFamily: FONT_GEIST }}>
      <h3
        style={{
          margin: '0 0 6px',
          fontSize: 18,
          fontWeight: 800,
          color: INK,
          letterSpacing: '-0.01em',
          fontFamily: FONT_GEIST,
        }}
      >
        Unlock the full round
      </h3>
      <p
        style={{
          margin: '0 0 20px',
          fontSize: 13,
          color: INK_MUTE,
          lineHeight: 1.5,
        }}
      >
        When {fname} joins clbhouz, you'll see hole-by-hole, your head-to-head, and shared achievements.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {UNLOCK_ROWS.map((row) => (
          <UnlockRow key={row.label} icon={row.icon} label={row.label} />
        ))}
      </div>

      {pendingInvite ? (
        <>
          <button
            onClick={handleInvite}
            disabled={sending}
            style={{
              width: '100%',
              padding: '13px 24px',
              borderRadius: 999,
              background: 'transparent',
              border: `1px solid ${AMBER}`,
              color: AMBER_INK,
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '0.02em',
              cursor: sending ? 'default' : 'pointer',
              opacity: sending ? 0.7 : 1,
              fontFamily: FONT_GEIST,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Send size={15} strokeWidth={2.2} />
            {sending ? 'Preparing\u2026' : `Resend invite to ${fname}`}
          </button>
          <p
            style={{
              margin: '10px 0 0',
              fontSize: 11,
              color: 'var(--hcp-t-40)',
              textAlign: 'center',
            }}
          >
            Originally sent {fmtRelative(pendingInvite.sent_at, { compact: false })}
          </p>
        </>
      ) : (
        <button
          onClick={handleInvite}
          disabled={sending}
          style={{
            width: '100%',
            padding: '13px 24px',
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
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Send size={15} strokeWidth={2.2} />
          {sending ? 'Preparing\u2026' : `Invite ${fname}`}
        </button>
      )}
    </div>
  );
};

const UnlockRow: React.FC<{ icon: LucideIcon; label: string }> = ({ icon: Icon, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        background: 'rgba(247,147,30,0.10)',
        border: '1px solid rgba(247,147,30,0.18)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon size={15} color="#C97211" strokeWidth={2.2} />
    </div>
    <div
      style={{
        fontSize: 14,
        fontWeight: 600,
        color: INK,
        fontFamily: FONT_GEIST,
      }}
    >
      {label}
    </div>
  </div>
);

export default NonClbhouzFriendBody;
