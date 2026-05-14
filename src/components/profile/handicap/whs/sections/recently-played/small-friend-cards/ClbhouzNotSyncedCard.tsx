import React from 'react';
import { firstName } from '@/lib/whs/utils/initials';
import { reformatFriendName } from '@/lib/whs/utils/nameFormat';
import type { WhsFriendActivityWithImage } from '@/lib/whs/types';
import { SmallCardShell } from './SmallCardShell';
import { IdentityPanel } from './IdentityPanel';

interface Props {
  activity: WhsFriendActivityWithImage;
  onClick: () => void;
  onInviteClick?: () => void;
}

const T = {
  ink: '#0F172A',
  ink60: 'rgba(15,23,42,0.60)',
  green: '#006747',
};

/**
 * Clbhouz-not-synced friend card — identity-leading.
 * Used for `is_clbhouz_user === true && friend_connection_id === null`.
 */
export const ClbhouzNotSyncedCard: React.FC<Props> = ({ activity, onClick, onInviteClick }) => {
  const displayName = reformatFriendName(activity.friend_name);
  const first = firstName(activity.friend_name);

  return (
    <SmallCardShell
      onClick={onClick}
      ariaLabel={`Open ${first}'s profile`}
    >
      <IdentityPanel name={displayName} thumbnailUrl={activity.friend_thumbnail_url} />

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
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 9,
              fontWeight: 700,
              color: T.green,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            <span
              aria-hidden
              style={{
                display: 'inline-block',
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: T.green,
              }}
            />
            ON CLBHOUZ
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
            {first}
          </div>
          <div
            style={{
              marginTop: 2,
              fontSize: 11,
              fontWeight: 500,
              color: T.ink60,
              lineHeight: 1.35,
            }}
          >
            Hasn't synced WHS yet
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          {onInviteClick && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onInviteClick();
              }}
              aria-label={`Ask ${first} to sync their handicap`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '5px 11px',
                borderRadius: 999,
                background: 'rgba(0,103,71,0.08)',
                border: '0.5px solid rgba(0,103,71,0.25)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: T.green,
                cursor: 'pointer',
                fontFamily: 'inherit',
                flexShrink: 0,
              }}
            >
              ASK TO SYNC
              <span style={{ fontSize: 11, opacity: 0.7 }}>{'\u203A'}</span>
            </button>
          )}
        </div>
      </div>
    </SmallCardShell>
  );
};

export default ClbhouzNotSyncedCard;
