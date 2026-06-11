import React from 'react';
import { format } from 'date-fns';
import { BadgeCheck } from 'lucide-react';
import { initials, firstName } from '@/lib/whs/utils/initials';
import { pickAvatarSrc } from '@/lib/whs/utils/avatarSrc';
import { reformatFriendName } from '@/lib/whs/utils/nameFormat';
import type { WhsFriendActivityWithImage } from '@/lib/whs/types';

const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';



/** Shared between both variants. Returns e.g. "SUNDAY, 3 MAY". */
function formatRoundDate(iso: string): string {
  const d = new Date(iso);
  const ageMs = Date.now() - d.getTime();
  const olderThan9mo = ageMs > 9 * 30 * 86_400_000;
  return format(d, olderThan9mo ? 'EEEE, d MMM yyyy' : 'EEEE, d MMM').toUpperCase();
}

const eyebrowLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: '#FFFFFF',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
};

const eyebrowDateStyle: React.CSSProperties = {
  marginTop: 5,
  fontSize: 12,
  fontWeight: 600,
  color: 'rgba(255,255,255,0.85)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  textShadow: '0 1px 2px rgba(0,0,0,0.4)',
};

export const UserEyebrow: React.FC<{ playDate: string }> = ({ playDate }) => (
  <div style={{ fontFamily: FONT_GEIST }}>
    <div style={eyebrowLabelStyle}>ROUND DETAIL</div>
    <div style={eyebrowDateStyle}>{formatRoundDate(playDate)}</div>
  </div>
);

export const FriendEyebrow: React.FC<{ activity: WhsFriendActivityWithImage }> = ({ activity }) => {
  const name = reformatFriendName(activity.friend_name);
  const display = firstName(name);
  const dateLabel = activity.last_round_played_at
    ? formatRoundDate(activity.last_round_played_at)
    : '';
  return (
    <div style={{ fontFamily: FONT_GEIST, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '34%',
          overflow: 'hidden',
          border: '0.5px solid rgba(255,255,255,0.25)',
          background: 'linear-gradient(135deg,#5b8def,#3b6acc)',
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
              alt={name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ fontSize: 11, fontWeight: 800, color: '#FFFFFF' }}>
              {initials(name)}
            </span>
          );
        })()}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={eyebrowLabelStyle}>
            {display.toUpperCase()}'S ROUND
          </span>
          {activity.is_clbhouz_user && (
            <BadgeCheck size={11} strokeWidth={2.5} color="#FFFFFF" fill="#16A34A" />
          )}
        </div>
        {dateLabel && <div style={eyebrowDateStyle}>{dateLabel}</div>}
      </div>
    </div>
  );
};
