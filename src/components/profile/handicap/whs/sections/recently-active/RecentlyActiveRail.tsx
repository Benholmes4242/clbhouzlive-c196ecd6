import React, { useMemo, useState } from 'react';
import { useFriendLeaderboard } from '@/lib/whs/hooks';
import SectionHeader from '../SectionHeader';
import RecentlyActiveItem from './RecentlyActiveItem';
import FriendProfileSheet from '../friend-profile-sheet/FriendProfileSheet';

interface Props {
  userId: string;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const VISIBLE_LIMIT = 10;

export const RecentlyActiveRail: React.FC<Props> = ({ userId }) => {
  const { data, isLoading } = useFriendLeaderboard(userId);
  const [showAll, setShowAll] = useState(false);
  const [profileSheet, setProfileSheet] = useState<{ index: number } | null>(null);

  const { sorted, activeCount } = useMemo(() => {
    const rows = (data ?? []).filter((e) => !e.is_self && e.last_round_played_at);
    rows.sort((a, b) => {
      const at = a.last_round_played_at ? Date.parse(a.last_round_played_at) : 0;
      const bt = b.last_round_played_at ? Date.parse(b.last_round_played_at) : 0;
      return bt - at;
    });
    const cutoff = Date.now() - SEVEN_DAYS_MS;
    const active = rows.filter(
      (e) => e.last_round_played_at && Date.parse(e.last_round_played_at) >= cutoff,
    ).length;
    return { sorted: rows, activeCount: active };
  }, [data]);

  if (isLoading) {
    return <RecentlyActiveSkeleton />;
  }

  if (sorted.length === 0) {
    return null;
  }

  const visible = showAll ? sorted : sorted.slice(0, VISIBLE_LIMIT);
  const overflow = sorted.length - Math.min(VISIBLE_LIMIT, sorted.length);
  const cutoff = Date.now() - SEVEN_DAYS_MS;

  return (
    <section style={{ padding: '20px 0 8px' }}>
      <SectionHeader
        eyebrow="RECENTLY ACTIVE"
        title="Your circle"
        sub={`${activeCount} ${activeCount === 1 ? 'friend' : 'friends'} played this week`}
        right={
          overflow > 0 ? (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '4px 0',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.08em',
                color: '#0F172A',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {showAll ? 'Show less' : `See all (${sorted.length})`}
            </button>
          ) : null
        }
      />

      <div
        style={{
          display: 'flex',
          gap: 14,
          padding: '4px 20px 6px',
          overflowX: 'auto',
          scrollSnapType: 'x proximity',
          WebkitOverflowScrolling: 'touch',
          willChange: 'transform',
        }}
      >
        {visible.map((entry) => (
          <div
            key={entry.friend_user_id ?? entry.friend_connection_id ?? entry.friend_name}
            style={{ scrollSnapAlign: 'start' }}
          >
            <RecentlyActiveItem
              entry={entry}
              isActive={
                !!entry.last_round_played_at &&
                Date.parse(entry.last_round_played_at) >= cutoff
              }
            />
          </div>
        ))}
      </div>
    </section>
  );
};

const RecentlyActiveSkeleton: React.FC = () => (
  <section style={{ padding: '20px 0 8px' }}>
    <SectionHeader eyebrow="RECENTLY ACTIVE" title="Your circle" />
    <div style={{ display: 'flex', gap: 14, padding: '4px 20px 6px', overflow: 'hidden' }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div
            className="animate-pulse"
            style={{ width: 60, height: 60, borderRadius: '34%', background: 'rgba(15,23,42,0.06)' }}
          />
          <div className="animate-pulse" style={{ width: 42, height: 10, borderRadius: 4, background: 'rgba(15,23,42,0.06)' }} />
          <div className="animate-pulse" style={{ width: 26, height: 8, borderRadius: 4, background: 'rgba(15,23,42,0.06)' }} />
        </div>
      ))}
    </div>
  </section>
);

export default RecentlyActiveRail;
