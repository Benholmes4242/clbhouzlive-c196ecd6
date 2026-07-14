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
import { MATERIAL_HEX } from '@/components/profile/handicap/whs/gam/trophy-room/_shared/rarityPalette';
import { openGamAchievements } from '@/components/profile/handicap/whs/gam/events';

import { GOLD, SCOREBOARD_BG, FONT } from './gamingLightTokens';

const OBSIDIAN_EDGE = '#D4A017';

interface Props {
  userId: string | undefined;
}

function materialColor(m: WallMaterial): string {
  if (m === 'obsidian') return '#2A2F36';
  return (MATERIAL_HEX as Record<string, string>)[m] ?? '#C97B4A';
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

function Gem({ material, size = 62 }: { material: WallMaterial; size?: number }) {
  const c = materialColor(material);
  const isObsidian = material === 'obsidian';
  return (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: 16,
        background: isObsidian
          ? `radial-gradient(120% 90% at 20% 0%, ${OBSIDIAN_EDGE}55 0%, transparent 55%), linear-gradient(160deg, #12151C 0%, #07080C 100%)`
          : `radial-gradient(120% 90% at 20% 0%, ${c}55 0%, transparent 55%), linear-gradient(160deg, ${c} 0%, ${c}33 100%)`,
        border: `1px solid ${isObsidian ? OBSIDIAN_EDGE + '59' : c + '59'}`,
        boxShadow: `0 0 28px ${isObsidian ? OBSIDIAN_EDGE : c}2E, inset 0 1px 0 rgba(255,255,255,0.12)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Gem glyph -- the six-sided facet shape used across the Trophy Room */}
      <div
        style={{
          width: size * 0.5,
          height: size * 0.58,
          background: isObsidian
            ? `linear-gradient(135deg, ${OBSIDIAN_EDGE}, ${OBSIDIAN_EDGE}55 55%, ${OBSIDIAN_EDGE}CC)`
            : `linear-gradient(135deg, ${c}, ${c}55 55%, ${c}CC)`,
          clipPath:
            'polygon(50% 0, 100% 28%, 100% 72%, 50% 100%, 0 72%, 0 28%)',
          boxShadow: `0 0 12px ${isObsidian ? OBSIDIAN_EDGE : c}88`,
        }}
      />
    </div>
  );
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
  const showBootstrap = isSignedOut || medals === 0;

  const currentLevel = showBootstrap
    ? WALL_LEVELS[0]
    : levelForMedals(medals) ?? WALL_LEVELS[0];
  const nextLevel = showBootstrap
    ? WALL_LEVELS[1]
    : nextLevelForMedals(medals);

  // progress % across the current segment
  const floor = currentLevel.medalsRequired;
  const ceiling = nextLevel?.medalsRequired ?? currentLevel.medalsRequired;
  const span = Math.max(1, ceiling - floor);
  const raw = showBootstrap ? 0.04 : (medals - floor) / span;
  const barPct = Math.max(4, Math.min(100, Math.round(raw * 100)));

  const displayName =
    profile?.display_name ?? profile?.username ?? 'Golfer';
  const hcp = profile?.eg_handicap_index ?? null;
  const hasHcp = !!connection && hcp != null;

  const noteText = showBootstrap
    ? 'Play a verified round to start the climb'
    : nextLevel
      ? `${Math.max(0, nextLevel.medalsRequired - medals)} medals to ${nextLevel.label} · earn medals from verified rounds`
      : 'Top of the ladder · Obsidian II';

  const line1 = showBootstrap
    ? currentLevel.label
    : globalRank != null
      ? `${currentLevel.label} · #${globalRank} worldwide`
      : currentLevel.label;

  const onOpen = () => {
    // Trophy Room is a sheet triggered from profile; fall back to /profile.
    try {
      openTrophyRoom();
    } catch {
      navigate('/profile');
    }
  };

  return (
    <div style={{ padding: `12px 16px 0` }}>
      <button
        type="button"
        onClick={onOpen}
        className="w-full text-left active:scale-[0.995] transition-transform"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: 16,
          borderRadius: 18,
          background: SCOREBOARD_BG,
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          fontFamily: FONT,
        }}
      >
        <Gem material={currentLevel.material} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 17,
              fontWeight: 900,
              color: GOLD,
              letterSpacing: '-0.01em',
              lineHeight: 1.15,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {line1}
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {displayName}
            {hasHcp ? ` · WHS ${hcp?.toFixed(1)}` : ''}
          </div>
          {/* progress bar */}
          <div
            style={{
              marginTop: 10,
              height: 6,
              borderRadius: 3,
              background: 'rgba(255,255,255,0.1)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${barPct}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #E8800C, #FFCB45)',
                borderRadius: 3,
              }}
            />
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 9.5,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.45)',
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {noteText}
          </div>
        </div>
      </button>
    </div>
  );
}

export default RankIdentityCard;
