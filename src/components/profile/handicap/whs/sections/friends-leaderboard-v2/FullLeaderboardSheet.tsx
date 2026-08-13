import React, { useState } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SheetHeader } from '@/components/ui/SheetHeader';
import { ChevronDown } from 'lucide-react';
import LeaderboardRow from './LeaderboardRow';
import { buildLeaderboardCohorts } from '@/lib/whs/utils/buildLeaderboardCohorts';
import { useFriendLeaderboardRankDeltas } from '@/lib/whs/hooks';
import type { FriendLeaderboardEntry } from '@/lib/whs/types';

interface FullLeaderboardSheetProps {
  open: boolean;
  onClose: () => void;
  cohorts: ReturnType<typeof buildLeaderboardCohorts>;
  deltasData: ReturnType<typeof useFriendLeaderboardRankDeltas>['data'];
  onRowClick: (entry: FriendLeaderboardEntry) => void;
  viewMode?: 'owner' | 'friend';
  ownerFirstName?: string | null;
}

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
// Hardcoded dark tokens — BottomSheet portals outside .hcp-dark scope.
const DIM = 'rgba(242,244,247,0.55)';
const LABEL_STYLE: React.CSSProperties = {
  fontSize: 7.5,
  fontWeight: 700,
  letterSpacing: '0.16em',
  color: DIM,
  textTransform: 'uppercase',
  margin: 0,
};


export const FullLeaderboardSheet: React.FC<FullLeaderboardSheetProps> = ({
  open,
  onClose,
  cohorts,
  deltasData,
  onRowClick,
  viewMode = 'owner',
  ownerFirstName = null,
}) => {
  const [showInactive, setShowInactive] = useState(false);
  const isFriend = viewMode === 'friend';
  const possessive = ownerFirstName ? `${ownerFirstName}'s` : 'Their';

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabelledBy="full-leaderboard-title"
      variant="dark"
      surfaceColor="#15171F"
      style={{
        maxHeight: '95dvh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <SheetHeader
        dark
        eyebrow="LEADERBOARD"
        title={<span id="full-leaderboard-title">{isFriend ? `${possessive} circle` : 'Your circle'}</span>}
        sub={
          <span>
            {cohorts.totalActive} active
            {cohorts.totalInactive > 0 ? `, ${cohorts.totalInactive} inactive` : ''}
          </span>
        }
        onClose={onClose}
      />

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
          fontFamily: FONT,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 11,
            padding: '12px 16px 4px',
          }}
        >
          <p style={{ ...LABEL_STYLE, flex: 1 }}>ALL ACTIVE · {cohorts.totalActive}</p>
          <p style={{ ...LABEL_STYLE, width: 26, textAlign: 'right' }}>30D</p>
          <div style={{ width: 42 }} />
        </div>

        {/* 16px horizontal padding matches the row's negative margin, so the
            self row's wash reaches both sheet edges. */}
        <div style={{ padding: '0 16px' }}>
          {cohorts.active.map((entry, idx) => {
            const rank = idx + 1;
            const delta = entry.friend_row_id
              ? deltasData?.byFriendRowId.get(entry.friend_row_id)
              : undefined;
            return (
              <LeaderboardRow
                key={entry.is_self ? 'self' : `${entry.friend_user_id ?? ''}-${entry.friend_name}`}
                entry={entry}
                rank={rank}
                isStaleRow={false}
                rankDelta={delta}
                onClick={entry.is_self ? undefined : () => onRowClick(entry)}
              />
            );
          })}

          {cohorts.totalInactive > 0 && showInactive && (
            <>
              <div style={{ padding: '16px 0 4px' }}>
                <p style={LABEL_STYLE}>INACTIVE · {cohorts.totalInactive}</p>
              </div>
              {cohorts.inactive.map((entry) => {
                const delta = entry.friend_row_id
                  ? deltasData?.byFriendRowId.get(entry.friend_row_id)
                  : undefined;
                return (
                  <LeaderboardRow
                    key={`inactive-${entry.friend_user_id ?? ''}-${entry.friend_name}`}
                    entry={entry}
                    rank={null}
                    isStaleRow={true}
                    rankDelta={delta}
                    onClick={() => onRowClick(entry)}
                  />
                );
              })}
            </>
          )}
        </div>

        {cohorts.totalInactive > 0 && !showInactive && (
          <button
            type="button"
            onClick={() => setShowInactive(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              margin: '12px 16px 16px',
              padding: 0,
              background: 'transparent',
              border: 'none',
              color: DIM,
              fontSize: 7.5,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontFamily: FONT,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '-0.03em',
                color: 'rgba(242,244,247,0.96)',
                fontVariantNumeric: 'tabular-nums lining-nums',
              }}
            >
              {cohorts.totalInactive}
            </span>
            Inactive
            <ChevronDown size={12} strokeWidth={2} />
          </button>
        )}

      </div>
    </BottomSheet>
  );
};

export default FullLeaderboardSheet;
