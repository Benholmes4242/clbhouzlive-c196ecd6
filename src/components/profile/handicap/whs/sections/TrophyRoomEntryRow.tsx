/**
 * TrophyRoomEntryRow -- "shelf preview" entry to the trophy room.
 * Shows the 3 most recently earned trophies as rarity-coloured
 * medallions. Renders a ghost shelf when the case is empty.
 * Used for both owner and friend view of /handicap/[:userId].
 */
import React from 'react';
import { Trophy, ChevronRight } from 'lucide-react';
import { openGamAchievements } from '../gam/events';
import { useUserAchievements } from '@/hooks/gam/useUserAchievements';
import { rarityColor } from '@/lib/gam/visuals';
import type { BadgeRarity } from '@/lib/gam/types';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface Props {
  userId: string;
  viewMode?: 'owner' | 'friend';
  ownerFirstName?: string | null;
}

const MED_SIZE = 34;
const MED_OVERLAP = -12;

const medBaseStyle = (z: number, first: boolean): React.CSSProperties => ({
  width: MED_SIZE,
  height: MED_SIZE,
  borderRadius: '50%',
  marginLeft: first ? 0 : MED_OVERLAP,
  zIndex: z,
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 1px 2px rgba(15,23,42,0.18)',
  boxSizing: 'border-box',
});

const Medallion: React.FC<{ rarity: BadgeRarity; z: number; first: boolean }> = ({
  rarity,
  z,
  first,
}) => {
  const color = rarityColor[rarity] || rarityColor.common;
  return (
    <div
      style={{
        ...medBaseStyle(z, first),
        background: `radial-gradient(circle at 30% 30%, ${color} 0%, ${color} 45%, #1a1f2b 100%)`,
        border: '2px solid var(--hcp-bg-1)',
      }}
    >
      <Trophy size={14} strokeWidth={2.2} color="#FFFFFF" />
    </div>
  );
};

const GhostMedallion: React.FC<{ z: number; first: boolean }> = ({ z, first }) => (
  <div
    style={{
      ...medBaseStyle(z, first),
      background: 'transparent',
      border: '1.5px dashed var(--hcp-line)',
      boxShadow: 'none',
    }}
  >
    <Trophy size={13} strokeWidth={1.8} color="var(--hcp-t-40, #94A3B8)" />
  </div>
);

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 13,
  width: '100%',
  textAlign: 'left',
  padding: '14px 16px',
  borderRadius: 16,
  background: 'var(--hcp-bg-1)',
  border: '1px solid var(--hcp-line)',
};

const titleStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 800,
  color: 'var(--hcp-t-100)',
  letterSpacing: '-0.01em',
  lineHeight: 1.2,
};

const subStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--hcp-t-60)',
  marginTop: 3,
};

const shelfStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
  paddingLeft: 6, // room for overlap so the first medallion sits comfortably
};

const trophyWord = (n: number) => (n === 1 ? 'trophy' : 'trophies');

const TrophyRoomEntryRow: React.FC<Props> = ({
  userId,
  viewMode = 'owner',
  ownerFirstName = null,
}) => {
  const { data: achievements } = useUserAchievements(userId);

  const { weeklyCount, lifetimeCount, recentRarities } = React.useMemo(() => {
    if (!achievements) {
      return { weeklyCount: 0, lifetimeCount: 0, recentRarities: [] as BadgeRarity[] };
    }
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const earned = achievements.filter((b) => b.is_earned);
    let weekly = 0;
    for (const b of earned) {
      if (b.earned_at && new Date(b.earned_at).getTime() > cutoff) weekly++;
    }
    const recent = earned
      .slice()
      .sort((a, b) => {
        const ta = a.earned_at ? new Date(a.earned_at).getTime() : 0;
        const tb = b.earned_at ? new Date(b.earned_at).getTime() : 0;
        return tb - ta;
      })
      .slice(0, 3)
      .map((b) => b.rarity as BadgeRarity);
    return { weeklyCount: weekly, lifetimeCount: earned.length, recentRarities: recent };
  }, [achievements]);

  // Wait for data before rendering anything (avoids empty-state flash)
  if (!achievements) return null;

  const isFriend = viewMode === 'friend';
  const name = ownerFirstName ?? 'them';
  const poss = ownerFirstName ? `${ownerFirstName}'s` : 'their';

  // ---- EMPTY STATE: ghost shelf ----
  if (lifetimeCount === 0) {
    const ghostShelf = (
      <div style={shelfStyle}>
        <GhostMedallion z={3} first={true} />
        <GhostMedallion z={2} first={false} />
        <GhostMedallion z={1} first={false} />
      </div>
    );

    if (isFriend) {
      return (
        <div style={{ padding: '0 20px 4px', fontFamily: FONT }}>
          <div style={rowStyle}>
            {ghostShelf}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={titleStyle}>
                {ownerFirstName
                  ? `${ownerFirstName} hasn't earned trophies yet`
                  : "They haven't earned trophies yet"}
              </div>
              <div style={subStyle}>Check back after their next round</div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={{ padding: '0 20px 4px', fontFamily: FONT }}>
        <button
          type="button"
          onClick={() => openGamAchievements()}
          aria-label="Open trophies -- browse what you can earn"
          style={{ ...rowStyle, cursor: 'pointer' }}
        >
          {ghostShelf}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={titleStyle}>Your case is waiting</div>
            <div style={subStyle}>Log a round to earn your first trophy</div>
          </div>
          <ChevronRight size={18} strokeWidth={2.4} color="#F7931E" style={{ flexShrink: 0 }} />
        </button>
      </div>
    );
  }

  // ---- FILLED STATE: shelf preview ----
  const title =
    weeklyCount > 0 ? (
      <>
        <span style={{ color: '#F7931E', fontVariantNumeric: 'tabular-nums' }}>{weeklyCount}</span>{' '}
        new {trophyWord(weeklyCount)}{isFriend ? ` for ${name}` : ''} this week
      </>
    ) : (
      <>
        <span style={{ color: '#F7931E', fontVariantNumeric: 'tabular-nums' }}>{lifetimeCount}</span>{' '}
        {trophyWord(lifetimeCount)} in {isFriend ? `${poss} case` : 'your case'}
      </>
    );

  const sub =
    weeklyCount > 0
      ? isFriend
        ? `Tap to see what ${name} unlocked`
        : 'Tap to see what you unlocked'
      : 'See them all';

  return (
    <div style={{ padding: '0 20px 4px', fontFamily: FONT }}>
      <button
        type="button"
        onClick={() => openGamAchievements()}
        aria-label={
          weeklyCount > 0
            ? `Open trophies -- ${weeklyCount} new ${weeklyCount === 1 ? 'unlock' : 'unlocks'} this week`
            : `Open trophies -- ${lifetimeCount} earned`
        }
        style={{ ...rowStyle, cursor: 'pointer' }}
      >
        <div style={shelfStyle}>
          {recentRarities.map((r, i) => (
            <Medallion
              key={i}
              rarity={r}
              z={recentRarities.length - i}
              first={i === 0}
            />
          ))}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={titleStyle}>{title}</div>
          <div style={subStyle}>{sub}</div>
        </div>
        <ChevronRight size={18} strokeWidth={2.4} color="#F7931E" style={{ flexShrink: 0 }} />
      </button>
    </div>
  );
};

export default TrophyRoomEntryRow;
