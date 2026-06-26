/**
 * PlayerHero — canonical light-surface masthead (Tour Hub Overview alignment).
 *
 * Identity wrapped in the gold champion CARD (same vocabulary as CollegeMasthead /
 * Players HeroChampion). Section eyebrow above; caption row + body row inside the
 * gold gradient card. Right-aligned headline stat (Season Earnings → FedEx pts →
 * World Rank fallback).
 */

import { Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle, ChevronRight, Crown } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { resolvePlayerAvatarCandidates } from '@/features/tourhub/_shared/resolvePlayerAvatar';
import { titleCaseCountry } from '../../utils/countryFlags';
import CountryFlag from '@/components/ui/country-flag';
import type { TourPlayer, TourPlayerStatistics } from '../../hooks/useTourHubData';
import { usePlayerState } from '../../hooks/usePlayerState';


import {
  AMBER,
  GOLD,
  GOLD_BORDER,
  GOLD_DEEP,
  GOLD_TINT,
  GOLD_TINT_10,
  INK,
  INK_MUTE,
  SLATE_50,
  SURFACE,
} from '../../_shared/tokens';

interface PlayerHeroProps {
  player: TourPlayer;
  playerStats: TourPlayerStatistics | null;
}

function formatEarningsHeadline(value: number): { main: string; decimal: string | null; suffix: string | null } {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    const [whole, dec] = millions.toFixed(2).split('.');
    return { main: `$${whole}`, decimal: dec ? `.${dec}` : null, suffix: 'M' };
  }
  if (value >= 1_000) {
    const thousands = value / 1_000;
    const [whole, dec] = thousands.toFixed(1).split('.');
    return { main: `$${whole}`, decimal: dec ? `.${dec}` : null, suffix: 'K' };
  }
  return { main: `$${value.toLocaleString()}`, decimal: null, suffix: null };
}


export function PlayerHero({ player, playerStats }: PlayerHeroProps) {
  const navigate = useNavigate();
  const avatarCandidates = resolvePlayerAvatarCandidates({
    name: player.full_name,
    photoUrl: player.photo_url ?? null,
    tourSlug: player.tour_codes?.[0] ?? 'pga',
  });

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

  // Headline stat: Season Earnings → FedEx points → World Rank
  const headlineStat: { value: React.ReactNode; label: string } | null = (() => {
    const earnings = playerStats?.earnings;
    if (typeof earnings === 'number' && earnings > 0) {
      const { main, decimal, suffix } = formatEarningsHeadline(earnings);
      return {
        value: (
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>
            {main}
            {decimal && <span style={{ color: INK }}>{decimal}</span>}
            {suffix && <span style={{ fontSize: 14, fontWeight: 800, color: INK_MUTE, marginLeft: 1 }}>{suffix}</span>}
          </span>
        ),
        label: 'EARNINGS',
      };
    }
    const fedex = playerStats?.fedex_points;
    if (typeof fedex === 'number' && fedex > 0) {
      return {
        value: <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fedex.toLocaleString()}</span>,
        label: 'FEDEX PTS',
      };
    }
    if (worldRank) {
      return {
        value: <span style={{ fontVariantNumeric: 'tabular-nums' }}>#{worldRank}</span>,
        label: 'WORLD RANK',
      };
    }
    return null;
  })();

  return (
    <div
      style={{
        position: 'relative',
        background: SLATE_50,
        padding: '10px 0 14px',
      }}
    >

      {/* Gold champion card */}
      <div
        style={{
          margin: '0 16px',
          background: `linear-gradient(180deg, ${GOLD_TINT_10} 0%, ${GOLD_TINT} 100%)`,
          border: `1px solid ${GOLD_BORDER}`,
          borderRadius: 14,
          padding: 14,
        }}
      >
        {/* Caption row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            marginBottom: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', minWidth: 0 }}>
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

          {liveText && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexShrink: 0 }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: INK_MUTE, letterSpacing: '0.16em', textTransform: 'uppercase' }}>LIVE</span>
              <span style={{ fontSize: 9, fontWeight: 800, color: INK, letterSpacing: '0.16em', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                {liveText}
              </span>
            </div>
          )}
        </div>

        {/* Body row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Photo + position badge */}
          <div
            style={{
              position: 'relative',
              flexShrink: 0,
              borderRadius: '34%',
              boxShadow: '0 4px 12px rgba(255,184,0,0.20)',
            }}
          >
            <SquircleAvatar
              size={72}
              srcCandidates={avatarCandidates}
              alt={player.full_name}
              userId={player.id ?? player.full_name}
              ringColor={GOLD}
            />

            {/* Position badge — gated: worldRank && worldRank <= 99 */}
            {worldRank && worldRank <= 99 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: -4,
                  right: -4,
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: GOLD,
                  border: `2.5px solid ${SURFACE}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 800,
                  color: INK,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {worldRank}
              </div>
            )}
          </div>

          {/* Name + flag */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 21,
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

          {/* Headline stat — right aligned */}
          {headlineStat && (
            <div style={{ flexShrink: 0, textAlign: 'right' as const, marginLeft: 4 }}>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: INK,
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                }}
              >
                {headlineStat.value}
              </div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: INK_MUTE,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase' as const,
                  marginTop: 4,
                }}
              >
                {headlineStat.label}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
