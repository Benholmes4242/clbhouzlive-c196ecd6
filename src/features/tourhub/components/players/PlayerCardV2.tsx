/**
 * PlayerCardV2 - Flat dispatch row style.
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import { titleCaseCountry } from '../../utils/countryFlags';
import CountryFlag from '@/components/ui/country-flag';
import type { PlayerSortType } from './PlayerSortControl';

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

  const isFirst = (worldRank === 1 && (activeSort === 'world-rank-desc' || activeTour === 'all'));

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
          borderLeft: isFirst ? '3px solid #F7931E' : '3px solid transparent',
          background: isFirst ? 'rgba(247,147,30,0.025)' : 'transparent',
          textDecoration: 'none',
        }}
        className="active:bg-black/[0.02] transition-colors"
      >
        {/* Large faded rank number */}
        <div style={{ width: '44px', padding: '13px 0 13px 14px', flexShrink: 0 }}>
          {worldRank != null && worldRank > 0 ? (
            <span style={{
              fontSize: '18px', fontWeight: 900,
              color: isFirst ? 'rgba(247,147,30,0.25)' : 'rgba(15,23,42,0.1)',
              lineHeight: 1, letterSpacing: '-0.03em', display: 'block',
            }}>
              {worldRank}
            </span>
          ) : (
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(15,23,42,0.12)' }}>—</span>
          )}
        </div>

        {/* Avatar */}
        <div style={{ width: '34px', height: '34px', borderRadius: '34%', overflow: 'hidden', flexShrink: 0, background: 'rgba(15,23,42,0.06)', marginRight: '10px' }}>
          <img
            src={photoUrl}
            alt={player.fullName}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 8%' }}
            loading="lazy"
            onError={e => { (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL; }}
          />
        </div>

        {/* Player info */}
        <div style={{ flex: 1, minWidth: 0, padding: '12px 0' }}>
          <div style={{
            fontSize: '14px', fontWeight: isFirst ? 800 : 600, color: '#0F172A',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
          }}>
            {player.fullName}
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

        {/* Right value */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px 12px 0', flexShrink: 0 }}>
          {/* Total points — shown for OWGR/default sorts when available, hidden for earnings sort */}
          {!isTourRanking && !isPgaEarnings && totalPoints != null && totalPoints > 0 && activeSort !== 'most-wins' && (
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#F7931E', fontVariantNumeric: 'tabular-nums' }}>
              {totalPoints.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              <span style={{ fontSize: '8px', marginLeft: '1px' }}>pts</span>
            </span>
          )}
          {rightValue && (
            <span style={{ fontSize: '13px', fontWeight: 800, color: isFirst ? '#F7931E' : '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
              {rightValue.main}
              {rightValue.label && (
                <span style={{ fontSize: '9px', fontWeight: 500, color: '#94A3B8', marginLeft: '2px' }}>
                  {rightValue.label}
                </span>
              )}
            </span>
          )}
          {/* Win count — bold green, hidden for OWGR and earnings sorts */}
          {!isTourRanking && !isPgaOwgr && !isPgaEarnings && winCount > 0 && activeSort !== 'most-wins' && (
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#16A34A', fontVariantNumeric: 'tabular-nums' }}>
              {winCount} {winCount === 1 ? 'win' : 'wins'}
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
