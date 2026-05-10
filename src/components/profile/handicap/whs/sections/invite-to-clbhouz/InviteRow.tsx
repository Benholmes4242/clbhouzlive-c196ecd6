import React from 'react';
import { Send } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { callCreateInvite } from '@/lib/whs/api';
import { shareInvite } from '@/lib/whs/share';
import { firstName, initials } from '@/lib/whs/utils/initials';
import { whsKeys } from '@/lib/whs/hooks';
import type { FriendLeaderboardEntry } from '@/lib/whs/types';
import { fmtHcp } from '@/lib/whs/format';

interface Props {
  friend: FriendLeaderboardEntry;
  /** The maximum rounds_last_30d across the section's visible list — used to scale the activity bar's fill. */
  maxRounds: number;
}

const HAIRLINE = '1px solid rgba(15,23,42,0.08)';
const INK = '#0F172A';
const INK_MUTE = 'rgba(15,23,42,0.55)';
const AMBER = '#F7931E';

export const InviteRow: React.FC<Props> = ({ friend, maxRounds }) => {
  const queryClient = useQueryClient();

  const handleInvite = async () => {
    if (friend.friend_passport_id == null) {
      toast.error('Cannot invite this friend (missing ID)');
      return;
    }
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

  const fillPct = friend.rounds_last_30d > 0 && maxRounds > 0
    ? (friend.rounds_last_30d / maxRounds) * 100
    : 0;

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
          <span style={{ fontSize: 10, fontWeight: 800, color: '#64748B' }}>
            {initials(friend.friend_name)}
          </span>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 700,
            color: INK,
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {firstName(friend.friend_name)}
        </div>
        <div
          style={{
            fontSize: 10.5,
            color: INK_MUTE,
            marginTop: 1,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          HCP {fmtHcp(friend.friend_handicap_index)}
          {friend.friend_home_club && ` · ${friend.friend_home_club}`}
        </div>
        {/* Activity bar */}
        <div
          style={{
            marginTop: 5,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <div
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: 'rgba(15,23,42,0.06)',
              overflow: 'hidden',
            }}
          >
            {fillPct > 0 && (
              <div
                style={{
                  width: `${fillPct}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${AMBER}, #C97211)`,
                  borderRadius: 2,
                }}
              />
            )}
          </div>
          <span
            style={{
              fontSize: 10,
              color: INK_MUTE,
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              flexShrink: 0,
            }}
          >
            {friend.rounds_last_30d} {friend.rounds_last_30d === 1 ? 'round' : 'rounds'} · 30d
          </span>
        </div>
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
