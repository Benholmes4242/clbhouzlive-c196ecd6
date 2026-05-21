import React from 'react';
import { reformatFriendName } from '@/lib/whs/utils/nameFormat';
import { initials } from '@/lib/whs/utils/initials';
import { fmtHcp } from '@/lib/whs/format';
import type { FriendRivalryHydrated } from '@/lib/whs/types';
import { useOpenFriendHybridSheet } from '@/components/friend-hybrid-sheet/FriendHybridSheetProvider';

const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

interface Props {
  rivalry: FriendRivalryHydrated;
}

export const RivalryEmptyCard: React.FC<Props> = ({ rivalry }) => {
  const { open: openHybridSheet } = useOpenFriendHybridSheet();
  const rivalDisplayName = reformatFriendName(rivalry.rival_name ?? 'Unknown');

  const handleInvite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (rivalry.rival_user_id) {
      openHybridSheet({
        targetUserId: rivalry.rival_user_id,
        source: 'rivalries_section',
      });
    }
    // EG-only rivals: no in-app surface yet (see brief open question 1)
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        border: '1px dashed rgba(247,147,30,0.30)',
        borderRadius: 14,
        padding: '14px 16px 16px',
        background: 'rgba(247,147,30,0.04)',
        fontFamily: FONT_GEIST,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: rivalry.rival_thumbnail_url
              ? `url(${rivalry.rival_thumbnail_url}) center/cover no-repeat`
              : 'rgba(255,255,255,0.08)',
            filter: 'grayscale(60%)',
            opacity: 0.7,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--hcp-t-60)',
            fontSize: 13,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {!rivalry.rival_thumbnail_url && initials(rivalDisplayName)}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: '0.14em',
              color: '#F7931E',
              marginBottom: 2,
            }}
          >
            NEW
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--hcp-t-100)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {rivalDisplayName}
          </div>
          <div style={{ fontSize: 11, color: 'var(--hcp-t-60)', marginTop: 1 }}>
            Hcp {fmtHcp(rivalry.rival_handicap)}
          </div>
        </div>
      </div>

      <p
        style={{
          margin: 0,
          fontSize: 12,
          lineHeight: 1.45,
          color: 'var(--hcp-t-70)',
        }}
      >
        No shared rounds yet. Play a round together to start tracking your head-to-head.
      </p>

      <button
        type="button"
        onClick={handleInvite}
        style={{
          alignSelf: 'flex-start',
          padding: '7px 14px',
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.14em',
          color: '#0F172A',
          background: '#F7931E',
          border: 'none',
          borderRadius: 999,
          cursor: 'pointer',
        }}
      >
        INVITE TO PLAY ›
      </button>
    </div>
  );
};

export default RivalryEmptyCard;
