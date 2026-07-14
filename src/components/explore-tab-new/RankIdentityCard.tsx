import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useWhsConnection } from '@/lib/whs/hooks';
import { useUserAchievements } from '@/hooks/gam/useUserAchievements';
import { useUserTopLegends } from '@/hooks/gam/useUserTopLegends';
import {
  normalizeBadge,
  normalizeLegend,
} from '@/components/profile/handicap/whs/gam/trophy-room/_shared/normalizeTrophyItem';
import {
  medalsOwned,
  levelForMedals,
  nextLevelForMedals,
  WALL_LEVELS,
  type WallMaterial,
} from '@/components/profile/handicap/whs/gam/trophy-room/_shared/levels';
import { openGamAchievements } from '@/components/profile/handicap/whs/gam/events';
import { MATERIAL_HEX } from '@/components/profile/handicap/whs/gam/trophy-room/_shared/rarityPalette';

import { FONT } from './gamingLightTokens';

interface Props {
  userId: string | undefined;
}

// Global medal rank RPC is not yet in prod - feature-detect and omit the
// segment on error/absent (no zeros, no placeholders).
function useGlobalMedalRank(userId: string | undefined) {
  return useQuery<number | null>({
    queryKey: ['discover', 'global-medal-rank', userId],
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
    retry: false,
    queryFn: async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.rpc as any)(
          'get_global_medal_rank',
          { p_user_id: userId },
        );
        if (error) return null;
        if (data == null) return null;
        if (typeof data === 'number') return data;
        if (Array.isArray(data) && data[0]) {
          const first = data[0] as Record<string, unknown>;
          const val = first.rank ?? first.global_rank ?? first.medal_rank;
          return typeof val === 'number' ? val : null;
        }
        if (typeof data === 'object') {
          const rec = data as Record<string, unknown>;
          const val = rec.rank ?? rec.global_rank ?? rec.medal_rank;
          return typeof val === 'number' ? val : null;
        }
        return null;
      } catch {
        return null;
      }
    },
  });
}

// Complementary hue per tier for the second aurora blob. Picked to give
// each material a two-tone mesh that reads as ambient light, not a swatch:
//   bronze  -> cool cyan (warm/cool balance)
//   silver  -> muted slate-blue (keeps the neutral cool)
//   emerald -> teal/cyan (per brief)
//   diamond -> violet (icy blue + violet, aurora borealis)
//   obsidian-> forge gold (only accent that fits the black-glass treatment)
const TIER_SECONDARY: Record<WallMaterial, string> = {
  bronze: '#4AA8C9',
  silver: '#8FA6C4',
  emerald: '#0891B2',
  diamond: '#C084FC',
  obsidian: '#FBBC2E',
};

// Very dark tier-tinted base for the card body.
const TIER_BASE: Record<WallMaterial, string> = {
  bronze: '#120A06',
  silver: '#0A0C10',
  emerald: '#06120D',
  diamond: '#070E14',
  obsidian: '#07080C',
};

function splitLevelLabel(label: string, sub: 'I' | 'II'): { name: string; roman: string } {
  // Level 10 is "Clubhouse Legend" (no roman in label).
  const suffix = ` ${sub}`;
  if (label.endsWith(suffix)) {
    return { name: label.slice(0, -suffix.length), roman: sub };
  }
  return { name: label, roman: '' };
}

export function RankIdentityCard({ userId }: Props) {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const effectiveUserId = userId ?? user?.id;

  const { data: profile } = useUserProfile(effectiveUserId);
  const { data: connection } = useWhsConnection(effectiveUserId);
  const { data: badges = [] } = useUserAchievements(effectiveUserId);
  const { data: legends = [] } = useUserTopLegends(effectiveUserId, {
    limit: 500,
    maxRank: 1,
  });
  const { data: globalRank } = useGlobalMedalRank(effectiveUserId);

  const items = useMemo(() => {
    const a = badges.map(normalizeBadge);
    const l = legends.map(normalizeLegend);
    return [...a, ...l];
  }, [badges, legends]);
  const medals = medalsOwned(items);

  const isSignedOut = !effectiveUserId;
  const isSignedInUnsynced = !isSignedOut && !connection;
  const showBootstrap = isSignedOut || medals === 0;

  const currentLevel = showBootstrap
    ? WALL_LEVELS[0]
    : levelForMedals(medals) ?? WALL_LEVELS[0];
  const nextLevel = showBootstrap
    ? WALL_LEVELS[1]
    : nextLevelForMedals(medals);

  const floor = currentLevel.medalsRequired;
  const ceiling = nextLevel?.medalsRequired ?? currentLevel.medalsRequired;
  const span = Math.max(1, ceiling - floor);
  const raw = showBootstrap ? 0.04 : (medals - floor) / span;
  const barPct = Math.max(4, Math.min(100, Math.round(raw * 100)));

  const displayName =
    profile?.display_name ?? profile?.username ?? 'Golfer';
  const hcp = profile?.eg_handicap_index ?? null;
  const hasHcp = !!connection && hcp != null;

  const material = currentLevel.material;
  const tierHex = MATERIAL_HEX[material] ?? '#12B784';
  const tierSecondary = TIER_SECONDARY[material];
  const baseColor = TIER_BASE[material];

  const { name: tierName, roman: tierRoman } = splitLevelLabel(
    currentLevel.label,
    currentLevel.sub,
  );

  const medalsToNext = nextLevel
    ? Math.max(0, nextLevel.medalsRequired - medals)
    : 0;

  const onOpen = () => {
    if (isSignedInUnsynced) {
      navigate('/handicap');
      return;
    }
    navigate('/handicap');
    setTimeout(() => openGamAchievements(), 0);
  };

  return (
    <div style={{ padding: '12px 16px 0' }}>
      <button
        type="button"
        onClick={onOpen}
        className="w-full text-left active:scale-[0.995] transition-transform"
        style={{
          position: 'relative',
          overflow: 'hidden',
          display: 'block',
          padding: '18px 20px 17px',
          minHeight: 150,
          borderRadius: 20,
          background: baseColor,
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          fontFamily: FONT,
          boxShadow: '0 6px 22px rgba(0,0,0,0.3)',
        }}
      >
        {/* Aurora blob A -- tier hue, top-left */}
        <div
          className="rank-aurora-blob"
          aria-hidden
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-15%',
            width: '80%',
            height: '120%',
            background: `radial-gradient(circle, ${tierHex}88, transparent 60%)`,
            filter: 'blur(30px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        {/* Aurora blob B -- complementary hue, bottom-right, out of sync */}
        <div
          className="rank-aurora-blob"
          aria-hidden
          style={{
            position: 'absolute',
            bottom: '-25%',
            right: '-15%',
            width: '80%',
            height: '120%',
            background: `radial-gradient(circle, ${tierSecondary}88, transparent 60%)`,
            filter: 'blur(30px)',
            animationDelay: '-4s',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* Content sits above the blobs */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Eyebrow row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                letterSpacing: '0.12em',
                color: 'rgba(255,255,255,0.6)',
                textTransform: 'uppercase',
              }}
            >
              Your Standing
            </div>
            {globalRank != null && (
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  color: 'rgba(255,255,255,0.6)',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ color: '#fff', fontWeight: 800 }}>#{globalRank}</span>
                {' '}Worldwide
              </div>
            )}
          </div>

          {/* Tier line */}
          <div
            style={{
              marginTop: 10,
              display: 'flex',
              alignItems: 'baseline',
              gap: 8,
              lineHeight: 1.05,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }}
          >
            <span
              style={{
                fontSize: 30,
                fontWeight: 900,
                color: '#fff',
                letterSpacing: '-0.02em',
                textShadow: '0 2px 12px rgba(0,0,0,0.3)',
              }}
            >
              {isSignedInUnsynced ? 'Start the climb' : tierName}
            </span>
            {tierRoman && !isSignedInUnsynced && (
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: tierHex,
                  letterSpacing: '0.02em',
                  textShadow: '0 1px 6px rgba(0,0,0,0.35)',
                }}
              >
                {tierRoman}
              </span>
            )}
          </div>

          {/* Identity */}
          <div
            style={{
              marginTop: 6,
              fontSize: 11.5,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.72)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textShadow: '0 1px 6px rgba(0,0,0,0.3)',
            }}
          >
            {displayName}
            {hasHcp ? ` · WHS ${hcp?.toFixed(1)}` : ''}
          </div>

          {/* Progress bar */}
          <div
            style={{
              marginTop: 14,
              height: 5,
              borderRadius: 3,
              background: 'rgba(255,255,255,0.2)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${barPct}%`,
                height: '100%',
                background: '#fff',
                borderRadius: 3,
              }}
            />
          </div>

          {/* Progress caption */}
          <div
            style={{
              marginTop: 6,
              fontSize: 10.5,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }}
          >
            {isSignedInUnsynced ? (
              'Sync your WHS handicap to start earning medals'
            ) : showBootstrap ? (
              'Play a verified round to start the climb'
            ) : nextLevel ? (
              <>
                <span style={{ color: '#fff', fontWeight: 700 }}>{medalsToNext}</span>
                {' medals to '}{nextLevel.label}
              </>
            ) : (
              'Top of the ladder · Clubhouse Legend'
            )}
          </div>
        </div>
      </button>
    </div>
  );
}

export default RankIdentityCard;
