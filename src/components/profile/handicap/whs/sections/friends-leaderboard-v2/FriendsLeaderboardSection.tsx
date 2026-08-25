import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { DarkSectionHeader } from '../_shared/darkAtoms';
import LeaderboardRow from './LeaderboardRow';
import StandingFigures from './StandingFigures';
import FullLeaderboardSheet from './FullLeaderboardSheet';
import WeeklyBanner from './WeeklyBanner';
import {
  useFriendLeaderboard,
  useFriendLeaderboardRankDeltas,
  useFriendLeaderboardWeeklyBanner,
} from '@/lib/whs/hooks';
import { useHandicapPercentile } from '@/lib/whs/usePercentile';
import { useMemberTapResolver } from '@/components/friend-sheet/useMemberTapResolver';
import { Skeleton } from '@/components/ui/skeleton';

import { buildLeaderboardCohorts } from '@/lib/whs/utils/buildLeaderboardCohorts';
import type { FriendLeaderboardEntry } from '@/lib/whs/types';

interface Props {
  userId: string;
  viewMode?: 'owner' | 'friend';
  ownerFirstName?: string | null;
}

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';


const LABEL_STYLE: React.CSSProperties = {
  margin: 0,
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--hcp-t-40)',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
};


export const FriendsLeaderboardSection: React.FC<Props> = ({ userId, viewMode = 'owner', ownerFirstName = null }) => {
  const { data, isLoading, isError, refetch } = useFriendLeaderboard(userId);
  const percentileQuery = useHandicapPercentile(userId);
  const { data: deltasData } = useFriendLeaderboardRankDeltas(userId, 30);
  const { data: weeklyBanner } = useFriendLeaderboardWeeklyBanner(userId);
  const { resolve } = useMemberTapResolver();
  const [showInactive, setShowInactive] = useState(false);
  const [fullLeaderboardOpen, setFullLeaderboardOpen] = useState(false);

  const cohorts = buildLeaderboardCohorts(data);
  const selfRow =
    cohorts.selfActiveIdx >= 0 ? cohorts.active[cohorts.selfActiveIdx] : null;
  // Keep hook call — may feed other surfaces; not used for subtitle anymore.
  void percentileQuery;

  // Friend-circle percentile: "Top X% of your circle"
  // Requires ≥5 active friends and user in top half of circle.
  const MIN_CIRCLE_SIZE = 5;

  const canShowCirclePercentile =
    cohorts.selfActiveRank != null &&
    cohorts.totalActive >= MIN_CIRCLE_SIZE &&
    cohorts.selfActiveRank <= Math.ceil(cohorts.totalActive / 2);

  const circlePercentile = canShowCirclePercentile
    ? Math.max(5, Math.min(95, Math.ceil((cohorts.selfActiveRank! / cohorts.totalActive) * 20) * 5))
    : null;

  const isFriend = viewMode === 'friend';
  const possessive = ownerFirstName ? `${ownerFirstName}'s` : 'Their';
  void possessive;

  /* THE HEADER STOPS REPEATING ITSELF. The old sentence ("You're top n% of
     your circle - a active, b inactive") restated every figure beneath it.
     The figures are the sentence, so there is no sub-line. */




  /**
   * NO INTERMEDIATE SHEET. The row resolves straight to compare, the nudge or
   * an invite; the friend sheet no longer appears on this path.
   */
  const handleRowClick = (entry: FriendLeaderboardEntry) => {
    if (entry.is_self) return;
    void resolve(
      entry.friend_user_id
        ? { targetUserId: entry.friend_user_id }
        : { whsOnlyEntry: entry },
    );
  };

  return (
    <section style={{ marginTop: 0 }}>
      <DarkSectionHeader
        eyebrow="LEADERBOARD"
        title={
          isFriend
            ? (ownerFirstName ? `${ownerFirstName} vs their circle` : 'Vs their circle')
            : 'You vs your circle'
        }
      />


      {isError && !isLoading && (
        <div
          style={{
            margin: '0 16px',
            background: 'var(--hcp-bg-1)',
            border: '1px solid var(--hcp-line-2)',
            borderRadius: 18,
            padding: '20px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            fontFamily: FONT,
          }}
        >
          <p style={{ margin: 0, fontSize: 13, color: 'var(--hcp-t-60)' }}>
            Couldn't load the leaderboard.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--hcp-line-2)',
              color: 'var(--hcp-t-100)',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: FONT,
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* THIS WEEK banner */}
      {!isLoading && !isError && (
        <WeeklyBanner
          banner={weeklyBanner ?? null}
          friends={cohorts.active.concat(cohorts.inactive)}
        />
      )}

      {/* ===== MERGED LEADERBOARD CARD ===== */}
      {!isError && (
      <div
        style={{
          margin: '0 16px',
          background: 'var(--hcp-bg-1)',
          border: '1px solid var(--hcp-line-2)',
          borderRadius: 18,
          overflow: 'hidden',
        }}
      >
        {/* Hero as header strip */}
        {isLoading ? (
          <Skeleton variant="dark" style={{ height: 120, width: '100%', borderRadius: 0 }} />
        ) : (
          /* Three figures: YOUR RANK / PERCENTILE / TO CATCH. The rank and
             its denominator come from the SAME cohort the rows below are
             numbered against - acceptance test 3. */
          <StandingFigures
            selfRow={selfRow}
            rowAbove={cohorts.rowAbove}
            rank={cohorts.selfActiveRank}
            totalActive={cohorts.totalActive}
            percentileTop={circlePercentile}
            viewMode={viewMode}
            ownerFirstName={ownerFirstName}
          />
        )}

        {/* Column labels. Widths match the row: 26 movement, 42 index. */}
        {!isLoading && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 11,
              padding: '12px 16px 4px',
              background: 'var(--hcp-bg-2)',
              borderTop: '1px solid var(--hcp-line-2)',
            }}
          >
            <p style={{ ...LABEL_STYLE, flex: 1, margin: 0 }}>Top of your circle</p>
            <p style={{ ...LABEL_STYLE, width: 26, textAlign: 'right', margin: 0 }}>30D</p>
            <div style={{ width: 42 }} />
          </div>
        )}

        {/* Rows — no rules, no borders. The self row's wash bleeds to the
            card edges via the row's matched negative margin. */}
        <div style={{ padding: '2px 16px 6px' }}>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton
                key={i}
                variant="dark"
                style={{ margin: '0 0 8px', height: 44, width: '100%', borderRadius: 8 }}
              />
            ))
          ) : (
            cohorts.topFive.map((entry) => {
              const activeIdx = cohorts.active.findIndex((e) => e === entry);
              const rank = activeIdx >= 0 ? activeIdx + 1 : null;
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
                  onClick={entry.is_self ? undefined : () => handleRowClick(entry)}
                />
              );
            })
          )}
        </div>

        {/* ONE footer row, ONE treatment: see-all left, inactive right. */}
        {!isLoading && cohorts.totalActive > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '10px 16px 12px',
              background: 'var(--hcp-bg-1)',
            }}
          >
            <button
              type="button"
              onClick={() => setFullLeaderboardOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: 0,
                background: 'transparent',
                border: 'none',
                color: 'var(--hcp-t-80)',
                fontFamily: FONT,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              See all {cohorts.totalActive} active
              <span style={{ fontSize: 11, color: 'var(--hcp-t-60)' }}>›</span>
            </button>

            {cohorts.totalInactive > 0 && (
              <button
                type="button"
                onClick={() => setShowInactive((v) => !v)}
                aria-expanded={showInactive}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: 0,
                  // 44px tap target without moving the label: the extra height is
                  // absorbed by equal negative margins.
                  minHeight: 44,
                  marginTop: -14,
                  marginBottom: -14,
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--hcp-t-60)',
                  fontFamily: FONT,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {!showInactive && (
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: '-0.03em',
                      color: 'var(--hcp-t-100)',
                      fontVariantNumeric: 'tabular-nums lining-nums',
                    }}
                  >
                    {cohorts.totalInactive}
                  </span>
                )}
                {showInactive ? 'Hide inactive' : 'Inactive'}
                <ChevronDown
                  size={12}
                  strokeWidth={2}
                  style={{
                    transform: showInactive ? 'rotate(180deg)' : 'none',
                    transition: 'transform 160ms ease',
                  }}
                />
              </button>
            )}
          </div>
        )}

      </div>
      )}
      {/* ===== END CARD ===== */}

      {/* Inactive list — opened from the footer control, no second sentence */}
      {!isLoading && !isError && showInactive && cohorts.totalInactive > 0 && (
        <div style={{ padding: '12px 16px 16px' }}>
          <p style={{ ...LABEL_STYLE, marginBottom: 4 }}>Inactive · {cohorts.totalInactive}</p>
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
                onClick={() => handleRowClick(entry)}
              />
            );
          })}
        </div>
      )}


      <FullLeaderboardSheet
        open={fullLeaderboardOpen}
        onClose={() => setFullLeaderboardOpen(false)}
        cohorts={cohorts}
        deltasData={deltasData}
        onRowClick={(entry) => {
          setFullLeaderboardOpen(false);
          handleRowClick(entry);
        }}
        viewMode={viewMode}
        ownerFirstName={ownerFirstName}
      />
    </section>
  );
};

export default FriendsLeaderboardSection;
