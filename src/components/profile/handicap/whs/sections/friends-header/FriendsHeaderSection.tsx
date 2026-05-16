import React, { useMemo } from 'react';
import { useFriendLeaderboard } from '@/lib/whs/hooks';
import SectionHeader from '../SectionHeader';

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
    <section>
      <SectionHeader eyebrow="YOUR CIRCLE" title={title} sub={sub} />
    </section>
  );
};

export default FriendsHeaderSection;
