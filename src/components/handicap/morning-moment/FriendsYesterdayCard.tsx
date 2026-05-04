/**
 * FriendsYesterdayCard — surfaces friends who posted rounds yesterday.
 * Tap navigates to the Friends sub-tab on /handicap.
 */
import React from 'react';
import { Users, ChevronRight } from 'lucide-react';
import type { FriendsYesterdayResult } from '@/lib/handicap/useFriendsYesterday';
import { analyticsEvents } from '@/utils/analyticsEvents';

const INK = '#0F172A';
const INK_55 = '#64748B';
const INK_10 = 'rgba(15,23,42,0.10)';
const GREEN = '#059669';
const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

interface Props {
  data: FriendsYesterdayResult;
  userId: string;
}

const FriendsYesterdayCard: React.FC<Props> = ({ data, userId }) => {
  const { friends, count, best } = data;

  const standoutLine = (() => {
    if (!best) return '';
    if (count === 1) {
      return `${best.name} shot ${best.score}${best.course_name ? ` at ${best.course_name}` : ''}`;
    }
    return `${best.name} shot ${best.score} — best of the group`;
  })();

  const handleTap = () => {
    analyticsEvents.track('morning_moment_friends_tapped', {
      user_id: userId,
      friends_count: count,
    });
    const url = new URL(window.location.href);
    url.searchParams.set('subtab', 'friends');
    window.history.pushState({}, '', url.toString());
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <button
      type="button"
      onClick={handleTap}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        background: '#fff',
        border: `0.5px solid ${INK_10}`,
        borderRadius: 12,
        padding: '12px 14px',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: FONT_GEIST,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 11,
          background: `${GREEN}14`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Users size={20} color={GREEN} strokeWidth={2} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 9,
            fontWeight: 800,
            color: INK_55,
            letterSpacing: '0.16em',
            marginBottom: 4,
          }}
        >
          FRIENDS YESTERDAY
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Avatar stack */}
          <div style={{ display: 'flex', flexShrink: 0 }}>
            {friends.slice(0, 3).map((f, idx) => (
              <div
                key={`${f.user_id ?? 'x'}-${idx}`}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: f.thumbnail_url
                    ? `url(${f.thumbnail_url}) center/cover`
                    : `linear-gradient(135deg, ${GREEN}, #047857)`,
                  border: '2px solid #fff',
                  marginLeft: idx === 0 ? 0 : -7,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 9,
                  fontWeight: 700,
                  zIndex: 3 - idx,
                }}
              >
                {!f.thumbnail_url && f.initial}
              </div>
            ))}
          </div>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: INK,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {count === 1 ? '1 friend played' : `${count} friends played`}
          </span>
        </div>

        <div
          style={{
            fontSize: 11,
            color: INK_55,
            marginTop: 2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {standoutLine}
        </div>
      </div>

      <ChevronRight size={16} color={INK_55} />
    </button>
  );
};

export default FriendsYesterdayCard;
