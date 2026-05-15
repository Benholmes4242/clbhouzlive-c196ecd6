import React from 'react';
import { firstName } from '@/lib/whs/utils/initials';
import { fmtRelative, reformatFriendName } from '@/lib/whs/utils/nameFormat';
import { fmtDiff } from '@/lib/whs/format';
import type { WhsFriendActivityWithImage } from '@/lib/whs/types';
import { SmallCardShell } from './SmallCardShell';
import { MiniMedia } from './MiniMedia';
import { MiniGlass } from './MiniGlass';

interface Props {
  activity: WhsFriendActivityWithImage;
  onClick: () => void;
  onInviteClick?: () => void;
}

const T = {
  ink: '#0F172A',
  ink60: 'rgba(15,23,42,0.60)',
  ink45: 'rgba(15,23,42,0.45)',
  amber: '#F7931E',
  amberDeep: '#C97211',
};

/**
 * EG-only friend card — media-leading.
 * Used for `is_clbhouz_user === false`.
 */
export const EgOnlyCard: React.FC<Props> = ({ activity, onClick, onInviteClick }) => {
  const diffStr =
    activity.last_round_differential === null || activity.last_round_differential === undefined
      ? null
      : fmtDiff(activity.last_round_differential, { plus: true });

  const courseName = activity.last_round_course_name ?? 'Course unknown';
  const displayName = reformatFriendName(activity.friend_name);

  return (
    <SmallCardShell
      onClick={onClick}
      ariaLabel={`Open ${firstName(activity.friend_name)}'s round at ${courseName}`}
    >
      <MiniMedia
        thumbnailUrl={activity.course_thumbnail_image}
        altText={courseName}
      >
        <MiniGlass gross={activity.last_round_adjusted_gross} diffStr={diffStr} />
      </MiniMedia>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: T.amber,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            ENGLAND GOLF
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: T.ink,
              letterSpacing: '-0.015em',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {displayName}
          </div>
          <div
            style={{
              marginTop: 2,
              fontSize: 11,
              fontWeight: 500,
              color: T.ink60,
              lineHeight: 1.3,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {courseName}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: T.ink45,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {fmtRelative(activity.last_round_played_at, { compact: false })}
          </span>

          {onInviteClick && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onInviteClick();
              }}
              aria-label={`Invite ${firstName(activity.friend_name)} to Clbhouz`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '5px 11px',
                borderRadius: 999,
                background: 'rgba(247,147,30,0.10)',
                border: '0.5px solid rgba(247,147,30,0.30)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: T.amberDeep,
                cursor: 'pointer',
                fontFamily: 'inherit',
                flexShrink: 0,
              }}
            >
              INVITE
              <span style={{ fontSize: 11, opacity: 0.7 }}>{'\u203A'}</span>
            </button>
          )}
        </div>
      </div>
    </SmallCardShell>
  );
};

export default EgOnlyCard;
