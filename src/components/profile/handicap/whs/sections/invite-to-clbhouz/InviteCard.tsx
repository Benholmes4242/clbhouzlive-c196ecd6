import React from 'react';
import { Send } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { callCreateInvite } from '@/lib/whs/api';
import { shareInvite } from '@/lib/whs/share';
import { firstName } from '@/lib/whs/utils/initials';
import { whsKeys } from '@/lib/whs/hooks';
import type { FriendLeaderboardEntry } from '@/lib/whs/types';
import { fmtHcp } from '@/lib/whs/format';

interface Props {
  friend: FriendLeaderboardEntry;
}

const INK = 'var(--hcp-t-100)';
const INK_MUTE = 'var(--hcp-t-60)';
const INK_06 = 'var(--hcp-bg-3)';
const HAIRLINE = 'var(--hcp-line-2)';
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
        background: 'var(--hcp-bg-1)',
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 12,
        fontFamily: FONT_GEIST,
        minWidth: 0,
      }}
    >
      {/* Top row: avatar + name + HCP */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <div
          role="img"
          aria-label={friend.friend_name}
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            overflow: 'hidden',
            background: friend.friend_thumbnail_url
              ? INK_06
              : 'linear-gradient(135deg, #1a3c2a 0%, #0f172a 100%)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'flex-end',
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
            <svg
              viewBox="0 0 64 64"
              width="100%"
              height="100%"
              preserveAspectRatio="xMidYMax meet"
              style={{ opacity: 0.56, display: 'block' }}
              aria-hidden="true"
            >
              <circle cx="32" cy="25" r="11" fill="#ffffff" />
              <path d="M11 64 C 11 48, 21 40, 32 40 C 43 40, 53 48, 53 64 Z" fill="#ffffff" />
            </svg>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: 'var(--hcp-t-100)',
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
                fontSize: 9,
                fontWeight: 800,
                color: INK_MUTE,
                letterSpacing: '0.14em',
              }}
            >
              HCP
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--hcp-t-100)',
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
            fontSize: 11,
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
          background: 'rgba(247,147,30,0.08)',
          color: '#C97211',
          fontSize: 12,
          fontWeight: 800,
          border: '1px solid rgba(247,147,30,0.20)',
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
