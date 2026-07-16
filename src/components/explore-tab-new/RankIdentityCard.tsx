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
  type TrophyItem,
} from '@/components/profile/handicap/whs/gam/trophy-room/_shared/normalizeTrophyItem';
import {
  medalsOwned,
  levelForMedals,
  nextLevelForMedals,
  WALL_LEVELS,
} from '@/components/profile/handicap/whs/gam/trophy-room/_shared/levels';
import { openGamAchievements } from '@/components/profile/handicap/whs/gam/events';
import { MATERIAL_HEX } from '@/components/profile/handicap/whs/gam/trophy-room/_shared/rarityPalette';
import { renderBadgeIcon } from '@/components/profile/handicap/whs/gam/badgeIcons';
import { formatHcp } from '@/lib/formatHcp';
import { relativeTime } from '@/utils/relativeTime';

import { FONT } from './gamingLightTokens';

interface Props {
  userId: string | undefined;
  /** 'card' renders the full ledger card (default). 'strip' renders the slim single-row Almanac identity strip. */
  variant?: 'card' | 'strip';
}


const INK = '#0F172A';
const AMBER = '#F7931E';
const GOLD = '#FBBC2E';
const HAIRLINE = 'rgba(15,23,42,0.08)';

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

interface ChipData {
  key: string;
  iconKey: string;
  label: string;
  sub: string;
  attainedAt: string;
}

function toChip(item: TrophyItem): ChipData | null {
  if (item.kind === 'achievement') {
    if (!item.earned || !item.earnedAt) return null;
    return {
      key: item.id,
      iconKey: item.iconKey,
      label: item.name,
      sub: item.description ?? '',
      attainedAt: item.earnedAt,
    };
  }
  if (!item.attainedAt) return null;
  return {
    key: item.id,
    iconKey: item.iconKey,
    label: item.name,
    sub: item.courseName ?? '',
    attainedAt: item.attainedAt,
  };
}

export function RankIdentityCard({ userId, variant = 'card' }: Props) {
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

  const recentChips = useMemo<ChipData[]>(() => {
    return items
      .map(toChip)
      .filter((c): c is ChipData => c !== null)
      .sort((a, b) => (a.attainedAt < b.attainedAt ? 1 : -1))
      .slice(0, 3);
  }, [items]);

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
  const barPct = nextLevel
    ? Math.max(4, Math.min(100, Math.round(raw * 100)))
    : 100;

  const displayName =
    profile?.display_name ?? profile?.username ?? 'Golfer';
  const hcp = profile?.eg_handicap_index ?? null;
  const hasHcp = !!connection && hcp != null;

  const material = currentLevel.material;
  const tierHex = MATERIAL_HEX[material] ?? '#12B784';

  const tierName = currentLevel.label.replace(/\s+(I|II)$/, '');

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
          display: 'block',
          padding: '16px 16px 14px',
          borderRadius: 18,
          background: '#FFFFFF',
          border: `0.5px solid ${HAIRLINE}`,
          boxShadow: '0 2px 14px rgba(15,23,42,0.06)',
          color: INK,
          cursor: 'pointer',
          fontFamily: FONT,
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 800,
              color: INK,
              letterSpacing: '-0.005em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
              flex: 1,
            }}
          >
            {displayName}
            {hasHcp && (
              <>
                {' '}
                <span style={{ color: AMBER, fontWeight: 800 }}>
                  {formatHcp(hcp)}
                </span>
              </>
            )}
          </div>
          {globalRank != null && (
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.08em',
                color: 'rgba(15,23,42,0.5)',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              #{globalRank} Worldwide
            </div>
          )}
        </div>

        {/* Hero row */}
        <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
          <div style={{ flexShrink: 0, minWidth: 56 }}>
            <div
              className="tabular-nums"
              style={{
                fontSize: 44,
                fontWeight: 900,
                letterSpacing: '-0.03em',
                color: INK,
                lineHeight: 1,
              }}
            >
              {medals}
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'rgba(15,23,42,0.45)',
              }}
            >
              Medals
            </div>
          </div>

          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              minWidth: 0,
            }}
          >
            {recentChips.length === 0 ? (
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'rgba(15,23,42,0.45)',
                  alignSelf: 'center',
                }}
              >
                Your first medal awaits.
              </div>
            ) : (
              recentChips.map((chip) => (
                <div
                  key={chip.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'rgba(251,188,46,0.08)',
                    border: '0.5px solid rgba(251,188,46,0.35)',
                    borderRadius: 10,
                    padding: '6px 9px',
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      flexShrink: 0,
                      color: AMBER,
                    }}
                  >
                    {renderBadgeIcon(chip.iconKey, 14, AMBER, 2)}
                  </span>
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 800,
                      color: INK,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {chip.label}
                  </span>
                  {chip.sub && (
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 600,
                        color: 'rgba(15,23,42,0.5)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      {chip.sub}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      color: 'rgba(15,23,42,0.35)',
                      flexShrink: 0,
                      marginLeft: 'auto',
                    }}
                  >
                    {relativeTime(chip.attainedAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Progress line */}
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: `0.5px solid ${HAIRLINE}`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              flexShrink: 0,
              border: '0.5px solid rgba(15,23,42,0.12)',
              borderRadius: 999,
              padding: '4px 10px 4px 7px',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: tierHex,
                boxShadow: `0 0 6px ${tierHex}66`,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                color: INK,
                whiteSpace: 'nowrap',
              }}
            >
              {tierName} {currentLevel.level}
            </span>
          </div>

          <div
            style={{
              flex: 1,
              height: 5,
              borderRadius: 999,
              background: 'rgba(15,23,42,0.07)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${barPct}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${AMBER}, ${GOLD})`,
                borderRadius: 999,
              }}
            />
          </div>

          <div
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: 'rgba(15,23,42,0.55)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {nextLevel ? (
              <>
                <span
                  style={{ color: AMBER, fontWeight: 800 }}
                  className="tabular-nums"
                >
                  {medalsToNext}
                </span>{' '}
                to {nextLevel.label}
              </>
            ) : (
              'Max level'
            )}
          </div>
        </div>
      </button>
    </div>
  );
}

export default RankIdentityCard;
