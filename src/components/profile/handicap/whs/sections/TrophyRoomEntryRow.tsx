/**
 * TrophyRoomEntryRow — extracted from TodayGreeting so it renders for both
 * owner and friend view of /handicap/[:userId].
 */
import React from 'react';
import { Trophy, ChevronRight } from 'lucide-react';
import { openGamAchievements } from '../gam/events';
import { useUserAchievements } from '@/hooks/gam/useUserAchievements';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface Props {
  userId: string;
  viewMode?: 'owner' | 'friend';
  ownerFirstName?: string | null;
}

const TrophyRoomEntryRow: React.FC<Props> = ({ userId, viewMode = 'owner', ownerFirstName = null }) => {
  const { data: achievements } = useUserAchievements(userId);

  const { weeklyCount, lifetimeCount } = React.useMemo(() => {
    if (!achievements) return { weeklyCount: 0, lifetimeCount: 0 };
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let weekly = 0;
    let lifetime = 0;
    for (const b of achievements) {
      if (!b.is_earned) continue;
      lifetime++;
      if (b.earned_at && new Date(b.earned_at).getTime() > cutoff) weekly++;
    }
    return { weeklyCount: weekly, lifetimeCount: lifetime };
  }, [achievements]);

  if (lifetimeCount === 0) return null;

  const isFriend = viewMode === 'friend';
  const possessive = ownerFirstName ? `${ownerFirstName}'s` : 'Their';
  const subjPronoun = ownerFirstName ?? 'They';
  const hasOrHave = ownerFirstName ? 'has' : 'have';

  const weeklyTitle = isFriend
    ? `${weeklyCount} new ${weeklyCount === 1 ? 'trophy' : 'trophies'} for ${ownerFirstName ?? 'them'} this week`
    : `${weeklyCount} new ${weeklyCount === 1 ? 'trophy' : 'trophies'} this week`;
  const weeklySub = isFriend
    ? `Tap to see what ${subjPronoun} ${hasOrHave} unlocked`
    : 'Tap to see what you unlocked';
  const lifetimeSub = isFriend ? 'See them all' : 'See them all';

  return (
    <div style={{ padding: '0 20px 16px', fontFamily: FONT }}>
      <button
        type="button"
        onClick={() => openGamAchievements()}
        aria-label={
          weeklyCount > 0
            ? `Open trophies — ${weeklyCount} new ${weeklyCount === 1 ? 'unlock' : 'unlocks'} this week`
            : `Open trophies — ${lifetimeCount} earned`
        }
        style={{
          padding: '12px 14px',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer',
          width: '100%',
          fontFamily: FONT,
          textAlign: 'left',
          background: 'var(--hcp-bg-1)',
          border: '1px solid var(--hcp-line)',
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 11,
            background:
              weeklyCount > 0 ? 'rgba(247,147,30,0.18)' : 'rgba(247,147,30,0.12)',
            border:
              weeklyCount > 0
                ? '1px solid rgba(247,147,30,0.40)'
                : '1px solid rgba(247,147,30,0.28)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: '#FBBC2E',
          }}
        >
          <Trophy size={22} strokeWidth={2} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {weeklyCount > 0 ? (
            <>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#FBBC2E',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.2,
                }}
              >
                {weeklyTitle}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--hcp-t-100)', marginTop: 2 }}>
                {weeklySub}
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--hcp-t-100)',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.2,
                }}
              >
                <span style={{ color: '#FBBC2E', fontVariantNumeric: 'tabular-nums' }}>
                  {lifetimeCount}
                </span>{' '}
                {lifetimeCount === 1 ? 'trophy' : 'trophies'}{' '}
                {isFriend ? `in ${possessive.toLowerCase()} case` : 'in your case'}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--hcp-t-60)', marginTop: 2 }}>
                {lifetimeSub}
              </div>
            </>
          )}
        </div>

        <ChevronRight
          size={16}
          strokeWidth={2.4}
          color={weeklyCount > 0 ? '#FBBC2E' : 'rgba(251,188,46,0.6)'}
          style={{ flexShrink: 0 }}
        />
      </button>
    </div>
  );
};

export default TrophyRoomEntryRow;
