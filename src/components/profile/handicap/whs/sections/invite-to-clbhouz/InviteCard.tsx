import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { callCreateInvite } from '@/lib/whs/api';
import { shareInvite } from '@/lib/whs/share';
import { firstName, displayName } from '@/lib/whs/utils/initials';
import { getInitialsFromName, getAvatarFallbackColor } from '@/lib/avatarFallback';
import { pickAvatarSrc } from '@/lib/whs/utils/avatarSrc';
import { fmtRelative } from '@/lib/whs/utils/nameFormat';
import { whsKeys } from '@/lib/whs/hooks';
import type { FriendLeaderboardEntry } from '@/lib/whs/types';
import { fmtHcp } from '@/lib/whs/format';

interface Props {
  friend: FriendLeaderboardEntry;
}

// Hardcoded dark tokens — sheet portals outside .hcp-dark scope.
const INK = '#F2F4F7';
const INK_MUTE = 'rgba(242,244,247,0.55)';
const HAIRLINE = 'rgba(255,255,255,0.08)';
const CARD_BG = '#1B1E27';
const CELL_BG = '#20242E';

const FONT_SF = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';


export const InviteCard: React.FC<Props> = ({ friend }) => {
  const queryClient = useQueryClient();
  const hcp = friend.friend_handicap_index;
  

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
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: CARD_BG,
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 14,
        padding: '10px 12px',
        fontFamily: FONT_SF,
      }}
    >
      {(() => {
        const avatarSrc = pickAvatarSrc(friend.friend_thumbnail_url, friend.friend_profile_photo_url);
        const inner = avatarSrc ? (
          <div
            style={{
              width: 42, height: 42, borderRadius: 12, overflow: 'hidden',
              background: CELL_BG,
            }}
          >
            <img src={avatarSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        ) : (
          <div
            style={{
              width: 42, height: 42, borderRadius: 12,
              background: getAvatarFallbackColor(friend.friend_user_id ?? friend.friend_row_id ?? friend.friend_name),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 15, fontWeight: 800,
            }}
          >
            {getInitialsFromName(friend.friend_name) || '?'}
          </div>
        );
        return (
          <div style={{ position: 'relative', width: 42, height: 42, flexShrink: 0 }}>
            {inner}
            {/* Traced hairline overlay -- dark surface canon */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.22)',
                pointerEvents: 'none',
              }}
            />
          </div>
        );
      })()}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {displayName(friend.friend_name)}{' '}
          <span style={{ fontSize: 12, fontWeight: 700, color: INK_MUTE, fontVariantNumeric: 'tabular-nums' }}>
            {fmtHcp(hcp)}
          </span>
        </div>
        {courseHint && (
          <div style={{ fontSize: 11, color: INK_MUTE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>
            {courseHint}
          </div>
        )}
      </div>

      <button
        onClick={handleInvite}
        aria-label={`Invite ${firstName(friend.friend_name)} to clbhouz`}
        style={{
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 2,
          padding: 0,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: FONT_SF,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.13em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.62)',
        }}
      >
        Invite
        <ChevronRight size={13} strokeWidth={2.6} />
      </button>
    </div>
  );
};

export default InviteCard;
