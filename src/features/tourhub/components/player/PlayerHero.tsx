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
import { truncateName } from '../../utils/truncateName';
import { splitStatValue } from '../../utils/splitStatValue';
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

/**
 * Pure helper — pick the single most relevant hero stat for the player.
 * Priority: live score > recent finish > season earnings > world rank > age.
 * Always returns something (never null).
 */
function chooseHeroStat(
  player: TourPlayer,
  playerStats: TourPlayerStatistics | null,
  playerState: ReturnType<typeof usePlayerState>,
): { primary: string } {
  // 1. Live tournament
  if (playerState.state === 'live' && playerState.liveData) {
    const ld = playerState.liveData;
    const round = ld.currentRound ? ` · R${ld.currentRound}` : '';
    return { primary: `${ld.scoreText}${round}` };
  }

  // 2. Recent finish (within 14 days, per usePlayerState window)
  // Big-stat slot is for SHORT scalar values only. Context already lives in
  // the caption row above, so we don't repeat it here — prevents overflow.
  if (playerState.state === 'recent' && playerState.recentData) {
    return { primary: playerState.recentData.label };
  }

  // 3. Season earnings
  if (playerStats?.earnings && playerStats.earnings > 0) {
    return { primary: `${formatEarnings(playerStats.earnings)} earned` };
  }

  // 4. World rank fallback
  if (playerStats?.world_rank && playerStats.world_rank > 0) {
    return { primary: `World #${playerStats.world_rank}` };
  }

  // 5. Age fallback
  if (player.birth_date) {
    const age = Math.floor(
      (Date.now() - new Date(player.birth_date).getTime()) /
        (365.25 * 24 * 60 * 60 * 1000),
    );
    if (age > 0) return { primary: `Age ${age}` };
  }

  return { primary: 'Player profile' };
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
  const heroStat = chooseHeroStat(player, playerStats, playerState);
  const { integer: heroStatInteger, decimal: heroStatDecimal, suffix: heroStatSuffix } = splitStatValue(heroStat.primary);

  // Stat label per state (Q3 decision).
  const heroStatLabel = (() => {
    switch (playerState.state) {
      case 'live': return 'LIVE SCORE';
      case 'recent': return 'LAST FINISH';
      case 'inform':
      case 'inactive':
        if (playerStats?.earnings && playerStats.earnings > 0) {
          return `EARNED ${new Date().getFullYear()}`;
        }
        if (worldRank) return 'WORLD RANKING';
        if (age) return 'AGE';
        return 'PROFILE';
    }
  })();

  // Caption row composition (3 items max).
  // Priority: WORLD #N (rank) → AGE NN → state-specific 3rd item.
  const captionMetadata: string[] = (() => {
    const items: string[] = [];

    items.push(worldRank ? `WORLD #${worldRank}` : 'PLAYER');

    if (age) items.push(`AGE ${age}`);

    switch (playerState.state) {
      case 'live': {
        const ld = playerState.liveData!;
        items.push(`LIVE · ${ld.scoreText} AT ${truncateName(ld.tournamentName, 18).toUpperCase()}`);
        break;
      }
      case 'recent': {
        const rd = playerState.recentData!;
        items.push(rd.context ? `${rd.label.toUpperCase()} · ${truncateName(rd.context, 18).toUpperCase()}` : rd.label.toUpperCase());
        break;
      }
      case 'inform': {
        items.push(`${playerState.eventsLast12mo} STARTS LAST 12 MO`);
        break;
      }
      case 'inactive': {
        items.push(`LAST PLAYED ${playerState.inactiveData!.lastEventLabel.toUpperCase()}`);
        break;
      }
    }

    return items.slice(0, 3);
  })();

  return (
    <div
      style={{
        position: 'relative',
        background: SLATE_50,
        padding: 'max(env(safe-area-inset-top, 0px), 47px) 0 14px',
      }}
    >
      {/* Section header (canonical §2) */}
      <div style={{ padding: '0 16px 14px' }}>
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
            marginBottom: 6,
          }}
        >
          <UserCircle size={13} strokeWidth={2.5} color="#F7931E" />
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: '#F7931E',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            PLAYER
          </span>
          <ChevronRight size={11} strokeWidth={2.5} color="#F7931E" />
        </button>

        <h1
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '-0.015em',
            lineHeight: 1.05,
            margin: 0,
          }}
        >
          Player Profile
        </h1>

        <div
          style={{
            marginTop: 4,
            fontSize: 13,
            fontWeight: 500,
            color: '#64748B',
            lineHeight: 1.3,
          }}
        >
          {[
            player.tour_codes && player.tour_codes.length > 0
              ? `Tours ${player.tour_codes.map(c => c.toUpperCase()).join(' · ')}`
              : null,
            countryDisplay,
          ].filter(Boolean).join(' · ')}
        </div>
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
          <Crown size={13} strokeWidth={2.5} fill="#FFB800" color="#D97706" />
          {captionMetadata.map((part, i) => (
            <Fragment key={i}>
              {i > 0 && (
                <span style={{ fontSize: 9, fontWeight: 800, color: '#CBD5E1', letterSpacing: '0.16em' }}>·</span>
              )}
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: i === 0 ? '#0F172A' : '#64748B',
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
                width: 80,
                height: 80,
                borderRadius: '34%',
                overflow: 'hidden',
                background: '#F1F5F9',
                border: '2.5px solid #FFB800',
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
                  background: '#FFB800',
                  border: '2.5px solid #FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#0F172A',
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
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#0F172A',
                  letterSpacing: '-0.025em',
                  lineHeight: 1.1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {player.full_name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                <CountryFlag country={player.country_code || player.country} size="sm" />
                {countryDisplay && (
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>{countryDisplay}</span>
                )}
              </div>
            </div>

            <div style={{ flexShrink: 0, textAlign: 'right' as const }}>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#0F172A',
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                  whiteSpace: 'nowrap',
                }}
              >
                {heroStatInteger}
                {heroStatDecimal && <span style={{ color: '#F7931E' }}>{heroStatDecimal}</span>}
                {heroStatSuffix}
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 9,
                  fontWeight: 800,
                  color: '#64748B',
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
