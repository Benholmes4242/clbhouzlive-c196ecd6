/**
 * PlayerCardV2 - Redesigned player card with photo filling the left side.
 * PL-04: Stats line reorders based on active sort.
 * PL-05: aria-label for screen readers.
 */

import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';
import { countryCodeToFlag, titleCaseCountry } from '../../utils/countryFlags';
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
  eventsPlayed?: number | null;
  earnings?: number | null;
  wins?: number | null;
  batchHeadshotUrl?: string | null;
  showTourBadge?: boolean;
  index?: number;
  /** Active sort — determines stats line order (PL-04) */
  activeSort?: PlayerSortType;
  /** Called before navigating to save scroll position (PL-03) */
  onNavigate?: () => void;
}

function formatEarnings(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

export function PlayerCardV2({
  player,
  worldRank,
  eventsPlayed,
  earnings,
  wins,
  batchHeadshotUrl,
  showTourBadge = true,
  index = 0,
  activeSort = 'world-rank-desc',
  onNavigate,
}: PlayerCardV2Props) {
  const filteredBatchUrl = batchHeadshotUrl && !batchHeadshotUrl.includes('ui-avatars.com') ? batchHeadshotUrl : null;
  const photoUrl = filteredBatchUrl ?? resolvePhotoUrl(player.photoUrl, player.pgaTourId);
  const flag = countryCodeToFlag(player.countryCode);
  const countryName = titleCaseCountry(player.country);

  const initials = player.fullName
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const staggerDelay = Math.min(index, 20) * 0.015;

  // Build meta parts
  const rankPart = worldRank != null && worldRank > 0 ? `#${worldRank} OWGR` : null;
  const earningsPart = earnings != null && earnings > 0 ? formatEarnings(earnings) : null;
  const winCount = wins ?? 0;
  const winsPart = winCount > 0 ? `${winCount} ${winCount === 1 ? 'win' : 'wins'}` : null;

  // PL-04: Reorder stats based on active sort
  let metaParts: string[] = [];
  let primaryIndex = -1;

  if (activeSort === 'most-wins') {
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
    // Default / world-rank / alpha
    if (rankPart) metaParts.push(rankPart);
    if (earningsPart) metaParts.push(earningsPart);
    if (winsPart) metaParts.push(winsPart);
  }

  // PL-05: Build aria-label
  const ariaLabel = [
    player.fullName,
    countryName,
    rankPart ? `rank ${worldRank}` : null,
    earningsPart,
    winCount > 0 ? `${winCount} wins` : null,
  ].filter(Boolean).join(', ');

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: staggerDelay, duration: 0.25, ease: 'easeOut' }}
    >
      <Link
        to={`/tourhub/player/${player.id}`}
        onClick={onNavigate}
        aria-label={ariaLabel}
        className={cn(
          "flex overflow-hidden",
          "bg-card rounded-xl border border-border/40 shadow-sm",
          "hover:border-primary/30 hover:shadow-md",
          "active:scale-[0.98] transition-all"
        )}
        style={{ height: '110px' }}
      >
        {/* Photo section — left ~35% */}
        <div className="relative w-[110px] shrink-0 bg-muted overflow-hidden">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={player.fullName}
              className="w-full h-full object-cover object-top"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-muted-foreground/40">{initials}</span>
            </div>
          )}
        </div>

        {/* Info section — right ~65% */}
        <div className="flex-1 min-w-0 px-3.5 py-3 flex flex-col justify-center">
          <h3 className="text-base font-semibold text-foreground truncate leading-tight">
            {player.fullName}
          </h3>

          {countryName && (
            <div className="flex items-center gap-1.5 mt-1">
              {flag && <span className="text-xs leading-none">{flag}</span>}
              <span className="text-sm text-muted-foreground truncate">{countryName}</span>
            </div>
          )}

          {/* Meta line — PL-04: primary metric is bold */}
          {metaParts.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1.5 tabular-nums truncate">
              {metaParts.map((part, i) => (
                <span key={i}>
                  {i > 0 && ' · '}
                  {i === primaryIndex && primaryIndex >= 0 ? (
                    <span className="font-semibold text-foreground">{part}</span>
                  ) : (
                    part
                  )}
                </span>
              ))}
            </p>
          )}
        </div>

        {/* Chevron */}
        <div className="flex items-center pr-3 shrink-0">
          <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
        </div>
      </Link>
    </motion.div>
  );
}