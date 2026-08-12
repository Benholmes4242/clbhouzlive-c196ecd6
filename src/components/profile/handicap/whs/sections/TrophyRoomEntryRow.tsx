/**
 * TrophyRoomEntryRow - a single quiet row that states the trophy count and
 * opens the trophy room.
 *
 * On the handicap surface the achievements entry point is AchievementsPanel
 * (figures + recent unlocks). This row survives for the LIGHT profile card,
 * where there is no room for a panel and only the count plus the way in is
 * wanted.
 *
 * BRIEF_PROFILE_PAGE A4 is amended in favour of this row: the profile card
 * keeps THIS row converted to light tokens, it does NOT get a figures row.
 *
 * Empty state is explicit - a member with no trophies gets a sentence, not a
 * bare 0. The weekly unlock count is derived from earned_at, which the badge
 * RPC already returns, so it costs no extra query.
 */
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUserAchievements } from '@/hooks/gam/useUserAchievements';
import { openGamAchievements } from '../gam/events';

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const THEME = {
  dark: {
    ink: '#FFFFFF',
    mute: 'rgba(255,255,255,0.62)',
    dim: 'rgba(255,255,255,0.40)',
    line: 'rgba(255,255,255,0.07)',
    panel: '#151A21',
  },
  light: {
    ink: '#0F172A',
    mute: '#64748B',
    dim: '#94A3B8',
    line: 'rgba(15,23,42,0.08)',
    panel: '#FFFFFF',
  },
} as const;

const LABEL = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.13em',
  textTransform: 'uppercase' as const,
};

const WEEK_MS = 7 * 86_400_000;

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
  const { t } = useTranslation('common');
  const { data: achievements } = useUserAchievements(userId);
  const t_ = THEME[variant];

  const earned = React.useMemo(
    () => (achievements ?? []).filter((b) => b.is_earned).length,
    [achievements],
  );

  /** Cheap: earned_at already rides on every badge row. */
  const newThisWeek = React.useMemo(() => {
    const cutoff = Date.now() - WEEK_MS;
    return (achievements ?? []).filter(
      (b) => b.is_earned && b.earned_at && new Date(b.earned_at).getTime() >= cutoff,
    ).length;
  }, [achievements]);

  const isFriend = viewMode === 'friend';

  const label = isFriend
    ? ownerFirstName
      ? t('handicap.trophies.labelOwned', { name: ownerFirstName })
      : t('handicap.trophies.labelOwnedUnknown')
    : t('handicap.trophies.label');

  const emptyCopy = isFriend
    ? ownerFirstName
      ? t('handicap.trophies.emptyFriend', { name: ownerFirstName })
      : t('handicap.trophies.emptyFriendUnknown')
    : t('handicap.trophies.emptyOwner');

  const isEmpty = earned === 0;

  return (
    <button
      type="button"
      onClick={() => (onOpen ? onOpen() : openGamAchievements())}
      aria-label={t('handicap.trophies.open')}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '12px 14px',
        background: t_.panel,
        border: `1px solid ${t_.line}`,
        borderRadius: 14,
        fontFamily: FONT,
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ ...LABEL, color: t_.mute }}>{label}</span>
        {isEmpty && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: t_.mute,
              letterSpacing: '-0.01em',
              lineHeight: 1.3,
              textTransform: 'none',
            }}
          >
            {emptyCopy}
          </span>
        )}
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {!isEmpty && newThisWeek > 0 && (
          <span style={{ ...LABEL, color: t_.dim, whiteSpace: 'nowrap' }}>
            {t('handicap.trophies.newThisWeek', { count: newThisWeek })}
          </span>
        )}
        {!isEmpty && (
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: t_.ink,
              letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums lining',
            }}
          >
            {earned}
          </span>
        )}
        <ChevronRight size={15} strokeWidth={2.4} color={t_.mute} />
      </span>
    </button>
  );
};

export default TrophyRoomEntryRow;
