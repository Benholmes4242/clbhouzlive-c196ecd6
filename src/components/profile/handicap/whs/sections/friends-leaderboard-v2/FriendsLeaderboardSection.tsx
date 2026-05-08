import React, { useMemo, useState } from 'react';
import SectionHeader from '../SectionHeader';
import LeaderboardRow from './LeaderboardRow';
import FriendProfileSheet from '../friend-profile-sheet/FriendProfileSheet';
import { useFriendLeaderboard } from '@/lib/whs/hooks';
import { ChevronDown } from 'lucide-react';
import type { FriendLeaderboardEntry } from '@/lib/whs/types';

interface Props {
  userId: string;
}

const HEADER_LABEL: React.CSSProperties = {
  margin: 0,
  fontSize: 8,
  fontWeight: 800,
  color: 'rgba(15,23,42,0.40)',
  letterSpacing: '0.16em',
};

const STALE_THRESHOLD_DAYS = 90;

const isStale = (lastPlayed: string | null): boolean => {
  if (!lastPlayed) return true;
  const days = (Date.now() - new Date(lastPlayed).getTime()) / (1000 * 60 * 60 * 24);
  return days > STALE_THRESHOLD_DAYS;
};

export const FriendsLeaderboardSection: React.FC<Props> = ({ userId }) => {
  const { data, isLoading } = useFriendLeaderboard(userId);
  const [showInactive, setShowInactive] = useState(false);
  const [profileSheet, setProfileSheet] = useState<{ index: number } | null>(null);

  // Sort by handicap (low → high). NULL handicaps sink to the bottom.
  const sorted = useMemo(
    () =>
      (data ?? [])
        .slice()
        .sort(
          (a, b) =>
            (a.friend_handicap_index ?? 99) - (b.friend_handicap_index ?? 99),
        ),
    [data],
  );

  // Split into active vs inactive. The "self" row is always treated as active
  // even if its last round is old — we should never hide the user from
  // their own leaderboard.
  const { activeRows, inactiveRows } = useMemo(() => {
    const active: FriendLeaderboardEntry[] = [];
    const inactive: FriendLeaderboardEntry[] = [];
    for (const e of sorted) {
      if (e.is_self || !isStale(e.last_round_played_at)) {
        active.push(e);
      } else {
        inactive.push(e);
      }
    }
    return { activeRows: active, inactiveRows: inactive };
  }, [sorted]);

  const yourActiveRank = useMemo(
    () => activeRows.findIndex((e) => e.is_self) + 1,
    [activeRows],
  );
  const totalActive = activeRows.length;
  const inactiveCount = inactiveRows.length;

  const visible = showInactive ? [...activeRows, ...inactiveRows] : activeRows;

  const yourActiveIdx = activeRows.findIndex((e) => e.is_self);
  const yourHcp = activeRows[yourActiveIdx]?.friend_handicap_index ?? null;

  return (
    <section style={{ padding: '24px 0 8px' }}>
      <SectionHeader
        eyebrow="LEADERBOARD"
        title={
          isLoading || totalActive === 0
            ? 'Loading…'
            : `You're ${yourActiveRank} of ${totalActive} active`
        }
        sub={
          inactiveCount > 0
            ? `Active = round in last 90 days · ${inactiveCount} inactive`
            : 'Your circle, ranked by current handicap'
        }
      />

      {/* Column headers */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px 8px',
        }}
      >
        <div style={{ width: 22, textAlign: 'center', flexShrink: 0 }}>
          <p style={HEADER_LABEL}>#</p>
        </div>
        <div style={{ flex: 1, minWidth: 0, paddingLeft: 16 }}>
          <p style={HEADER_LABEL}>PLAYER</p>
        </div>
        <div style={{ width: 60, textAlign: 'center', flexShrink: 0, paddingRight: 6 }}>
          <p style={HEADER_LABEL}>30D</p>
        </div>
        <div style={{ width: 60, textAlign: 'right', flexShrink: 0 }}>
          <p style={HEADER_LABEL}>HCP</p>
        </div>
      </div>

      {/* Rows */}
      {isLoading ? (
        Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse"
            style={{
              margin: '0 20px 1px',
              height: 54,
              background: 'rgba(15,23,42,0.04)',
              borderRadius: 6,
            }}
          />
        ))
      ) : (
        visible.map((entry, i) => {
          const realRank =
            sorted.findIndex((e) =>
              entry.is_self
                ? e.is_self
                : e.friend_user_id === entry.friend_user_id &&
                  e.friend_name === entry.friend_name,
            ) + 1;

          const activeIdx = activeRows.findIndex((e) => e === entry);
          const isActiveAdjacent =
            !entry.is_self &&
            activeIdx >= 0 &&
            (activeIdx === yourActiveIdx - 1 || activeIdx === yourActiveIdx + 1);
          const gapFromYou =
            isActiveAdjacent && yourHcp != null && entry.friend_handicap_index != null
              ? entry.friend_handicap_index - yourHcp
              : null;

          const staleRow = !entry.is_self && isStale(entry.last_round_played_at);

          return (
            <LeaderboardRow
              key={entry.is_self ? 'self' : `${entry.friend_user_id ?? ''}-${entry.friend_name}`}
              entry={entry}
              rank={realRank}
              isFirst={i === 0}
              isLast={i === visible.length - 1}
              isStaleRow={staleRow}
              gapFromYou={gapFromYou}
              onClick={
                entry.is_self
                  ? undefined
                  : () => {
                      const realIdx = sorted.findIndex((e) => e === entry);
                      if (realIdx >= 0) setProfileSheet({ index: realIdx });
                    }
              }
            />
          );
        })
      )}

      {/* Show inactive toggle */}
      {!showInactive && !isLoading && inactiveCount > 0 && (
        <button
          type="button"
          onClick={() => setShowInactive(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            width: 'calc(100% - 40px)',
            margin: '12px 20px 0',
            padding: '10px 16px',
            background: '#fff',
            border: '0.5px solid rgba(15,23,42,0.10)',
            borderRadius: 12,
            color: 'rgba(15,23,42,0.78)',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.02em',
            cursor: 'pointer',
            fontFamily: '"Geist", system-ui, sans-serif',
          }}
        >
          Show {inactiveCount} inactive friend{inactiveCount === 1 ? '' : 's'}
          <ChevronDown size={14} />
        </button>
      )}

      <FriendProfileSheet
        friends={sorted}
        startIndex={profileSheet?.index ?? 0}
        ownerUserId={userId}
        open={!!profileSheet}
        onClose={() => setProfileSheet(null)}
      />
    </section>
  );
};

export default FriendsLeaderboardSection;
