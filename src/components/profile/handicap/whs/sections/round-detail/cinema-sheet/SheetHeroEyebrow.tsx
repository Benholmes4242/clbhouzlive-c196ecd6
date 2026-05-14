import React from 'react';
import { format } from 'date-fns';
import { BadgeCheck } from 'lucide-react';
import { initials, firstName } from '@/lib/whs/utils/initials';
import { reformatFriendName } from '@/lib/whs/utils/nameFormat';
import type { WhsFriendActivityWithImage } from '@/lib/whs/types';

const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

const AMBER = '#F7931E';

function formatRoundDate(iso: string): string {
  const d = new Date(iso);
  const ageMs = Date.now() - d.getTime();
  const olderThan9mo = ageMs > 9 * 30 * 86_400_000;
  return format(d, olderThan9mo ? 'EEEE, d MMM yyyy' : 'EEEE, d MMM').toUpperCase();
}

export const UserEyebrow: React.FC<{ playDate: string }> = ({ playDate }) => (
  <div style={{ fontFamily: FONT_GEIST }}>
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: AMBER,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
      }}
    >
      ROUND DETAIL
    </div>
    <div
      style={{
        marginTop: 5,
        fontSize: 12,
        fontWeight: 600,
        color: 'rgba(255,255,255,0.85)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        textShadow: '0 1px 2px rgba(0,0,0,0.4)',
      }}
    >
      {formatRoundDate(playDate)}
    </div>
  </div>
);

export const FriendEyebrow: React.FC<{ activity: WhsFriendActivityWithImage }> = ({ activity }) => {
  const name = reformatFriendName(activity.friend_name);
  const display = firstName(name);
  const dateLabel = activity.last_round_played_at
    ? format(new Date(activity.last_round_played_at), 'EEEE, d MMM')
    : '';
  return (
    <div style={{ fontFamily: FONT_GEIST, position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
          {activity.friend_thumbnail_url ? (
            <img
              src={activity.friend_thumbnail_url}
              alt={name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ fontSize: 11, fontWeight: 800, color: '#FFFFFF' }}>
              {initials(name)}
            </span>
          )}
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '-0.015em',
              lineHeight: 1.1,
              textShadow: '0 1px 3px rgba(0,0,0,0.4)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {display}
          </span>
          {activity.is_clbhouz_user && (
            <BadgeCheck size={13} strokeWidth={2.5} color="#FFFFFF" fill="#16A34A" />
          )}
        </div>
      </div>
      {dateLabel && (
        <div
          style={{
            marginTop: 8,
            paddingLeft: 42,
            fontSize: 12,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.65)',
            letterSpacing: '0.02em',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
          }}
        >
          {dateLabel}
        </div>
      )}
    </div>
  );
};
