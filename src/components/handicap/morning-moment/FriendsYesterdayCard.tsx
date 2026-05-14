/**
 * FriendsYesterdayCard — Cinema-language two-tier section. The BEST OF GROUP
 * hero (280px) sits above a horizontal scroll of 250×168 mini cards for the
 * remaining players. Tap-through navigates to the Friends sub-tab.
 */
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import type { FriendsYesterdayResult } from '@/lib/handicap/useFriendsYesterday';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { HeroCard, MiniCard } from './friends-yesterday';

const T = {
  ink: '#0F172A',
  ink55: 'rgba(15,23,42,0.55)',
  ink40: 'rgba(15,23,42,0.40)',
  ink10: 'rgba(15,23,42,0.10)',
  green: '#22C55E',
};
const FONT = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

const EmptyState: React.FC<{ reason: string }> = ({ reason }) => {
  let copy = 'No friend rounds available.';
  if (reason === 'no_whs_friends') copy = 'No friends connected yet.';
  else if (reason === 'no_friends_played') copy = 'No friends played yesterday.';
  return (
    <div
      style={{
        padding: '14px 16px',
        background: '#fff',
        border: `0.5px solid ${T.ink10}`,
        borderRadius: 12,
        fontSize: 12,
        color: T.ink55,
        fontFamily: FONT,
        textAlign: 'center',
      }}
    >
      {copy}
    </div>
  );
};

interface Props {
  data: FriendsYesterdayResult;
  userId: string;
}

const FriendsYesterdayCard: React.FC<Props> = ({ data, userId }) => {
  const { friends, count, absenceReason } = data;
  const [searchParams, setSearchParams] = useSearchParams();

  const handleTap = () => {
    analyticsEvents.track('morning_moment_friends_tapped', {
      user_id: userId,
      friends_count: count,
    });
    const params = new URLSearchParams(searchParams);
    params.set('subtab', 'friends');
    setSearchParams(params, { replace: false });
  };

  if (absenceReason && friends.length === 0) {
    return <EmptyState reason={absenceReason} />;
  }
  if (friends.length === 0) return null;

  const best = friends[0];
  const others = friends.slice(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', fontFamily: FONT }}>
      {/* Section eyebrow */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: T.green,
            display: 'inline-block',
            boxShadow: '0 0 6px rgba(34,197,94,0.4)',
          }}
        />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'rgba(15,23,42,0.45)',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          FRIENDS YESTERDAY · {count} PLAYED
        </span>
      </div>

      {/* Hero */}
      <HeroCard friend={best} onClick={handleTap} />

      {others.length > 0 && (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 24,
              marginBottom: 12,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: 'rgba(15,23,42,0.45)',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
              }}
            >
              {others.length} MORE PLAYED
            </span>
            {others.length > 1 && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  color: 'rgba(15,23,42,0.30)',
                  letterSpacing: '0.08em',
                }}
              >
                ← swipe →
              </span>
            )}
          </div>
          <div
            className="fyc-scroll"
            style={{
              display: 'flex',
              gap: 10,
              overflowX: 'auto',
              overflowY: 'hidden',
              marginLeft: -16,
              marginRight: -16,
              paddingLeft: 16,
              paddingRight: 16,
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
            }}
          >
            <style>{`.fyc-scroll::-webkit-scrollbar{display:none}`}</style>
            {others.map((f, i) => (
              <MiniCard
                key={`${f.user_id ?? 'x'}-${i}`}
                friend={f}
                rank={i + 2}
                onClick={handleTap}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default FriendsYesterdayCard;
