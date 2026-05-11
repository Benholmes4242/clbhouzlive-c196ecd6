import React, { useMemo } from 'react';
import { useFriendLeaderboard } from '@/lib/whs/hooks';

const AMBER = '#F7931E';
const INK = '#0F172A';
const INK_55 = 'rgba(15,23,42,0.55)';
const INK_70 = '#475569';
const FONT = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

interface Props {
  userId: string;
}

export const FriendsHeaderSection: React.FC<Props> = ({ userId }) => {
  const { data, isLoading } = useFriendLeaderboard(userId);

  const stats = useMemo(() => {
    if (!data) return null;
    const sorted = [...data].sort(
      (a, b) => (a.friend_handicap_index ?? 99) - (b.friend_handicap_index ?? 99),
    );
    const yourRank = sorted.findIndex((e) => e.is_self) + 1;
    const total = sorted.length;
    const sevenDaysAgo = Date.now() - 7 * 86_400_000;
    const playedThisWeek = data.filter(
      (e) =>
        !e.is_self &&
        e.last_round_played_at &&
        new Date(e.last_round_played_at).getTime() >= sevenDaysAgo,
    ).length;
    return { yourRank, total, playedThisWeek };
  }, [data]);

  if (isLoading || !stats) {
    return (
      <section style={{ padding: '10px 20px 8px', fontFamily: FONT }}>
        <div
          className="animate-pulse"
          style={{ height: 64, borderRadius: 12, background: 'rgba(15,23,42,0.06)' }}
        />
      </section>
    );
  }

  return (
    <section style={{ padding: '10px 20px 8px', fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: AMBER }} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: INK_70,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
          }}
        >
          Your Circle
        </span>
      </div>

      <p
        style={{
          margin: 0,
          fontSize: 32,
          fontWeight: 800,
          color: INK,
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <span>
          {stats.playedThisWeek} {stats.playedThisWeek === 1 ? 'friend played' : 'friends played'}
        </span>{' '}
        <span style={{ color: INK_55, fontWeight: 600 }}>this week</span>
      </p>

      {stats.yourRank > 0 && stats.total > 0 && (
        <p
          style={{
            margin: '8px 0 0',
            fontSize: 13,
            color: INK_70,
            lineHeight: 1.4,
          }}
        >
          You're{' '}
          <span style={{ color: INK, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            ranked {stats.yourRank} of {stats.total}
          </span>{' '}
          among friends with active handicaps.
        </p>
      )}
    </section>
  );
};

export default FriendsHeaderSection;
