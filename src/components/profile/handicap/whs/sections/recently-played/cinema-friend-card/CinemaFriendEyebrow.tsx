import React from 'react';
import { ArrowDown, ArrowUp, BadgeCheck } from 'lucide-react';
import { initials, firstName } from '@/lib/whs/utils/initials';
import { fmtRelative } from '@/lib/whs/utils/nameFormat';
import type { WhsFriendActivityWithImage } from '@/lib/whs/types';

const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

interface Props {
  activity: WhsFriendActivityWithImage;
}

export const CinemaFriendEyebrow: React.FC<Props> = ({ activity }) => {
  const impactDelta =
    activity.is_counter &&
    activity.handicap_index_at_time !== null &&
    activity.friend_handicap_index !== null
      ? activity.friend_handicap_index - activity.handicap_index_at_time
      : null;
  const showImpact = impactDelta !== null && Math.abs(impactDelta) >= 0.05;
  const impactIsImprovement = (impactDelta ?? 0) < 0;

  const time = fmtRelative(activity.last_round_played_at, { compact: false });

  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        left: 14,
        right: 14,
        zIndex: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        fontFamily: FONT_GEIST,
      }}
    >
      {/* Left cluster */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '34%',
            overflow: 'hidden',
            border: '0.5px solid rgba(255,255,255,0.25)',
            background: 'rgba(15,23,42,0.06)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {activity.friend_thumbnail_url ? (
            <img
              src={activity.friend_thumbnail_url}
              alt={activity.friend_name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ fontSize: 10, fontWeight: 800, color: '#FFFFFF' }}>
              {initials(activity.friend_name)}
            </span>
          )}
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: '-0.015em',
            lineHeight: 1.1,
            textShadow: '0 1px 3px rgba(0,0,0,0.4)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minWidth: 0,
          }}
        >
          {firstName(activity.friend_name)}
        </p>
        <span
          aria-label="Verified Clbhouz user"
          style={{ display: 'inline-flex', flexShrink: 0 }}
        >
          <BadgeCheck size={13} strokeWidth={2.5} color="#FFFFFF" fill="#16A34A" />
        </span>
        {time && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.65)',
              letterSpacing: '0.02em',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            · {time}
          </span>
        )}
      </div>

      {/* Right cluster */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {showImpact && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 9px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              background: impactIsImprovement
                ? 'rgba(34,197,94,0.18)'
                : 'rgba(239,68,68,0.18)',
              border: impactIsImprovement
                ? '0.5px solid rgba(34,197,94,0.5)'
                : '0.5px solid rgba(239,68,68,0.5)',
              color: impactIsImprovement ? '#86EFAC' : '#FCA5A5',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em' }}>HCP</span>
            {impactIsImprovement ? (
              <ArrowDown size={10} strokeWidth={1.6} />
            ) : (
              <ArrowUp size={10} strokeWidth={1.6} />
            )}
            {Math.abs(impactDelta!).toFixed(1)}
          </span>
        )}
      </div>
    </div>
  );
};

export default CinemaFriendEyebrow;
