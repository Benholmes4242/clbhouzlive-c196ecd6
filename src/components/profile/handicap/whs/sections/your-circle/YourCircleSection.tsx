import React, { useMemo, useState } from 'react';
import { useFriendLeaderboard } from '@/lib/whs/hooks';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { pickAvatarSrc } from '@/lib/whs/utils/avatarSrc';
import { fmtHcp } from '@/lib/whs/format';

import RecentlyActiveItem from './RecentlyActiveItem';
import { useOpenFriendSheet } from '@/components/friend-sheet/FriendSheetProvider';

interface Props {
  userId: string;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const VISIBLE_LIMIT = 10;
const FONT = '"Geist", system-ui, sans-serif';

const ordinal = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export const YourCircleSection: React.FC<Props> = ({ userId }) => {
  const { data, isLoading } = useFriendLeaderboard(userId);
  const { open: openSheet } = useOpenFriendSheet();
  const [showAll, setShowAll] = useState(false);

  const stats = useMemo(() => {
    if (!data) return null;
    const sorted = [...data].sort(
      (a, b) => (a.friend_handicap_index ?? 99) - (b.friend_handicap_index ?? 99),
    );
    const yourRank = sorted.findIndex((e) => e.is_self) + 1;
    const total = sorted.length;
    const sevenDaysAgo = Date.now() - SEVEN_DAYS_MS;
    const playedThisWeek = data.filter(
      (e) =>
        !e.is_self &&
        e.last_round_played_at &&
        new Date(e.last_round_played_at).getTime() >= sevenDaysAgo,
    ).length;
    const self = sorted.find((e) => e.is_self) ?? null;
    return { yourRank, total, playedThisWeek, self };
  }, [data]);

  const { rail } = useMemo(() => {
    const rows = (data ?? []).filter((e) => !e.is_self && e.last_round_played_at);
    rows.sort((a, b) => {
      const at = a.last_round_played_at ? Date.parse(a.last_round_played_at) : 0;
      const bt = b.last_round_played_at ? Date.parse(b.last_round_played_at) : 0;
      return bt - at;
    });
    return { rail: rows };
  }, [data]);

  if (isLoading || !stats) {
    return (
      <section style={{ marginTop: 32, padding: '0 16px' }}>
        <div
          className="animate-pulse"
          style={{ height: 64, borderRadius: 12, background: 'var(--hcp-bg-3)' }}
        />
      </section>
    );
  }

  const title = `${stats.playedThisWeek} ${stats.playedThisWeek === 1 ? 'friend played' : 'friends played'} this week`;

  const visible = showAll ? rail : rail.slice(0, VISIBLE_LIMIT);
  const overflow = rail.length - Math.min(VISIBLE_LIMIT, rail.length);
  const cutoff = Date.now() - SEVEN_DAYS_MS;

  return (
    <section style={{ marginTop: 32, fontFamily: FONT }}>
      {/* Compact merged header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          padding: '0 16px',
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.14em',
              color: 'var(--hcp-t-60)',
              textTransform: 'uppercase',
            }}
          >
            Your Circle
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 23,
              fontWeight: 800,
              color: 'var(--hcp-t-100)',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            {title}
          </div>
          {stats.yourRank > 0 && stats.total > 0 && (
            <div style={{ marginTop: 3, fontSize: 13, color: 'var(--hcp-t-60)' }}>
              You're{' '}
              <span style={{ fontWeight: 800, color: 'var(--hcp-t-100)' }}>
                {ordinal(stats.yourRank)}
              </span>{' '}
              of {stats.total}
            </div>
          )}
        </div>

        {overflow > 0 && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            style={{
              flexShrink: 0,
              background: 'transparent',
              border: 'none',
              padding: '0 0 4px',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.14em',
              color: 'var(--hcp-t-60)',
              textTransform: 'uppercase',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {showAll ? 'Show less' : `See all · ${rail.length}`}
          </button>
        )}
      </div>

      {/* Rail — you lead, then recently-active friends */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '12px 16px 6px',
          scrollPaddingLeft: 16,
          scrollPaddingRight: 16,
          overflowX: 'auto',
          scrollSnapType: 'x proximity',
          WebkitOverflowScrolling: 'touch',
          willChange: 'transform',
          scrollbarWidth: 'none',
          boxSizing: 'border-box',
        }}
        className="hide-scrollbar"
      >
        {/* Self chip */}
        {stats.self && stats.yourRank > 0 && stats.total > 0 && (
          <div style={{ scrollSnapAlign: 'start' }}>
            <button
              type="button"
              onClick={() => {
                if (stats.self?.friend_user_id) {
                  openSheet({ targetUserId: stats.self.friend_user_id, source: 'recently_active_rail' });
                }
              }}
              style={{
                flex: '0 0 auto',
                width: 92,
                background: 'var(--hcp-bg-1)',
                border: '1.5px solid rgba(247,147,30,0.55)',
                borderRadius: 14,
                padding: '9px 8px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                fontFamily: FONT,
              }}
            >
              <SquircleAvatar
                src={pickAvatarSrc(stats.self.friend_thumbnail_url, stats.self.friend_profile_photo_url)}
                alt={stats.self.friend_name}
                size={56}
                userId={stats.self.friend_user_id ?? undefined}
                hideRing
              />
              <p
                style={{
                  marginTop: 6, marginBottom: 0, fontSize: 11.5, fontWeight: 800,
                  color: 'var(--hcp-t-100)', letterSpacing: '-0.005em', lineHeight: 1,
                }}
              >
                You
              </p>
              <p
                style={{
                  marginTop: 3, marginBottom: 0, fontSize: 13, fontWeight: 800,
                  color: 'var(--hcp-t-100)', fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.02em', lineHeight: 1,
                }}
              >
                {fmtHcp(stats.self.friend_handicap_index)}
              </p>
              <p
                style={{
                  marginTop: 3, marginBottom: 0, fontSize: 9, fontWeight: 800,
                  letterSpacing: '0.04em', textTransform: 'uppercase',
                  color: 'var(--hcp-amber, #F59E0B)', fontVariantNumeric: 'tabular-nums', lineHeight: 1,
                }}
              >
                #{stats.yourRank} of {stats.total}
              </p>
            </button>
          </div>
        )}

        {/* Recently-active friends */}
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
              onClick={() => {
                if (entry.friend_user_id) {
                  openSheet({ targetUserId: entry.friend_user_id, source: 'recently_active_rail' });
                } else {
                  openSheet({ whsOnlyEntry: entry, source: 'recently_active_rail' });
                }
              }}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default YourCircleSection;
