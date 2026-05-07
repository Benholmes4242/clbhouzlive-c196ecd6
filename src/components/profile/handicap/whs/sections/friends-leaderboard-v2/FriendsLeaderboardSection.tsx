import React, { useState } from 'react';
import SectionHeader from '../SectionHeader';
import LeaderboardRow from './LeaderboardRow';
import FriendProfileSheet from '../friend-profile-sheet/FriendProfileSheet';
import { useFriendLeaderboard } from '@/lib/whs/hooks';
import { ChevronRight } from 'lucide-react';
import type { FriendLeaderboardEntry } from '@/lib/whs/types';

interface Props {
  userId: string;
}

type GapRow = { isGap: true };
type VisibleRow = FriendLeaderboardEntry | GapRow;

const HEADER_LABEL: React.CSSProperties = {
  margin: 0,
  fontSize: 8,
  fontWeight: 800,
  color: 'rgba(15,23,42,0.40)',
  letterSpacing: '0.16em',
};

export const FriendsLeaderboardSection: React.FC<Props> = ({ userId }) => {
  const { data, isLoading } = useFriendLeaderboard(userId);
  const [showAll, setShowAll] = useState(false);
  const [profileSheet, setProfileSheet] = useState<{ index: number } | null>(null);

  const sorted = (data ?? [])
    .slice()
    .sort((a, b) => (a.friend_handicap_index ?? 99) - (b.friend_handicap_index ?? 99));

  const yourIdx = sorted.findIndex((e) => e.is_self);
  const yourRank = yourIdx + 1;
  const total = sorted.length;

  const DEFAULT_LIMIT = 10;

  let visible: VisibleRow[] = [];
  if (showAll || sorted.length <= DEFAULT_LIMIT) {
    visible = sorted;
  } else {
    const head = sorted.slice(0, DEFAULT_LIMIT);
    if (head.find((e) => e.is_self)) {
      visible = head;
    } else {
      const headTrim = sorted.slice(0, DEFAULT_LIMIT - 3);
      const start = Math.max(0, yourIdx - 1);
      const end = Math.min(sorted.length, yourIdx + 2);
      visible = [...headTrim, { isGap: true } as GapRow, ...sorted.slice(start, end)];
    }
  }

  return (
    <section style={{ padding: '24px 0 8px' }}>
      <SectionHeader
        eyebrow="LEADERBOARD"
        title={isLoading || total === 0 ? 'Loading…' : `You're ranked ${yourRank} of ${total}`}
        sub="Your circle, ranked by current handicap"
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
          <p style={HEADER_LABEL}>TREND</p>
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
          if ('isGap' in entry) {
            return (
              <div
                key={`gap-${i}`}
                style={{
                  margin: '0 20px',
                  padding: '10px 0',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'rgba(15,23,42,0.40)',
                  letterSpacing: '0.10em',
                  textAlign: 'center',
                  borderBottom: '1px solid rgba(15,23,42,0.06)',
                }}
              >
                · · ·
              </div>
            );
          }
          const realRank =
            sorted.findIndex((e) =>
              entry.is_self
                ? e.is_self
                : e.friend_user_id === entry.friend_user_id && e.friend_name === entry.friend_name,
            ) + 1;
          return (
            <LeaderboardRow
              key={entry.is_self ? 'self' : `${entry.friend_user_id ?? ''}-${entry.friend_name}`}
              entry={entry}
              rank={realRank}
              isFirst={i === 0}
              isLast={i === visible.length - 1}
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

      {/* See all */}
      {!showAll && !isLoading && sorted.length > DEFAULT_LIMIT && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            width: 'calc(100% - 40px)',
            margin: '12px 20px 0',
            padding: '10px 16px',
            background: '#fff',
            border: '0.5px solid rgba(15,23,42,0.10)',
            borderRadius: 12,
            color: '#F7931E',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.04em',
            cursor: 'pointer',
            fontFamily: '"Geist", system-ui, sans-serif',
          }}
        >
          See full leaderboard ({sorted.length})
          <ChevronRight size={14} />
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
