/**
 * PlayerCardV2 - Redesigned player card with photo filling the left side.
 * Similar to tournament cards on the Schedule page.
 */

import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';
import { countryCodeToFlag, titleCaseCountry } from '../../utils/countryFlags';

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
  /** Override headshot URL from batch-loaded map */
  batchHeadshotUrl?: string | null;
  /** Whether to show the tour badge (hidden when filtering by specific tour) */
  showTourBadge?: boolean;
  /** Index for staggered animation */
  index?: number;
}

function formatEarnings(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

function getTourLabel(tourCodes: string[] | null | undefined): string | null {
  if (!tourCodes || tourCodes.length === 0) return null;
  const code = tourCodes[0];
  const map: Record<string, string> = {
    pga: 'PGA Tour',
    EURO: 'DP World',
    PGAD: 'Korn Ferry',
    LIV: 'LIV Golf',
    LPGA: 'LPGA',
  };
  return map[code] || code;
}

export function PlayerCardV2({
  player,
  worldRank,
  eventsPlayed,
  earnings,
  batchHeadshotUrl,
  showTourBadge = true,
  index = 0,
}: PlayerCardV2Props) {
  // Filter out ui-avatars.com from batch headshots, then fall back to resolvePhotoUrl (uses Cloudinary if pgaTourId exists)
  const filteredBatchUrl = batchHeadshotUrl && !batchHeadshotUrl.includes('ui-avatars.com') ? batchHeadshotUrl : null;
  const photoUrl = filteredBatchUrl ?? resolvePhotoUrl(player.photoUrl, player.pgaTourId);
  const flag = countryCodeToFlag(player.countryCode);
  const countryName = titleCaseCountry(player.country);
  const tourLabel = showTourBadge ? getTourLabel(player.tourCodes) : null;

  const initials = player.fullName
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const staggerDelay = Math.min(index, 20) * 0.015;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: staggerDelay, duration: 0.25, ease: 'easeOut' }}
    >
      <Link
        to={`/tourhub/player/${player.id}`}
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
          {/* Name */}
          <h3 className="text-base font-semibold text-foreground truncate leading-tight">
            {player.fullName}
          </h3>

          {/* Country */}
          {countryName && (
            <div className="flex items-center gap-1.5 mt-1">
              {flag && <span className="text-xs leading-none">{flag}</span>}
              <span className="text-sm text-muted-foreground truncate">{countryName}</span>
            </div>
          )}

          {/* World rank */}
          {worldRank != null && worldRank > 0 && (
            <p className="text-xs text-muted-foreground mt-1.5">
              <span className="font-semibold text-foreground">#{worldRank}</span>{' '}
              World Golf Ranking
            </p>
          )}

          {/* Stats row */}
          {(eventsPlayed != null || (earnings != null && earnings > 0)) && (
            <div className="flex items-center gap-2 mt-1">
              {eventsPlayed != null && (
                <span className="text-xs text-muted-foreground">
                  Events: {eventsPlayed}
                </span>
              )}
              {eventsPlayed != null && earnings != null && earnings > 0 && (
                <span className="text-xs text-muted-foreground/40">·</span>
              )}
              {earnings != null && earnings > 0 && (
                <span className="text-xs text-muted-foreground">
                  {formatEarnings(earnings)}
                </span>
              )}
            </div>
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
