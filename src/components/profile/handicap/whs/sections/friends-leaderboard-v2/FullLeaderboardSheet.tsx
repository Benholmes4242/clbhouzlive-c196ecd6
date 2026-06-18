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

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const LABEL_STYLE: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: '0.16em',
  color: 'var(--hcp-t-60)',
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
      className="hcp-light"
      style={{
        background: 'var(--hcp-bg-0)',
        maxHeight: '90vh',
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
            padding: '12px 20px 8px',
          }}
        >
          <p style={{ ...LABEL_STYLE, flex: 1 }}>ALL ACTIVE · {cohorts.totalActive}</p>
          <p style={{ ...LABEL_STYLE, width: 32, textAlign: 'center' }}>7D</p>
          <div style={{ width: 56 }} />
        </div>

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

        {cohorts.totalInactive > 0 && (
          <>
            {showInactive ? (
              <>
                <div style={{ padding: '20px 20px 8px' }}>
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
            ) : (
              <button
                type="button"
                onClick={() => setShowInactive(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  width: 'calc(100% - 40px)',
                  margin: '12px 20px 16px',
                  padding: '10px 16px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--hcp-t-60)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: FONT,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                Show {cohorts.totalInactive} inactive friend
                {cohorts.totalInactive === 1 ? '' : 's'}
                <ChevronDown size={14} strokeWidth={2} />
              </button>
            )}
          </>
        )}
      </div>
    </BottomSheet>
  );
};

export default FullLeaderboardSheet;
