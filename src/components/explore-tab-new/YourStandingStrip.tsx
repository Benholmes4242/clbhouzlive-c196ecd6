import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { useUserAchievements } from '@/hooks/gam/useUserAchievements';
import { useUserTopLegends } from '@/hooks/gam/useUserTopLegends';
import { useMyStreaks } from '@/hooks/gam/useMyStreaks';
import {
  normalizeBadge,
  normalizeLegend,
} from '@/components/profile/handicap/whs/gam/trophy-room/_shared/normalizeTrophyItem';
import {
  medalsOwned,
  levelForMedals,
  nextLevelForMedals,
  WALL_LEVELS,
} from '@/components/profile/handicap/whs/gam/trophy-room/_shared/levels';
import { openGamAchievements } from '@/components/profile/handicap/whs/gam/events';

import { FONT } from './gamingLightTokens';

interface Props {
  userId: string | undefined;
}

const INK = '#0F172A';
const MUTE = 'rgba(15,23,42,0.55)';
const AMBER = '#F7931E';
const AMBER_DEEP = '#B45309';
const HAIRLINE = 'rgba(15,23,42,0.08)';

interface CrownRow {
  challenger_user_id: string | null;
  gap: number | null;
}

function useCrownsHeld(userId: string | undefined) {
  return useQuery({
    queryKey: ['discover', 'crowns-held', userId ?? 'anon'],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_under_threat', {
        p_user_id: userId,
        p_limit: 200,
      });
      if (error) throw error;
      return (data ?? []) as CrownRow[];
    },
  });
}

function scrollToDefendRail() {
  const el = document.getElementById('discover-defend-rail');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function YourStandingStrip({ userId }: Props) {
  const navigate = useNavigate();
  const { data: crowns } = useCrownsHeld(userId);
  const { data: badges = [] } = useUserAchievements(userId);
  const { data: legends = [] } = useUserTopLegends(userId, { limit: 500, maxRank: 1 });
  const { data: streaks = [] } = useMyStreaks(!!userId);

  const medals = useMemo(() => {
    const a = badges.map(normalizeBadge);
    const l = legends.map(normalizeLegend);
    return medalsOwned([...a, ...l]);
  }, [badges, legends]);

  const currentLevel = medals > 0 ? levelForMedals(medals) ?? WALL_LEVELS[0] : null;
  const nextLevel = nextLevelForMedals(medals);
  const medalsToNext = nextLevel ? Math.max(0, nextLevel.medalsRequired - medals) : 0;

  const primaryStreak = useMemo(
    () => streaks.find((s) => s.streak_type === 'round_played') ?? null,
    [streaks],
  );
  const streakCount = primaryStreak?.current_count ?? 0;

  const crownCount = crowns?.length ?? 0;

  // Hide when signed-out or nothing to say (no crowns, no tier, no streak)
  if (!userId) return null;
  if (crownCount === 0 && !currentLevel && streakCount === 0) return null;

  const openTrophyRoom = () => {
    navigate('/handicap');
    setTimeout(() => openGamAchievements(), 0);
  };

  return (
    <div
      style={{
        padding: '10px 14px 8px',
        borderBottom: `0.5px solid ${HAIRLINE}`,
        display: 'flex',
        alignItems: 'stretch',
        gap: 0,
        fontFamily: FONT,
        background: 'transparent',
      }}
    >
      <StandingCell
        icon="👑"
        value={crownCount > 0 ? String(crownCount) : '—'}
        label={crownCount === 1 ? 'crown held' : 'crowns held'}
        onClick={crownCount > 0 ? scrollToDefendRail : undefined}
        emphasize={crownCount > 0}
      />
      <Divider />
      <StandingCell
        icon="🏆"
        value={currentLevel ? currentLevel.label : 'Unranked'}
        label={
          nextLevel
            ? `${medalsToNext} medal${medalsToNext === 1 ? '' : 's'} to ${nextLevel.label}`
            : currentLevel
              ? 'Top of the ladder'
              : 'Earn your first medal'
        }
        onClick={openTrophyRoom}
        valueSize={12}
        emphasize={!!currentLevel}
        wide
      />
      <Divider />
      <StandingCell
        icon="🔥"
        value={streakCount > 0 ? String(streakCount) : '—'}
        label={streakCount === 1 ? 'week streak' : 'week streak'}
        onClick={() => navigate('/handicap')}
        emphasize={streakCount > 0}
      />
    </div>
  );
}

function Divider() {
  return (
    <div
      aria-hidden
      style={{
        width: 1,
        margin: '4px 2px',
        background: HAIRLINE,
        flexShrink: 0,
      }}
    />
  );
}

function StandingCell({
  icon,
  value,
  label,
  onClick,
  valueSize = 15,
  emphasize,
  wide,
}: {
  icon: string;
  value: string;
  label: string;
  onClick?: () => void;
  valueSize?: number;
  emphasize?: boolean;
  wide?: boolean;
}) {
  const disabled = !onClick;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: wide ? 1.4 : 1,
        minWidth: 0,
        background: 'transparent',
        border: 'none',
        padding: '4px 8px',
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: FONT,
        color: INK,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        opacity: emphasize ? 1 : 0.65,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, minWidth: 0, maxWidth: '100%' }}>
        <span aria-hidden style={{ fontSize: 13, lineHeight: 1 }}>
          {icon}
        </span>
        <span
          className="tabular-nums"
          style={{
            fontSize: valueSize,
            fontWeight: 800,
            color: emphasize ? INK : MUTE,
            letterSpacing: '-0.01em',
            lineHeight: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%',
          }}
        >
          {value}
        </span>
      </div>
      <div
        style={{
          fontSize: 9.5,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: emphasize ? AMBER_DEEP : MUTE,
          lineHeight: 1.1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%',
        }}
      >
        {label}
      </div>
    </button>
  );
}

// keep AMBER imported so tokens ride together even when unused visually
void AMBER;

export default YourStandingStrip;
