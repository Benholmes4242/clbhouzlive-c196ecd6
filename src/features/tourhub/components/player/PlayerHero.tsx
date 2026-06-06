/**
 * PlayerHero — canonical light-surface masthead (Tour Hub Overview alignment).
 *
 * Pattern mirror: Players HeroChampion / Leaders champion card / College Franchise.
 *   1. §2 section header (UserCircle eyebrow + h1 + subhead)
 *   2. Player champion card: caption row + body row (squircle photo + name/flag + hero stat)
 *
 * State-aware via usePlayerState; hero stat label and caption metadata derive
 * from the same state machine.
 */

import { Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle, ChevronRight, Crown } from 'lucide-react';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import { titleCaseCountry } from '../../utils/countryFlags';
import CountryFlag from '@/components/ui/country-flag';
import type { TourPlayer, TourPlayerStatistics } from '../../hooks/useTourHubData';
import { usePlayerState } from '../../hooks/usePlayerState';


import {
  AMBER,
  GOLD,
  GOLD_DEEP,
  INK,
  INK_MUTE,
  SLATE_100,
  SLATE_50,
  SURFACE,
} from '../../_shared/tokens';

interface PlayerHeroProps {
  player: TourPlayer;
  playerStats: TourPlayerStatistics | null;
}

/**
 * Format earnings number as compact currency string ($6.7M / $850K).
 */
function formatEarnings(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${value}`;
}

export function PlayerHero({ player, playerStats }: PlayerHeroProps) {
  const navigate = useNavigate();
  const heroPhotoUrl = getPlayerHeadshotUrl(player.full_name, player.tour_codes?.[0] ?? 'pga');

  const age = player.birth_date
    ? Math.floor((Date.now() - new Date(player.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const countryDisplay = player.country ? titleCaseCountry(player.country) : null;
  const worldRank = playerStats?.world_rank && playerStats.world_rank > 0
    ? playerStats.world_rank
    : null;

  const playerState = usePlayerState(player.id);
  const isLive = playerState.state === 'live' && !!playerState.liveData;
  const liveText = isLive
    ? `${playerState.liveData!.scoreText}${playerState.liveData!.currentRound ? ` · R${playerState.liveData!.currentRound}` : ''}`
    : null;

  // Caption row composition — two stable identifiers only.
  const captionMetadata: string[] = (() => {
    const items: string[] = [];
    items.push(worldRank ? `WORLD #${worldRank}` : 'PLAYER');
    if (age) items.push(`AGE ${age}`);
    return items;
  })();

  return (
    <div
      style={{
        position: 'relative',
        background: SLATE_50,
        padding: '10px 0 14px',
      }}
    >
      {/* Section header (canonical §2) — eyebrow only */}
      <div style={{ padding: '0 16px 8px' }}>
        <button
          type="button"
          onClick={() => navigate('/tourhub?tab=players', { replace: true })}
          aria-label="Player Profile — open Players"
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <UserCircle size={13} strokeWidth={2.5} color={AMBER} />
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: AMBER,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            PLAYER
          </span>
          <ChevronRight size={11} strokeWidth={2.5} color={AMBER} />
        </button>
      </div>

      {/* Player champion card */}
      <div style={{ padding: '0 16px' }}>
        {/* Caption row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            marginBottom: 10,
            flexWrap: 'wrap',
          }}
        >
          <Crown size={13} strokeWidth={2.5} fill={GOLD} color={GOLD_DEEP} />
          {captionMetadata.map((part, i) => (
            <Fragment key={i}>
              {i > 0 && (
                <span style={{ fontSize: 9, fontWeight: 800, color: INK_MUTE, letterSpacing: '0.16em' }}>·</span>
              )}
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: i === 0 ? INK : INK_MUTE,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                }}
              >
                {part}
              </span>
            </Fragment>
          ))}
        </div>

        {/* Body row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Photo + position badge */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div
              style={{
                width: 84,
                height: 84,
                borderRadius: '34%',
                overflow: 'hidden',
                background: SLATE_100,
                border: `2.5px solid ${GOLD}`,
                boxShadow: '0 4px 12px rgba(255,184,0,0.20)',
              }}
            >
              <img
                src={heroPhotoUrl}
                alt={player.full_name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 5%' }}
                onError={e => { (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL; }}
              />
            </div>

            {/* Position badge — gated: worldRank && worldRank <= 99 (Q2 decision) */}
            {worldRank && worldRank <= 99 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: -4,
                  right: -4,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: GOLD,
                  border: `2.5px solid ${SURFACE}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 800,
                  color: INK,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {worldRank}
              </div>
            )}
          </div>

          {/* Info: name + flag left, big stat right */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 25,
                  fontWeight: 800,
                  color: INK,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.05,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {player.full_name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
                <CountryFlag country={player.country_code || player.country} size="sm" />
                {countryDisplay && (
                  <span style={{ fontSize: 12, fontWeight: 600, color: INK_MUTE }}>{countryDisplay}</span>
                )}
              </div>
            </div>

            <div style={{ flexShrink: 0, textAlign: 'right' as const }}>
              <div
                style={{
                  fontSize: 30,
                  fontWeight: 800,
                  color: INK,
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                  whiteSpace: 'nowrap',
                }}
              >
                {heroStatInteger}
                {heroStatDecimal && <span style={{ color: AMBER }}>{heroStatDecimal}</span>}
                {heroStatSuffix}
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 9,
                  fontWeight: 800,
                  color: INK_MUTE,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                }}
              >
                {heroStatLabel}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
