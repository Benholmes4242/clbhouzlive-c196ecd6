import React from 'react';
import { initials, displayName } from '@/lib/whs/utils/initials';
import { pickAvatarSrc } from '@/lib/whs/utils/avatarSrc';
import { fmtRelative } from '@/lib/whs/utils/nameFormat';
import type { WhsFriendActivityWithImage } from '@/lib/whs/types';

const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

interface Props {
  activity: WhsFriendActivityWithImage;
  showLowestRound?: boolean;
}

export const CinemaFriendEyebrow: React.FC<Props> = ({ activity, showLowestRound }) => {
  const time = fmtRelative(activity.last_round_played_at, { compact: false });

  return (
    <div
      style={{
        position: 'absolute',
        top: 10,
        left: 11,
        right: 11,
        zIndex: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        fontFamily: FONT_GEIST,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: '34%',
            overflow: 'hidden',
            background: 'rgba(15,23,42,0.06)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {(() => {
            const src = pickAvatarSrc(activity.friend_thumbnail_url, activity.friend_profile_photo_url);
            return src ? (
              <img
                src={src}
                alt={activity.friend_name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ fontSize: 10, fontWeight: 800, color: '#FFFFFF' }}>
                {initials(activity.friend_name)}
              </span>
            );
          })()}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, gap: 1 }}>
          <p
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '-0.015em',
              lineHeight: 1.15,
              textShadow: '0 1px 3px rgba(0,0,0,0.4)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {displayName(activity.friend_name)}
          </p>
          {time && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.65)',
                letterSpacing: '0.02em',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                whiteSpace: 'nowrap',
                lineHeight: 1.1,
              }}
            >
              {time}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        {showLowestRound && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 9px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              background: 'rgba(247,147,30,0.20)',
              border: '0.5px solid rgba(247,147,30,0.55)',
              color: '#FDBA74',
              flexShrink: 0,
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}
          >
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.10em' }}>★</span>
            Lowest Round
          </span>
        )}
      </div>
    </div>
  );
};

export default CinemaFriendEyebrow;
