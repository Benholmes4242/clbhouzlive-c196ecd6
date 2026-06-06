import React from 'react';
import { Send } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { callCreateInvite } from '@/lib/whs/api';
import { shareInvite } from '@/lib/whs/share';
import { firstName } from '@/lib/whs/utils/initials';
import { pickAvatarSrc } from '@/lib/whs/utils/avatarSrc';
import { fmtRelative } from '@/lib/whs/utils/nameFormat';
import { whsKeys } from '@/lib/whs/hooks';
import type { FriendLeaderboardEntry } from '@/lib/whs/types';
import { fmtHcp } from '@/lib/whs/format';

interface Props {
  friend: FriendLeaderboardEntry;
}

const INK = 'var(--hcp-t-100)';
const INK_MUTE = 'var(--hcp-t-60)';
const HAIRLINE = 'var(--hcp-line-2)';
const AMBER = '#F7931E';
const FONT_GEIST = '"Geist", system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

const MONO_COLORS = [
  '#5C7F4A',
  '#7A4A5C',
  '#4A6F8A',
  '#A87A4A',
  '#6F4A8A',
  '#4A8A5C',
  '#8A6F4A',
  '#5C4A8A',
];

function monogramColor(seed: number): string {
  return MONO_COLORS[Math.abs(seed) % MONO_COLORS.length];
}

function monogramLetter(name: string): string {
  const first = firstName(name);
  return first.charAt(0).toUpperCase() || '?';
}

export const InviteCard: React.FC<Props> = ({ friend }) => {
  const queryClient = useQueryClient();
  const hcp = friend.friend_handicap_index;
  const isPlusHandicap = hcp != null && hcp < 0;

  const courseHint =
    friend.last_round_course_name && friend.last_round_played_at
      ? `${friend.last_round_course_name} · ${fmtRelative(friend.last_round_played_at, { compact: true })}`
      : null;

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
        padding: 12,
        background: 'var(--hcp-bg-1)',
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* Top row: avatar + name + HCP */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        {(() => {
          const avatarSrc = pickAvatarSrc(friend.friend_thumbnail_url, friend.friend_profile_photo_url);
          return avatarSrc ? (
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                overflow: 'hidden',
                flexShrink: 0,
                background: 'var(--hcp-bg-2)',
              }}
            >
              <img
                src={avatarSrc}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          ) : null;
        })()}
        {!pickAvatarSrc(friend.friend_thumbnail_url, friend.friend_profile_photo_url) && (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              flexShrink: 0,
              background: monogramColor(friend.friend_passport_id ?? 0),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontFamily: FONT_GEIST,
              fontSize: 15,
              fontWeight: 800,
              lineHeight: 1,
            }}
          >
            {monogramLetter(friend.friend_name)}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0 }}>
            <div
              style={{
                fontFamily: FONT_GEIST,
                fontSize: 13.5,
                fontWeight: 800,
                color: INK,
                letterSpacing: '-0.01em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
            >
              {firstName(friend.friend_name)}
            </div>
            <div
              style={{
                fontFamily: FONT_GEIST,
                fontSize: 12,
                fontWeight: 800,
                color: isPlusHandicap ? '#4ADE80' : INK,
                fontVariantNumeric: 'tabular-nums',
                flexShrink: 0,
              }}
            >
              {fmtHcp(hcp)}
            </div>
          </div>
          {courseHint && (
            <div
              style={{
                marginTop: 2,
                fontFamily: FONT_GEIST,
                fontSize: 10,
                fontWeight: 600,
                color: INK_MUTE,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {courseHint}
            </div>
          )}
        </div>
      </div>

      {/* Invite button — tightened */}
      <button
        onClick={handleInvite}
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: 10,
          border: `1px solid ${HAIRLINE}`,
          background: 'transparent',
          color: INK,
          fontFamily: FONT_GEIST,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
        }}
      >
        <Send size={11} strokeWidth={2.2} color={INK_MUTE} />
        Invite
      </button>
    </div>
  );
};

export default InviteCard;
