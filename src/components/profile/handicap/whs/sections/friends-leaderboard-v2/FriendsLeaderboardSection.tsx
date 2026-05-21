import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { DarkSectionHeader } from '../_shared/darkAtoms';
import LeaderboardRow from './LeaderboardRow';
import HeroPositionCard from './HeroPositionCard';
import WeeklyBanner from './WeeklyBanner';
import FriendProfileSheet from '../friend-profile-sheet/FriendProfileSheet';
import {
  useFriendLeaderboard,
  useFriendLeaderboardRankDeltas,
  useFriendLeaderboardWeeklyBanner,
} from '@/lib/whs/hooks';
import { useHandicapPercentile } from '@/lib/whs/usePercentile';
import { useOpenFriendHybridSheet } from '@/components/friend-hybrid-sheet/FriendHybridSheetProvider';
import { buildLeaderboardCohorts } from '@/lib/whs/utils/buildLeaderboardCohorts';
import type { FriendLeaderboardEntry } from '@/lib/whs/types';

interface Props {
  userId: string;
}

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';


const LABEL_STYLE: React.CSSProperties = {
  margin: 0,
  fontSize: 10,
  fontWeight: 800,
  color: 'var(--hcp-t-40)',
  letterSpacing: '0.16em',
};

export const FriendsLeaderboardSection: React.FC<Props> = ({ userId }) => {
  const { data, isLoading } = useFriendLeaderboard(userId);
  const percentileQuery = useHandicapPercentile(userId);
  const { data: deltasData } = useFriendLeaderboardRankDeltas(userId, 90);
  const { data: weeklyBanner } = useFriendLeaderboardWeeklyBanner(userId);
  const { open: openHybridSheet } = useOpenFriendHybridSheet();
  const [showInactive, setShowInactive] = useState(false);
  const [profileSheet, setProfileSheet] = useState<{ index: number } | null>(null);
  const [heroExpanded, setHeroExpanded] = useState(false);

  const cohorts = buildLeaderboardCohorts(data);
  const selfRow =
    cohorts.selfActiveIdx >= 0 ? cohorts.active[cohorts.selfActiveIdx] : null;
  const percentileTop =
    percentileQuery.data?.available === true ? percentileQuery.data.percentile_top : null;

  const subLine = isLoading
    ? 'Loading…'
    : percentileTop != null
      ? `You're top ${percentileTop}% of all Clbhouz · ${cohorts.totalActive} active${
          cohorts.totalInactive > 0 ? `, ${cohorts.totalInactive} inactive` : ''
        }`
      : `Ranked by current handicap · ${cohorts.totalActive} active${
          cohorts.totalInactive > 0 ? `, ${cohorts.totalInactive} inactive` : ''
        }`;

  const handleRowClick = (entry: FriendLeaderboardEntry) => {
    if (entry.is_self) return;
    if (entry.friend_user_id) {
      openHybridSheet({
        targetUserId: entry.friend_user_id,
        source: 'friends_leaderboard_row',
      });
    } else {
      // FriendProfileSheet expects an index into the sorted master list.
      const sortedAll = [...cohorts.active, ...cohorts.inactive];
      const realIdx = sortedAll.findIndex((e) => e === entry);
      if (realIdx >= 0) setProfileSheet({ index: realIdx });
    }
  };

  return (
    <section style={{ marginTop: 32 }}>
      <DarkSectionHeader
        eyebrow="LEADERBOARD"
        title="You vs your circle"
        sub={subLine}
      />

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
        />
      )}

      {/* TOP 5 + column label */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px 8px',
        }}
      >
        <p style={LABEL_STYLE}>TOP 5</p>
        <p style={{ ...LABEL_STYLE, paddingRight: 60 }}>30D</p>
      </div>

      {isLoading ? (
        Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse"
            style={{
              margin: '0 20px 1px',
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
          return (
            <LeaderboardRow
              key={entry.is_self ? 'self' : `${entry.friend_user_id ?? ''}-${entry.friend_name}`}
              entry={entry}
              rank={rank}
              isStaleRow={false}
              onClick={entry.is_self ? undefined : () => handleRowClick(entry)}
            />
          );
        })
      )}

      {/* See full leaderboard CTA */}
      {!isLoading && cohorts.totalActive > 0 && (
        <button
          type="button"
          onClick={() => {
            // TODO Phase 1.1 — open full leaderboard sheet
          }}
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
              {cohorts.inactive.map((entry) => (
                <LeaderboardRow
                  key={`inactive-${entry.friend_user_id ?? ''}-${entry.friend_name}`}
                  entry={entry}
                  rank={null}
                  isStaleRow={true}
                  onClick={() => handleRowClick(entry)}
                />
              ))}
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

      <FriendProfileSheet
        friends={[...cohorts.active, ...cohorts.inactive]}
        startIndex={profileSheet?.index ?? 0}
        ownerUserId={userId}
        open={!!profileSheet}
        onClose={() => setProfileSheet(null)}
      />
    </section>
  );
};

export default FriendsLeaderboardSection;
