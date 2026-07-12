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
import type { BadgeRarity } from '@/lib/gam/types';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface Props {
  userId: string;
  viewMode?: 'owner' | 'friend';
  ownerFirstName?: string | null;
}

const MED_W = 32;
const MED_H = 34;
const MED_RADIUS = '34%';
const MED_OVERLAP = -9;

/** Squircle chip tints derived from rarityColor -- precomputed rgba
 *  stops (wash top, wash bottom, border, glyph). Common is dimmer by
 *  design. If rarityColor ever changes, update these to match. */
const CHIP_TINTS: Record<BadgeRarity, { top: string; bottom: string; border: string; glyph: string }> = {
  common: {
    top: 'rgba(148,163,184,0.16)',
    bottom: 'rgba(148,163,184,0.06)',
    border: 'rgba(148,163,184,0.35)',
    glyph: 'rgba(148,163,184,0.85)',
  },
  uncommon: {
    top: 'rgba(59,130,246,0.26)',
    bottom: 'rgba(59,130,246,0.10)',
    border: 'rgba(59,130,246,0.55)',
    glyph: '#3B82F6',
  },
  rare: {
    top: 'rgba(247,147,30,0.26)',
    bottom: 'rgba(247,147,30,0.10)',
    border: 'rgba(247,147,30,0.55)',
    glyph: '#F7931E',
  },
  epic: {
    top: 'rgba(168,85,247,0.26)',
    bottom: 'rgba(168,85,247,0.10)',
    border: 'rgba(168,85,247,0.55)',
    glyph: '#A855F7',
  },
  legendary: {
    top: 'rgba(251,188,46,0.26)',
    bottom: 'rgba(251,188,46,0.10)',
    border: 'rgba(251,188,46,0.55)',
    glyph: '#FBBC2E',
  },
};

const chipBaseStyle = (z: number, first: boolean): React.CSSProperties => ({
  width: MED_W,
  height: MED_H,
  borderRadius: MED_RADIUS,
  marginLeft: first ? 0 : MED_OVERLAP,
  zIndex: z,
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxSizing: 'border-box',
  // 2px bg-coloured ring creates clean separation between overlapping chips (box-shadow is radius-safe)
  boxShadow: '0 0 0 2px var(--hcp-bg-1)',
});

const Medallion: React.FC<{ rarity: BadgeRarity; z: number; first: boolean }> = ({
  rarity,
  z,
  first,
}) => {
  const t = CHIP_TINTS[rarity] ?? CHIP_TINTS.common;
  return (
    <div
      style={{
        ...chipBaseStyle(z, first),
        background: `linear-gradient(160deg, ${t.top} 0%, ${t.bottom} 100%), var(--hcp-bg-1)`,
        border: `1px solid ${t.border}`,
      }}
    >
      <Trophy size={14} strokeWidth={2.2} color={t.glyph} />
    </div>
  );
};

const GhostMedallion: React.FC<{ z: number; first: boolean }> = ({ z, first }) => (
  <div
    style={{
      ...chipBaseStyle(z, first),
      background: 'transparent',
      border: '1.5px dashed var(--hcp-line)',
    }}
  >
    <Trophy size={13} strokeWidth={1.8} color="var(--hcp-t-40, #94A3B8)" />
  </div>
);

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  width: '100%',
  textAlign: 'left',
  padding: '12px 16px',
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
        <div style={{ padding: '0 16px 4px', fontFamily: FONT }}>
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
      <div style={{ padding: '0 16px 4px', fontFamily: FONT }}>
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
    <div style={{ padding: '0 16px 4px', fontFamily: FONT }}>
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
