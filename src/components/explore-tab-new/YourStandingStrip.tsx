import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useWhsConnection } from '@/lib/whs/hooks';
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

import { quarterOf, daysLeft, seasonName } from '@/lib/gam/seasonClock';
import { useViewerHemisphere } from '@/hooks/gam/useViewerHemisphere';
import { resolveDisplayHandicap } from '@/lib/handicap/resolveHandicap';
import { formatHcp } from '@/lib/formatHcp';

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

export function useCrownsHeld(userId: string | undefined) {
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
  if (!el) return;
  // scroll-margin-top on the section handles the sticky header offset.
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


export function YourStandingStrip({ userId }: Props) {
  const navigate = useNavigate();
  const { data: crowns, isLoading: crownsLoading } = useCrownsHeld(userId);
  const { data: profile, isLoading: profileLoading } = useUserProfile(userId);
  const { data: connection, isLoading: connLoading } = useWhsConnection(userId);
  const { data: badges = [], isLoading: badgesLoading } = useUserAchievements(userId);
  const { data: legends = [], isLoading: legendsLoading } = useUserTopLegends(userId, { limit: 500, maxRank: 1 });
  const { data: streaks = [] } = useMyStreaks(!!userId);
  const hemi = useViewerHemisphere();

  const isLoading = crownsLoading || profileLoading || connLoading || badgesLoading || legendsLoading;


  const medals = useMemo(() => {
    const a = badges.map(normalizeBadge);
    const l = legends.map(normalizeLegend);
    return medalsOwned([...a, ...l]);
  }, [badges, legends]);

  const hasMedals = medals > 0;
  const currentLevel = hasMedals ? levelForMedals(medals) ?? WALL_LEVELS[0] : null;
  const nextLevel = nextLevelForMedals(medals);
  const medalsToNext = nextLevel ? Math.max(0, nextLevel.medalsRequired - medals) : 0;

  // Progress bar (from old identity band)
  const floor = currentLevel?.medalsRequired ?? 0;
  const ceiling = nextLevel?.medalsRequired ?? floor;
  const span = Math.max(1, ceiling - floor);
  const raw = hasMedals ? (medals - floor) / span : 0.04;
  const barPct = nextLevel ? Math.max(4, Math.min(100, Math.round(raw * 100))) : 100;

  const profileWithHcp = profile as
    | (typeof profile & {
        eg_handicap_index?: number | null;
        manual_handicap_index?: number | null;
      })
    | null
    | undefined;
  const resolvedHcp = resolveDisplayHandicap({
    egHandicapIndex: profileWithHcp?.eg_handicap_index ?? null,
    manualHandicapIndex: profileWithHcp?.manual_handicap_index ?? null,
    hasWhsConnection: !!connection,
  });
  const hcpValue = resolvedHcp.value;
  const hasHcp = hcpValue != null;

  const primaryStreak = useMemo(
    () => streaks.find((s) => s.streak_type === 'round_played') ?? null,
    [streaks],
  );
  const streakCount = primaryStreak?.current_count ?? 0;
  const showStreak = streakCount > 0;

  const crownCount = crowns?.length ?? 0;

  // Hide when signed-out or nothing meaningful to show
  if (!userId) return null;
  if (crownCount === 0 && !currentLevel && !hasHcp && !showStreak) return null;

  const openTrophyRoom = () => {
    // Use the existing ?gam=trophies deep-link pattern in HandicapPage
    // (see src/pages/HandicapPage.tsx). It opens the sheet once on arrival
    // then strips the param, so back-nav / revisits do not re-open.
    navigate('/handicap?gam=trophies');
  };
  const openHandicap = () => navigate('/handicap');


  // Season ribbon
  const now = new Date();
  const { quarter } = quarterOf(now);
  const seasonLabel = seasonName(quarter, hemi);
  const daysRemaining = daysLeft(now);

  const tierValue = currentLevel ? currentLevel.label : 'Unranked';
  const tierSub = nextLevel
    ? `${medalsToNext} medal${medalsToNext === 1 ? '' : 's'} to ${nextLevel.label}`
    : currentLevel
      ? 'Top of the ladder'
      : 'Earn your first medal';

  return (
    <div
      style={{
        padding: '10px 14px 8px',
        borderBottom: `0.5px solid ${HAIRLINE}`,
        fontFamily: FONT,
        background: 'transparent',
      }}
    >
      {/* Trio */}
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
        <StandingCell
          icon="👑"
          value={crownCount > 0 ? String(crownCount) : '0'}
          label={crownCount === 1 ? 'crown held' : 'crowns held'}
          onClick={
            isLoading || crownCount === 0
              ? undefined
              : () => navigate('/handicap?gam=trophies&section=crowns')
          }
          emphasize={crownCount > 0}
        />

        <Divider />
        <StandingCell
          icon="🏆"
          value={tierValue}
          label={tierSub}
          onClick={isLoading ? undefined : openTrophyRoom}
          valueSize={12}
          emphasize={!!currentLevel}
          wide
          progressPct={nextLevel ? barPct : undefined}
        />
        <Divider />
        <StandingCell
          value={hasHcp ? formatHcp(hcpValue) : '—'}
          label="HCP"
          onClick={isLoading ? undefined : openHandicap}
          emphasize={hasHcp}
        />
      </div>


      {/* Season ribbon */}
      <div
        style={{
          marginTop: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 9.5,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: AMBER,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minWidth: 0,
          }}
        >
          {seasonLabel} · Official WHS
        </span>
        <span
          className="tabular-nums"
          style={{
            fontSize: 9.5,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'rgba(15,23,42,0.45)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {daysRemaining} days left
        </span>
      </div>
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
  progressPct,
}: {
  icon?: string;
  value: string;
  label: string;
  onClick?: () => void;
  valueSize?: number;
  emphasize?: boolean;
  wide?: boolean;
  progressPct?: number;
}) {
  const disabled = !onClick;
  const [pressed, setPressed] = useState(false);
  const clearPress = () => setPressed(false);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onPointerDown={disabled ? undefined : () => setPressed(true)}
      onPointerUp={clearPress}
      onPointerLeave={clearPress}
      onPointerCancel={clearPress}
      style={{
        flex: wide ? 1.6 : 1,
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
        opacity: emphasize ? (pressed ? 0.7 : 1) : 0.65,
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        transition: 'transform 120ms ease, opacity 120ms ease',
        WebkitTapHighlightColor: 'transparent',
      }}
    >

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, minWidth: 0, maxWidth: '100%' }}>
        {icon ? (
          <span aria-hidden style={{ fontSize: 13, lineHeight: 1 }}>
            {icon}
          </span>
        ) : null}
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
      {progressPct !== undefined ? (
        <div
          aria-hidden
          style={{
            marginTop: 3,
            width: '78%',
            maxWidth: 140,
            height: 2,
            borderRadius: 999,
            background: 'rgba(15,23,42,0.08)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progressPct}%`,
              height: '100%',
              background: AMBER,
              borderRadius: 999,
            }}
          />
        </div>
      ) : null}
    </button>
  );
}

export default YourStandingStrip;
