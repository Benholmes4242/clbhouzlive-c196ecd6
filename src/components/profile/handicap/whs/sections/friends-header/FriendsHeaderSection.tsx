import React, { useMemo } from 'react';
import { useFriendLeaderboard } from '@/lib/whs/hooks';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { fmtHcp } from '@/lib/whs/format';

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
    const self = sorted.find((e) => e.is_self) ?? null;
    return { yourRank, total, playedThisWeek, self };
  }, [data]);

  if (isLoading || !stats) {
    return (
      <section style={{ padding: '0 16px' }}>
        <div
          className="animate-pulse"
          style={{ height: 64, borderRadius: 12, background: 'var(--hcp-bg-3)' }}
        />
      </section>
    );
  }

  const title = `${stats.playedThisWeek} ${stats.playedThisWeek === 1 ? 'friend played' : 'friends played'} this week`;
  const sub =
    stats.yourRank > 0 && stats.total > 0
      ? `You're ranked ${stats.yourRank} of ${stats.total} among friends with active handicaps.`
      : undefined;

  return (
    <section style={{ padding: '0 16px' }}>
      <div
        style={{
          background: 'var(--hcp-bg-2)',
          border: '1px solid var(--hcp-hairline)',
          borderRadius: 16,
          padding: 16,
          fontFamily: '"Geist", system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.14em',
            color: 'var(--hcp-t-100)',
            textTransform: 'uppercase',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--hcp-amber, #F59E0B)',
            }}
          />
          Your Circle
        </div>
        <p
          style={{
            margin: '8px 0 0',
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--hcp-t-100)',
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </p>
        {sub && (
          <p
            style={{
              margin: '4px 0 0',
              fontSize: 13,
              color: 'var(--hcp-t-60)',
              lineHeight: 1.45,
            }}
          >
            {sub}
          </p>
        )}

        {stats.self && stats.yourRank > 0 && stats.total > 0 && (
          <div
            style={{
              marginTop: 14,
              padding: 12,
              borderRadius: 12,
              background: 'var(--hcp-bg-3)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <SquircleAvatar
              src={stats.self.friend_thumbnail_url}
              alt={stats.self.friend_name}
              size={40}
              userId={stats.self.friend_user_id ?? undefined}
              hideRing
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.14em',
                  color: 'var(--hcp-t-60)',
                  textTransform: 'uppercase',
                }}
              >
                Your Position
              </div>
              <div
                style={{
                  marginTop: 2,
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--hcp-t-100)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {stats.self.friend_name} · {fmtHcp(stats.self.friend_handicap_index)} hcp
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 4,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: 'var(--hcp-amber, #F59E0B)',
                  letterSpacing: '-0.02em',
                }}
              >
                {stats.yourRank}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--hcp-t-60)',
                }}
              >
                / {stats.total}
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default FriendsHeaderSection;
