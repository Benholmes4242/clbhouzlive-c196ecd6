/**
 * LeaderRow — Gamified ranked player row with relative stat bar.
 * Staggered entrance animation, semantic tokens, font-mono stats.
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';
import { countryCodeToFlag, titleCaseCountry } from '../../utils/countryFlags';
import type { LeaderCategory } from './constants';

interface LeaderRowProps {
  rank: number;
  overrideRank?: number;
  player: {
    id: string;
    fullName: string;
    country?: string | null;
    countryCode?: string | null;
    photoUrl?: string | null;
    pgaTourId?: string | null;
  };
  value: number;
  leaderValue: number;
  category: LeaderCategory;
  formatOverride?: (v: number) => string;
  unitOverride?: string;
  index: number;
}

export function LeaderRow({
  rank,
  overrideRank,
  player,
  value,
  leaderValue,
  category,
  formatOverride,
  unitOverride,
  index,
}: LeaderRowProps) {
  const displayRank = overrideRank ?? rank;
  const photoUrl = resolvePhotoUrl(player.photoUrl, player.pgaTourId);
  const flag = countryCodeToFlag(player.countryCode);
  const countryName = titleCaseCountry(player.country);
  const fmt = formatOverride ?? category.format;
  const unit = unitOverride ?? category.unit;

  // Calculate relative bar width (proportion of leader's value)
  // For asc stats (lower is better), invert the ratio
  const barPercent = leaderValue > 0
    ? category.sortDirection === 'desc'
      ? Math.min((value / leaderValue) * 100, 100)
      : Math.min((leaderValue / value) * 100, 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02, duration: 0.25 }}
    >
      <Link
        to={`/tourhub/player/${player.id}`}
        className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 border-b border-border/50 last:border-0 active:scale-[0.98] transition-transform"
      >
        {/* Rank */}
        <span className="w-8 text-center font-mono text-sm font-semibold text-muted-foreground">
          {displayRank}
        </span>

        {/* Avatar */}
        <SquircleAvatar
          src={photoUrl}
          alt={player.fullName}
          size="sm"
          hideRing
        />

        {/* Info + stat bar */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {player.fullName}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {flag} {countryName}
          </p>
          {/* Relative stat bar */}
          <div className="mt-1 h-1 rounded-full bg-muted/50 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${barPercent}%`,
                backgroundColor: category.accentColor,
                opacity: 0.6,
              }}
            />
          </div>
        </div>

        {/* Stat value */}
        <div className="flex items-baseline gap-1 shrink-0">
          <span className="font-mono text-sm font-bold text-foreground">
            {fmt(value)}
          </span>
          {unit && (
            <span className="text-[10px] text-muted-foreground">{unit}</span>
          )}
        </div>

        {/* Chevron */}
        <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
      </Link>
    </motion.div>
  );
}
