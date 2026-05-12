/**
 * PlayerCardV2 - Flat dispatch row style.
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import { titleCaseCountry } from '../../utils/countryFlags';
import CountryFlag from '@/components/ui/country-flag';
import { MovementIndicator } from '../shared/MovementIndicator';
import { RecentResultPill } from '../shared/RecentResultPill';
import type { PlayerSortType } from './PlayerSortControl';
import type { RecentResult } from '../../hooks/useRecentPlayerResults';

interface PlayerCardV2Props {
  player: {
    id: string;
    fullName: string;
    country: string | null;
    countryCode: string | null;
    photoUrl: string | null;
    pgaTourId: string | null;
    tourCodes?: string[] | null;
  };
  worldRank?: number | null;
  owgr?: number | null;
  eventsPlayed?: number | null;
  earnings?: number | null;
  wins?: number | null;
  points?: number | null;
  totalPoints?: number | null;
  tournamentsPlayed?: number | null;
  showTourBadge?: boolean;
  index?: number;
  activeSort?: PlayerSortType;
  activeTour?: string;
  /** Tier-1 visual treatment for the top 9 rows below the hero (list position 0-8). */
  isTopTen?: boolean;
  /**
   * Week-over-week movement: positive = moved up, negative = moved down,
   * 0 = no change, null = no data.
   *
   * NOTE: callers must gate this to OWGR sort only. Only sr_world_rankings
   * has prior-rank snapshots — FedEx, Earnings, Race to Dubai, Race to CME
   * Globe, LIV, etc. have no weekly history. Widen the gate when those
   * ranking systems add weekly snapshot capture.
   */
  rankChange?: number | null;
  /** Most recent notable finish (positions 1-10) within the last 4 weeks. */
  recentResult?: RecentResult | null;
  /**
   * Override the right-side value rendering with a free-form display.
   * When provided, the existing sort-mode value selection is bypassed entirely.
   * Tour Hub standard for surfaces that render arbitrary per-stat values
   * (Stat Watch, College Franchise, etc.) without growing the sort-mode enum.
   */
  displayValue?: { main: string; label?: string } | null;
  onNavigate?: () => void;
  disableAnimation?: boolean;
  directoryMode?: boolean;
}

function formatEarnings(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

export function PlayerCardV2({
  player,
  worldRank,
  owgr,
  eventsPlayed,
  earnings,
  wins,
  points,
  totalPoints,
  tournamentsPlayed,
  showTourBadge = true,
  index = 0,
  activeSort = 'world-rank-desc',
  activeTour = 'all',
  isTopTen = false,
  rankChange,
  recentResult,
  displayValue,
  onNavigate,
  disableAnimation = false,
  directoryMode = false,
}: PlayerCardV2Props) {
  const tourCode = activeTour === 'all' ? (player.tourCodes?.[0] ?? 'pga') : activeTour;
  const photoUrl = getPlayerHeadshotUrl(player.fullName, tourCode);
  const countryName = titleCaseCountry(player.country);

  const staggerDelay = Math.min(index, 20) * 0.015;

  const isEuro = activeTour === 'EURO';
  const isLPGA = activeTour === 'LPGA';
  const isPGAD = activeTour === 'PGAD';
  const isLIV = activeTour === 'LIV';
  const isTourRanking = isEuro || isLPGA || isPGAD || isLIV;
  const isPgaOwgr = activeTour === 'pga' && activeSort === 'world-rank-desc';
  const isPgaEarnings = activeTour === 'pga' && activeSort === 'highest-earnings';
  const isPgaFedex = activeTour === 'pga' && activeSort === 'fedex-points';
  const isAlpha = activeSort === 'alpha-az' || activeSort === 'alpha-za';
  const winCount = wins ?? 0;

  const ariaLabel = [
    player.fullName,
    countryName,
    worldRank != null ? `rank ${worldRank}` : null,
    earnings != null ? formatEarnings(earnings) : null,
    winCount > 0 ? `${winCount} wins` : null,
  ].filter(Boolean).join(', ');

  // Build the right-side value based on active sort
  const rightValue = (() => {
    if (isTourRanking) {
      if (points != null && points > 0) return { main: points.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), label: 'pts' };
      return null;
    }
    // PGA OWGR: only total points shown (handled separately below), no earnings here
    if (isPgaOwgr) return null;
    if (isPgaFedex) {
      return points != null && points > 0
        ? { main: points.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }), label: 'pts' }
        : null;
    }
    if (activeSort === 'highest-earnings') {
      return earnings != null ? { main: formatEarnings(earnings), label: '' } : null;
    }
    if (activeSort === 'most-wins') {
      return wins != null ? { main: String(wins), label: wins === 1 ? 'win' : 'wins' } : null;
    }
    // Default: show earnings as secondary
    if (earnings != null && earnings > 0) return { main: formatEarnings(earnings), label: '' };
    return null;
  })();

  // Top-10 tier accent (list-position 0-8 below hero).
  // Rank-1 is rendered by HeroChampion, never by PlayerCardV2 — no isFirst branch needed.
  const tierAccent = isTopTen;

  const photoSize = tierAccent ? 38 : 34;
  const nameWeight = tierAccent ? 800 : 700;
  const nameSize = 14;
  const rankSize = tierAccent ? 16 : 18;
  const rankColor = tierAccent ? '#F7931E' : 'rgba(15,23,42,0.10)';
  const rowPaddingY = tierAccent ? 14 : 12;

  return (
    <motion.div
      initial={disableAnimation ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={disableAnimation ? { duration: 0 } : { delay: staggerDelay, duration: 0.25, ease: 'easeOut' }}
    >
      <Link
        to={`/tourhub/player/${player.id}`}
        onClick={onNavigate}
        aria-label={ariaLabel}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          borderBottom: '0.5px solid rgba(15,23,42,0.07)',
          borderLeft: '2px solid transparent',
          background: tierAccent ? '#FEF3E7' : 'transparent',
          textDecoration: 'none',
        }}
        className="active:bg-black/[0.02] transition-colors"
      >
        {/* Large faded rank number — hidden for A-Z sorts */}
        {!isAlpha && (
          <div style={{ width: '52px', padding: `${rowPaddingY}px 0 ${rowPaddingY}px 14px`, flexShrink: 0 }}>
            {worldRank != null && worldRank > 0 ? (
              <span style={{
                fontSize: `${rankSize}px`, fontWeight: 900,
                color: rankColor,
                lineHeight: 1, letterSpacing: '-0.03em', display: 'block',
              }}>
                {worldRank}
              </span>
            ) : (
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(15,23,42,0.12)' }}>—</span>
            )}
          </div>
        )}

        {/* Avatar */}
        <div style={{ width: `${photoSize}px`, height: `${photoSize}px`, borderRadius: '34%', overflow: 'hidden', flexShrink: 0, background: 'rgba(15,23,42,0.06)', marginLeft: isAlpha ? '14px' : '0', marginRight: '10px' }}>
          <img
            src={photoUrl}
            alt={player.fullName}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 8%' }}
            loading="lazy"
            onError={e => { (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL; }}
          />
        </div>

        {/* Player info */}
        <div style={{ flex: 1, minWidth: 0, padding: `${rowPaddingY}px 0` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <span style={{
              fontSize: `${nameSize}px`, fontWeight: nameWeight, color: '#0F172A', letterSpacing: tierAccent ? '-0.01em' : 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, minWidth: 0, flex: '0 1 auto',
            }}>
              {player.fullName}
            </span>
            {recentResult && (
              <RecentResultPill position={recentResult.position} tied={recentResult.tied} />
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
            <CountryFlag country={player.country} size="sm" />
            <span style={{ fontSize: '10px', color: '#94A3B8' }}>{countryName}</span>
            {/* OWGR secondary for tour-specific pages */}
            {isTourRanking && !isLPGA && owgr != null && owgr > 0 && (
              <span style={{ fontSize: '10px', color: '#CBD5E1', marginLeft: '4px' }}>· #{owgr} OWGR</span>
            )}
          </div>
        </div>

        {/* Right value — hidden for A-Z sorts */}
        {!isAlpha && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, padding: `${rowPaddingY}px 14px ${rowPaddingY}px 0`, flexShrink: 0 }}>
            {displayValue ? (
              // Tour Hub standard override (Stat Watch, etc.) — bypasses sort-mode selection.
              <span style={{ fontSize: '13px', fontWeight: 800, color: tierAccent && worldRank === 1 ? '#F7931E' : '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
                {displayValue.main}
                {displayValue.label && (
                  <span style={{ fontSize: '9px', fontWeight: 800, color: '#94A3B8', marginLeft: 2 }}>
                    {displayValue.label}
                  </span>
                )}
              </span>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {!isTourRanking && !isPgaEarnings && !isPgaFedex && totalPoints != null && totalPoints > 0 && activeSort !== 'most-wins' && (
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
                    {totalPoints.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                    <span style={{ fontSize: '9px', fontWeight: 800, color: '#0F172A' }}>pts</span>
                  </span>
                )}
                {rightValue && (
                  <span style={{ fontSize: '13px', fontWeight: 800, color: isFirst ? '#F7931E' : '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
                    {rightValue.main}
                    {rightValue.label && (
                      <span style={{ fontSize: '9px', fontWeight: 800, color: '#0F172A' }}>
                        {rightValue.label}
                      </span>
                    )}
                  </span>
                )}
                {!isTourRanking && !isPgaOwgr && !isPgaEarnings && !isPgaFedex && winCount > 0 && activeSort !== 'most-wins' && (
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#16A34A', fontVariantNumeric: 'tabular-nums' }}>
                    {winCount} {winCount === 1 ? 'win' : 'wins'}
                  </span>
                )}
              </div>
            )}
            <MovementIndicator delta={rankChange} />
          </div>
        )}
      </Link>
    </motion.div>
  );
}
