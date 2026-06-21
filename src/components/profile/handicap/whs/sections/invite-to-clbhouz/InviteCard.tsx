import React from 'react';
import { Send } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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

const INK = 'var(--hcp-t-100)';
const INK_MUTE = 'var(--hcp-t-60)';
const HAIRLINE = 'var(--hcp-line-2)';

const FONT_GEIST = '"Geist", system-ui, -apple-system, BlinkMacSystemFont, sans-serif';


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
        background: 'var(--hcp-bg-1)',
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 14,
        padding: '10px 12px',
        fontFamily: FONT_GEIST,
      }}
    >
      {(() => {
        const avatarSrc = pickAvatarSrc(friend.friend_thumbnail_url, friend.friend_profile_photo_url);
        return avatarSrc ? (
          <div
            style={{
              width: 42, height: 42, borderRadius: 12, overflow: 'hidden',
              background: 'var(--hcp-bg-2)', flexShrink: 0,
            }}
          >
            <img src={avatarSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        ) : (
          <div
            style={{
              width: 42, height: 42, borderRadius: 12, flexShrink: 0,
              background: getAvatarFallbackColor(friend.friend_user_id ?? friend.friend_row_id ?? friend.friend_name),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 15, fontWeight: 800,
            }}
          >
            {getInitialsFromName(friend.friend_name) || '?'}
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
          width: 40, height: 40, borderRadius: 11, border: 'none',
          background: 'linear-gradient(135deg, #F7931E, #FBBC2E)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <Send size={16} color="#1A0F02" strokeWidth={2.2} />
      </button>
    </div>
  );
};

export default InviteCard;
