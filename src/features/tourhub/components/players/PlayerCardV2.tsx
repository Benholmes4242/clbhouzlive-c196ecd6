/**
 * PlayerCardV2 - Redesigned player card with photo filling the left side.
 * Aligned with Tour Overview audit specs.
 */

import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
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
  /** Actual OWGR rank (separate from worldRank which may hold tour rank) */
  owgr?: number | null;
  eventsPlayed?: number | null;
  earnings?: number | null;
  wins?: number | null;
  points?: number | null;
  tournamentsPlayed?: number | null;
  showTourBadge?: boolean;
  index?: number;
  activeSort?: PlayerSortType;
  activeTour?: string;
  onNavigate?: () => void;
  /** Skip entry animation (e.g. when inside an already-animating overlay) */
  disableAnimation?: boolean;
  /** Directory mode — show only name, country, photo, chevron (no stats/rank) */
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
  tournamentsPlayed,
  showTourBadge = true,
  index = 0,
  activeSort = 'world-rank-desc',
  activeTour = 'all',
  onNavigate,
  disableAnimation = false,
  directoryMode = false,
}: PlayerCardV2Props) {
  // R2 headshot — single source of truth
  const tourCode = activeTour === 'all' ? (player.tourCodes?.[0] ?? 'pga') : activeTour;
  const photoUrl = getPlayerHeadshotUrl(player.fullName, tourCode);
  
  const countryName = titleCaseCountry(player.country);

  const initials = player.fullName
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const staggerDelay = Math.min(index, 20) * 0.015;

  // Build meta parts — euro/lpga show tour-specific ranking data
  const isEuro = activeTour === 'EURO';
  const isLPGA = activeTour === 'LPGA';
  const isPGAD = activeTour === 'PGAD';
  const isLIV = activeTour === 'LIV';
  const isTourRanking = isEuro || isLPGA || isPGAD || isLIV;
  const rankPart = worldRank != null && worldRank > 0
    ? (activeTour === 'all' ? `#${worldRank} OWGR` : `#${worldRank}`)
    : null;
  
  // Points display for R2D / CME Globe
  const pointsPart = isTourRanking && points != null && points > 0
    ? `${points.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} pts`
    : null;
  const winCount = wins ?? 0;
  const tourWinsPart = isTourRanking && winCount > 0 ? `${winCount} ${winCount === 1 ? 'win' : 'wins'}` : null;
  const eventsPart = null; // Events display removed — wins shown instead

  const earningsPart = !isTourRanking && earnings != null && earnings > 0 ? formatEarnings(earnings) : null;
  const winsPart = !isTourRanking && winCount > 0 ? `${winCount} ${winCount === 1 ? 'win' : 'wins'}` : null;

  // Reorder stats based on active sort
  let metaParts: string[] = [];
  let primaryIndex = -1;

  if (isTourRanking) {
    // Tour-ranked: show points, then wins
    if (pointsPart) metaParts.push(pointsPart);
    if (tourWinsPart) metaParts.push(tourWinsPart);
    primaryIndex = 0;
  } else if (activeSort === 'most-wins') {
    if (winsPart) metaParts.push(winsPart);
    primaryIndex = 0;
    if (rankPart) metaParts.push(rankPart);
    if (earningsPart) metaParts.push(earningsPart);
  } else if (activeSort === 'highest-earnings') {
    if (earningsPart) metaParts.push(earningsPart);
    primaryIndex = 0;
    if (rankPart) metaParts.push(rankPart);
    if (winsPart) metaParts.push(winsPart);
  } else {
    if (rankPart) metaParts.push(rankPart);
    if (earningsPart) metaParts.push(earningsPart);
    if (winsPart) metaParts.push(winsPart);
  }

  const ariaLabel = [
    player.fullName,
    countryName,
    rankPart ? `rank ${worldRank}` : null,
    earningsPart,
    winCount > 0 ? `${winCount} wins` : null,
  ].filter(Boolean).join(', ');

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
        className={cn(
          "flex overflow-hidden",
          "bg-card rounded-2xl border border-border/50",
          "shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
          "active:scale-[0.98] transition-all"
        )}
        style={{ minHeight: '100px' }}
      >
        {/* Photo section — left 140px */}
        <div className="relative shrink-0 bg-muted overflow-hidden" style={{ width: '140px', borderRadius: '16px 0 0 16px' }}>
          <img
            src={photoUrl}
            alt={player.fullName}
            className="w-full h-full object-cover object-top"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL; }}
          />
        </div>

        {/* Info section */}
        <div className="flex-1 min-w-0 p-4 flex flex-col justify-center">
          <h3 
            className="text-foreground truncate"
            style={{ fontSize: '16px', fontWeight: 600, letterSpacing: '-0.1px' }}
          >
            {player.fullName}
          </h3>

          {countryName && (
            <div className="flex items-center gap-1.5" style={{ marginTop: '2px' }}>
              <CountryFlag country={player.country} size="sm" />
              <span style={{ fontSize: '13px', fontWeight: 400 }} className="text-muted-foreground truncate">{countryName}</span>
            </div>
          )}

          {/* Stats lines — hidden in directory mode */}
          {!directoryMode && (
            <>
              {/* Combined rank + points line for tour rankings (Euro/LPGA) */}
              {isTourRanking && (rankPart || pointsPart || tourWinsPart) && (
                <p className="text-muted-foreground truncate" style={{ fontSize: '13px', fontWeight: 500, marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
                  {[rankPart, pointsPart, tourWinsPart].filter(Boolean).map((part, i) => (
                    <span key={i}>
                      {i > 0 && ' · '}
                      {(part === rankPart || part === pointsPart) ? (
                        <span className="font-semibold text-foreground">{part}</span>
                      ) : part}
                    </span>
                  ))}
                </p>
              )}

              {/* OWGR secondary line for tour-ranked tours (EURO, PGAD, LIV — not LPGA) */}
              {isTourRanking && !isLPGA && owgr != null && owgr > 0 && (
                <p className="text-muted-foreground truncate" style={{ fontSize: '12px', fontWeight: 400, marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>
                  #{owgr} OWGR
                </p>
              )}

              {/* Rank line for non-tour rankings */}
              {!isTourRanking && rankPart && (
                <p className="text-muted-foreground truncate" style={{ fontSize: '13px', fontWeight: 500, marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
                  {activeSort === 'world-rank-desc' || activeSort === 'world-rank-asc' ? (
                    <span className="font-semibold text-foreground">{rankPart}</span>
                  ) : rankPart}
                </p>
              )}

              {/* Earnings / Wins line for non-tour rankings */}
              {!isTourRanking && (earningsPart || winsPart) && (
                <p className="text-muted-foreground truncate" style={{ fontSize: '13px', fontWeight: 500, marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>
                  {[earningsPart, winsPart].filter(Boolean).map((part, i) => (
                    <span key={i}>
                      {i > 0 && ' · '}
                      {((activeSort === 'highest-earnings' && part === earningsPart) || 
                        (activeSort === 'most-wins' && part === winsPart)) ? (
                        <span className="font-semibold text-foreground">{part}</span>
                      ) : part}
                    </span>
                  ))}
                </p>
              )}
            </>
          )}
        </div>

        {/* Chevron */}
        <div className="flex items-center pr-3 shrink-0">
          <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
        </div>
      </Link>
    </motion.div>
  );
}
