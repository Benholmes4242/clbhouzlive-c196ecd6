/**
 * PlayerListRow - Clean, reusable player row for all tier views.
 * Uses SquircleAvatar, semantic tokens, countryCodeToFlag.
 * Supports rank change indicators for Elite tab.
 */

import { Link } from 'react-router-dom';
import { ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import { countryCodeToFlag, titleCaseCountry } from '../../utils/countryFlags';

function getRankBadgeClasses(rank: number): string {
  if (rank === 1) return 'bg-gradient-to-br from-amber-300 to-amber-500 text-amber-900';
  if (rank === 2) return 'bg-gradient-to-br from-foreground/30 to-foreground/40 text-background';
  if (rank === 3) return 'bg-gradient-to-br from-amber-600 to-amber-700 text-white';
  if (rank <= 10) return 'bg-foreground/10 text-foreground';
  return 'bg-muted text-muted-foreground';
}

/** Rank change indicator (▲/▼/—) */
function RankChangeIndicator({ change }: { change: number }) {
  if (change > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-emerald-500">
        <TrendingUp className="w-3 h-3" />
        <span className="text-[10px] font-bold tabular-nums">{change}</span>
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-red-400">
        <TrendingDown className="w-3 h-3" />
        <span className="text-[10px] font-bold tabular-nums">{Math.abs(change)}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-muted-foreground/40">
      <Minus className="w-3 h-3" />
    </span>
  );
}

interface PlayerListRowProps {
  player: {
    id: string;
    fullName: string;
    country: string | null;
    countryCode: string | null;
    photoUrl: string | null;
    pgaTourId: string | null;
  };
  rank?: number;
  rankChange?: number | null;
  statValue?: string;
  statLabel?: string;
  variant?: 'default' | 'ranked';
  /** Override headshot URL from batch-loaded map */
  batchHeadshotUrl?: string | null;
  /** Index for staggered animation (cap at 15) */
  index?: number;
}

export function PlayerListRow({
  player,
  rank,
  rankChange,
  statValue,
  statLabel,
  variant = 'default',
  batchHeadshotUrl,
  index = 0,
}: PlayerListRowProps) {
  // Use R2 headshot as primary source
  const photoUrl = batchHeadshotUrl ?? getPlayerHeadshotUrl(player.fullName, 'pga');
  const flag = countryCodeToFlag(player.countryCode);
  const countryName = titleCaseCountry(player.country);

  const initials = player.fullName
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Stagger animation - cap at 15 rows (0.3s total)
  const staggerDelay = Math.min(index, 15) * 0.02;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: staggerDelay, duration: 0.25, ease: 'easeOut' }}
    >
      <Link
        to={`/tourhub/player/${player.id}`}
        className={cn(
          "flex items-center gap-3 px-4 py-3",
          "bg-transparent hover:bg-muted/30",
          "border-b border-border/20 last:border-0",
          "active:scale-[0.98] transition-transform"
        )}
      >
        {/* Rank badge */}
        {variant === 'ranked' && rank != null && (
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <div className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold",
              getRankBadgeClasses(rank)
            )}>
              {rank}
            </div>
            {rankChange != null && <RankChangeIndicator change={rankChange} />}
          </div>
        )}

        {/* Avatar */}
        <SquircleAvatar
          src={photoUrl}
          alt={player.fullName}
          fallback={initials}
          size="md"
          hideRing
        />

        {/* Name + country */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-semibold text-foreground truncate leading-tight">
            {player.fullName}
          </h3>
          {countryName && (
            <div className="flex items-center gap-1.5 mt-0.5">
              {flag && <span className="text-xs leading-none">{flag}</span>}
              <span className="text-[12px] text-muted-foreground/80 truncate">{countryName}</span>
            </div>
          )}
        </div>

        {/* Stat value */}
        {statValue && (
          <div className="text-right shrink-0">
            <p className="font-mono text-[13px] font-semibold text-foreground tabular-nums">{statValue}</p>
            {statLabel && (
              <p className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">{statLabel}</p>
            )}
          </div>
        )}

        {/* Chevron */}
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
      </Link>
    </motion.div>
  );
}
