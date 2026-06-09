import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { DarkSectionHeader } from '../_shared/darkAtoms';
import LeaderboardRow from './LeaderboardRow';
import HeroPositionCard from './HeroPositionCard';
import FullLeaderboardSheet from './FullLeaderboardSheet';
import WeeklyBanner from './WeeklyBanner';
import {
  useFriendLeaderboard,
  useFriendLeaderboardRankDeltas,
  useFriendLeaderboardWeeklyBanner,
} from '@/lib/whs/hooks';
import { useHandicapPercentile } from '@/lib/whs/usePercentile';
import { useOpenFriendSheet } from '@/components/friend-sheet/FriendSheetProvider';
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
  const { data, isLoading } = useFriendLeaderboard(userId);
  const percentileQuery = useHandicapPercentile(userId);
  const { data: deltasData } = useFriendLeaderboardRankDeltas(userId, 7);
  const { data: weeklyBanner } = useFriendLeaderboardWeeklyBanner(userId);
  const { open: openSheet } = useOpenFriendSheet();
  const [showInactive, setShowInactive] = useState(false);
  const [heroExpanded, setHeroExpanded] = useState(false);
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

      {/* THIS WEEK banner */}
      {!isLoading && (
        <WeeklyBanner
          banner={weeklyBanner ?? null}
          friends={cohorts.active.concat(cohorts.inactive)}
        />
      )}

      {/* HERO */}
      {isLoading ? (
        <div
          style={{
            margin: '0 20px 16px',
            height: 168,
            background: 'var(--hcp-bg-2)',
            border: '1px solid var(--hcp-line-2)',
            borderRadius: 16,
          }}
          className="animate-pulse"
        />
      ) : (
        <HeroPositionCard
          selfRow={selfRow}
          rowAbove={cohorts.rowAbove}
          selfRank={cohorts.selfActiveRank}
          totalActive={cohorts.totalActive}
          expanded={heroExpanded}
          onToggleExpand={() => setHeroExpanded((v) => !v)}
          viewMode={viewMode}
          ownerFirstName={ownerFirstName}
        />
      )}

      {/* TOP 5 + column label */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px 8px',
        }}
      >
        <p style={{ ...LABEL_STYLE, flex: 1 }}>TOP 5</p>
        <p style={{ ...LABEL_STYLE, width: 32, textAlign: 'center' }}>7D</p>
        <div style={{ width: 56 }} />
      </div>

      {isLoading ? (
        Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse"
            style={{
              margin: '0 0 1px',
              height: 54,
              background: 'var(--hcp-bg-2)',
              borderRadius: 6,
            }}
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

      {/* See full leaderboard CTA */}
      {!isLoading && cohorts.totalActive > 0 && (
        <button
          type="button"
          onClick={() => setFullLeaderboardOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            width: 'calc(100% - 40px)',
            margin: '14px 20px 8px',
            padding: '12px 16px',
            background: 'var(--hcp-bg-1)',
            border: '1px solid var(--hcp-line-2)',
            borderRadius: 12,
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

      {/* Inactive section */}
      {!isLoading && cohorts.totalInactive > 0 && (
        <>
          {showInactive ? (
            <>
              <div style={{ padding: '16px 20px 8px' }}>
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
                margin: '4px 20px 16px',
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
