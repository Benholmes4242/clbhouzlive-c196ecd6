import React, { useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import SectionHeader from '../SectionHeader';
import { useFriendRoundsSinceLastVisit, useMarkTodayVisited } from '@/lib/whs/hooks';
import { firstName, initials } from '@/lib/whs/utils/initials';
import { fmtRelative } from '@/lib/whs/utils/nameFormat';
import type { FriendRoundSinceLastVisit } from '@/lib/whs/types';

const T = {
  ink: '#0F172A',
  ink55: 'rgba(15,23,42,0.55)',
  ink40: 'rgba(15,23,42,0.40)',
  ink08: 'rgba(15,23,42,0.08)',
  ink06: 'rgba(15,23,42,0.06)',
  amber: '#F7931E',
  green: '#059669',
  green14: 'rgba(5,150,105,0.14)',
};
const FONT = "'Geist', system-ui, -apple-system, BlinkMacSystemFont, sans-serif";

interface Props {
  userId: string;
}

export const SinceLastVisitRail: React.FC<Props> = ({ userId }) => {
  const { data, isLoading } = useFriendRoundsSinceLastVisit(!!userId);
  const markVisited = useMarkTodayVisited();

  // CRITICAL: mark visited only AFTER first successful read.
  // If we marked on mount before the read, the RPC would see the new
  // timestamp and return 0 rounds. Fire-and-forget after data arrives.
  useEffect(() => {
    if (data?.available) {
      markVisited.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.available]);

  if (isLoading) {
    return (
      <section style={{ marginBottom: 24 }}>
        <SectionHeader eyebrow="Your circle" title="Since last visit" sub="Loading…" />
        <div style={{ padding: '0 20px' }}>
          <div
            style={{
              height: 84,
              borderRadius: 12,
              background: T.ink06,
            }}
            className="animate-pulse"
          />
        </div>
      </section>
    );
  }

  if (!data?.available || !data.rounds || data.rounds.length === 0) {
    return null;
  }

  const count = data.rounds.length;
  const headerTitle = data.is_first_visit
    ? `${count} rounds in your circle this week`
    : `Your circle posted ${count} ${count === 1 ? 'round' : 'rounds'}`;

  const headerSub = data.is_first_visit
    ? 'A glimpse of recent activity'
    : 'Since your last visit';

  return (
    <section style={{ marginBottom: 24, fontFamily: FONT }}>
      <SectionHeader eyebrow="Your circle" title={headerTitle} sub={headerSub} />
      <div
        style={{
          display: 'flex',
          gap: 10,
          padding: '0 20px 8px',
          overflowX: 'auto',
          scrollPaddingLeft: 20,
          scrollPaddingRight: 20,
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
        className="hide-scrollbar"
      >
        {data.rounds.map((r, i) => (
          <RoundCard key={`${r.friend_user_id ?? 'na'}-${i}`} round={r} />
        ))}
      </div>
    </section>
  );
};

const RoundCard: React.FC<{ round: FriendRoundSinceLastVisit }> = ({ round }) => {
  return (
    <div
      style={{
        flex: '0 0 260px',
        padding: 12,
        borderRadius: 12,
        background: '#fff',
        border: `0.5px solid ${T.ink08}`,
        scrollSnapAlign: 'start',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {round.friend_thumbnail_url ? (
          <img
            src={round.friend_thumbnail_url}
            alt=""
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              objectFit: 'cover',
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: T.green14,
              color: T.green,
              fontWeight: 800,
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {initials(round.friend_name)}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: T.ink,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {firstName(round.friend_name)}
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: T.ink55,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {fmtRelative(round.last_round_played_at)}
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          paddingTop: 8,
          borderTop: `0.5px solid ${T.ink08}`,
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 12,
            fontWeight: 600,
            color: T.ink,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {round.last_round_course_name ?? 'Unknown course'}
        </div>
        <ChevronRight size={14} color={T.ink40} strokeWidth={2.2} />
      </div>
    </div>
  );
};

export default SinceLastVisitRail;
