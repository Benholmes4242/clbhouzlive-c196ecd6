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
import { useOpenFriendSheet } from '@/components/friend-sheet/FriendSheetProvider';
import { Skeleton } from '@/components/ui/skeleton';

import { buildLeaderboardCohorts } from '@/lib/whs/utils/buildLeaderboardCohorts';
import type { FriendLeaderboardEntry } from '@/lib/whs/types';

interface Props {
  userId: string;
  viewMode?: 'owner' | 'friend';
  ownerFirstName?: string | null;
}

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';


const LABEL_STYLE: React.CSSProperties = {
  margin: 0,
  fontSize: 10,
  fontWeight: 800,
  color: 'var(--hcp-t-40)',
  letterSpacing: '0.16em',
};

export const FriendsLeaderboardSection: React.FC<Props> = ({ userId, viewMode = 'owner', ownerFirstName = null }) => {
  const { data, isLoading, isError, refetch } = useFriendLeaderboard(userId);
  const percentileQuery = useHandicapPercentile(userId);
  const { data: deltasData } = useFriendLeaderboardRankDeltas(userId, 30);
  const { data: weeklyBanner } = useFriendLeaderboardWeeklyBanner(userId);
  const { open: openSheet } = useOpenFriendSheet();
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

  const tail = `${cohorts.totalActive} active${
    cohorts.totalInactive > 0 ? `, ${cohorts.totalInactive} inactive` : ''
  }`;

  const isFriend = viewMode === 'friend';
  const possessive = ownerFirstName ? `${ownerFirstName}'s` : 'Their';
  const subjectIs = ownerFirstName ? `${ownerFirstName} is` : 'They are';

  const subLine = isLoading
    ? 'Loading…'
    : circlePercentile != null
      ? isFriend
        ? `${subjectIs} top ${circlePercentile}% of ${ownerFirstName ? `${ownerFirstName}'s` : 'their'} circle · ${tail}`
        : `You're top ${circlePercentile}% of your circle · ${tail}`
      : `Ranked by current handicap · ${tail}`;


  const handleRowClick = (entry: FriendLeaderboardEntry) => {
    if (entry.is_self) return;
    if (entry.friend_user_id) {
      openSheet({
        targetUserId: entry.friend_user_id,
        source: 'friends_leaderboard_row',
      });
    } else {
      openSheet({
        whsOnlyEntry: entry,
        source: 'friends_leaderboard_row',
      });
    }
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
        sub={subLine}
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

        {/* Divider + TOP 5 / 30D label row (tinted strip) */}
        {!isLoading && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px 8px',
              background: 'var(--hcp-bg-2)',
              borderTop: '1px solid var(--hcp-line-2)',
            }}
          >
            <p style={{ ...LABEL_STYLE, flex: 1, margin: 0 }}>Top of your circle</p>
            <p style={{ ...LABEL_STYLE, width: 32, textAlign: 'center', margin: 0 }}>30D</p>
            <div style={{ width: 56 }} />
          </div>
        )}

        {/* Rows */}
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              variant="dark"
              style={{ margin: '0 0 1px', height: 54, width: '100%', borderRadius: 0 }}
            />
          ))
        ) : (
          (() => {


            return cohorts.topFive.map((entry) => {
              const activeIdx = cohorts.active.findIndex((e) => e === entry);
              const rank = activeIdx >= 0 ? activeIdx + 1 : null;
              const delta = entry.friend_row_id
                ? deltasData?.byFriendRowId.get(entry.friend_row_id)
                : undefined;

              /* The member's row is a GROUP BOUNDARY: an amber rule above it.
                 This is the one permitted internal line on this surface. The
                 gap to the player above is already stated as the TO CATCH
                 figure, so it is not repeated here. */
              return (
                <React.Fragment key={entry.is_self ? 'self' : `${entry.friend_user_id ?? ''}-${entry.friend_name}`}>
                  {entry.is_self && (
                    <div
                      aria-hidden
                      style={{ height: 1, background: 'rgba(247,147,30,0.45)', margin: '6px 0 0' }}
                    />
                  )}
                  <LeaderboardRow
                    entry={entry}
                    rank={rank}
                    isStaleRow={false}
                    rankDelta={delta}
                    onClick={entry.is_self ? undefined : () => handleRowClick(entry)}
                  />
                </React.Fragment>
              );
            });
          })()
        )}


        {/* See all — now the card's footer */}
        {!isLoading && cohorts.totalActive > 0 && (
          <button
            type="button"
            onClick={() => setFullLeaderboardOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              width: '100%',
              padding: '12px 16px',
              background: 'var(--hcp-bg-1)',
              border: 'none',
              borderTop: '1px solid var(--hcp-line-2)',
              color: 'var(--hcp-t-80)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: FONT,
            }}
          >
            See all {cohorts.totalActive} active
            <span style={{ fontSize: 14, color: 'var(--hcp-t-60)' }}>›</span>
          </button>
        )}
      </div>
      )}
      {/* ===== END CARD ===== */}

      {/* Inactive section */}
      {!isLoading && !isError && cohorts.totalInactive > 0 && (
        <>
          {showInactive ? (
            <>
              <div style={{ padding: '16px 16px 8px' }}>
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
                    onClick={() => handleRowClick(entry)}
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
                margin: '4px 16px 16px',
                padding: '8px 16px',
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
