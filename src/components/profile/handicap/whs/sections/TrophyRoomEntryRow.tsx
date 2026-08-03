/**
 * TrophyRoomEntryRow - a single quiet row that states the trophy count and
 * opens the trophy room.
 *
 * On the handicap surface the achievements entry point is AchievementsPanel
 * (figures + recent unlocks). This row survives for the LIGHT profile card,
 * where there is no room for a panel and only the count plus the way in is
 * wanted.
 */
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useUserAchievements } from '@/hooks/gam/useUserAchievements';
import { openGamAchievements } from '../gam/events';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

const THEME = {
  dark: {
    ink: '#FFFFFF',
    mute: 'rgba(255,255,255,0.62)',
    line: 'rgba(255,255,255,0.07)',
    panel: '#151A21',
  },
  light: {
    ink: '#0F172A',
    mute: '#64748B',
    line: 'rgba(15,23,42,0.08)',
    panel: '#FFFFFF',
  },
} as const;

interface Props {
  userId: string;
  viewMode?: 'owner' | 'friend';
  ownerFirstName?: string | null;
  variant?: 'dark' | 'light';
  onOpen?: () => void;
}

export const TrophyRoomEntryRow: React.FC<Props> = ({
  userId,
  viewMode = 'owner',
  ownerFirstName = null,
  variant = 'dark',
  onOpen,
}) => {
  const { data: achievements } = useUserAchievements(userId);
  const t = THEME[variant];

  const earned = React.useMemo(
    () => (achievements ?? []).filter((b) => b.is_earned).length,
    [achievements],
  );

  const label =
    viewMode === 'friend'
      ? ownerFirstName
        ? `${ownerFirstName}'s trophies`
        : 'Their trophies'
      : 'Trophies';

  return (
    <button
      type="button"
      onClick={() => (onOpen ? onOpen() : openGamAchievements())}
      aria-label="Open the trophy room"
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '12px 14px',
        background: t.panel,
        border: `1px solid ${t.line}`,
        borderRadius: 14,
        fontFamily: FONT,
        cursor: 'pointer',
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.13em',
          textTransform: 'uppercase',
          color: t.mute,
        }}
      >
        {label}
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <span
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: t.ink,
            letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {earned}
        </span>
        <ChevronRight size={15} strokeWidth={2.4} color={t.mute} />
      </span>
    </button>
  );
};

export default TrophyRoomEntryRow;
