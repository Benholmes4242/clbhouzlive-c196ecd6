/**
 * LeaderRow — Card-style layout matching PlayerCardV2.
 * 120px fixed height, 140px photo left, info right.
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import { titleCaseCountry } from '../../utils/countryFlags';
import CountryFlag from '@/components/ui/country-flag';
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
    tourCodes?: string[] | null;
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
  const photoUrl = getPlayerHeadshotUrl(player.fullName, player.tourCodes?.[0] ?? 'pga');
  const countryName = titleCaseCountry(player.country);
  const fmt = formatOverride ?? category.format;
  const unit = unitOverride ?? category.unit;
  const formattedStat = fmt(value);

  const ariaLabel = `Rank ${displayRank}, ${player.fullName}, ${countryName || 'Unknown'}, ${formattedStat}${unit ? ` ${unit}` : ''}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 20) * 0.015, duration: 0.25, ease: 'easeOut' }}
      style={{ marginBottom: 8 }}
    >
      <Link
        to={`/tourhub/player/${player.id}`}
        aria-label={ariaLabel}
        className={cn(
          "flex overflow-hidden",
          "bg-card rounded-2xl border border-border/50",
          "shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
          "active:scale-[0.98] transition-all"
        )}
        style={{ height: '120px', minHeight: '120px' }}
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
              <CountryFlag country={player.countryCode || player.country} size="sm" />
              <span style={{ fontSize: '13px', fontWeight: 400 }} className="text-muted-foreground truncate">{countryName}</span>
            </div>
          )}

          {/* Rank + Stat line */}
          <p className="text-muted-foreground truncate" style={{ fontSize: '13px', fontWeight: 500, marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
            <span className="font-semibold text-foreground">#{displayRank}</span>
            {' · '}
            <span className="font-semibold text-foreground">{formattedStat}</span>
            {unit && (
              <span className="text-muted-foreground"> {unit}</span>
            )}
          </p>
        </div>

        {/* Chevron */}
        <div className="flex items-center pr-3 shrink-0">
          <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
        </div>
      </Link>
    </motion.div>
  );
}
