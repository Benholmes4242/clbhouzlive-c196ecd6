import React from 'react';
import { Send } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { callCreateInvite } from '@/lib/whs/api';
import { shareInvite } from '@/lib/whs/share';
import { firstName, initials } from '@/lib/whs/utils/initials';
import { whsKeys } from '@/lib/whs/hooks';
import type { WhsFriendMatch } from '@/lib/whs/types';

interface Props {
  friend: WhsFriendMatch;
}

const HAIRLINE = '1px solid rgba(15,23,42,0.08)';
const INK = '#0F172A';
const INK_MUTE = 'rgba(15,23,42,0.55)';
const AMBER = '#F7931E';

export const InviteRow: React.FC<Props> = ({ friend }) => {
  const queryClient = useQueryClient();

  const handleInvite = async () => {
    const res = await callCreateInvite(friend.friend_passport_id, 'copy_link');
    if (!res.ok || !res.share_url) {
      toast.error(res.message ?? `Couldn't create invite`);
      return;
    }
    queryClient.invalidateQueries({ queryKey: whsKeys.sentInvites() });
    await shareInvite({
      share_url: res.share_url,
      share_message: res.share_message ?? '',
      invitee_name: res.invitee_name ?? friend.friend_name,
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 20px',
        borderTop: HAIRLINE,
        background: '#FFFFFF',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          overflow: 'hidden',
          background: 'rgba(15,23,42,0.06)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {friend.friend_thumbnail_url ? (
          <img
            src={friend.friend_thumbnail_url}
            alt={friend.friend_name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: '#64748B',
            }}
          >
            {initials(friend.friend_name)}
          </span>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 700,
            color: INK,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {firstName(friend.friend_name)}
        </p>
        <p
          style={{
            margin: '1px 0 0',
            fontSize: 11,
            color: INK_MUTE,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {friend.friend_home_club ?? '—'}
          {friend.friend_handicap_index != null && (
            <>
              {' · '}
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                {friend.friend_handicap_index.toFixed(1)}
              </span>
            </>
          )}
        </p>
      </div>

      <button
        onClick={handleInvite}
        aria-label={`Invite ${firstName(friend.friend_name)} to clbhouz`}
        style={{
          padding: '7px 14px',
          borderRadius: 999,
          background: AMBER,
          color: '#fff',
          fontSize: 12,
          fontWeight: 800,
          border: 'none',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          letterSpacing: '0.02em',
          flexShrink: 0,
        }}
      >
        <Send size={12} />
        Invite
      </button>
    </div>
  );
};

export default InviteRow;
