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
}

const INK = '#0F172A';
const INK_MUTE = 'rgba(15,23,42,0.55)';
const INK_06 = 'rgba(15,23,42,0.06)';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const AMBER = '#F7931E';
const FONT_GEIST = '"Geist", system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

export const InviteCard: React.FC<Props> = ({ friend }) => {
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

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: 12,
        background: '#FFFFFF',
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 12,
        fontFamily: FONT_GEIST,
        minWidth: 0,
      }}
    >
      {/* Top row: avatar + name + HCP */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            overflow: 'hidden',
            background: INK_06,
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
              display: 'flex',
              alignItems: 'baseline',
              gap: 4,
              marginTop: 1,
            }}
          >
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 800,
                color: INK_MUTE,
                letterSpacing: '0.04em',
              }}
            >
              HCP
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: INK,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {fmtHcp(friend.friend_handicap_index)}
            </span>
          </div>
        </div>
      </div>

      {/* Secondary line — home club, indented under the name */}
      {friend.friend_home_club && (
        <div
          style={{
            marginLeft: 46,
            marginTop: -4,
            fontSize: 10.5,
            color: INK_MUTE,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minWidth: 0,
          }}
        >
          {friend.friend_home_club}
        </div>
      )}

      {/* Invite button, full-width across the card bottom */}
      <button
        onClick={handleInvite}
        aria-label={`Invite ${firstName(friend.friend_name)} to clbhouz`}
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: 999,
          background: AMBER,
          color: '#fff',
          fontSize: 12,
          fontWeight: 800,
          border: 'none',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          letterSpacing: '0.02em',
          fontFamily: FONT_GEIST,
        }}
      >
        <Send size={12} />
        Invite
      </button>
    </div>
  );
};

export default InviteCard;
