/**
 * LeaderRow — Matches OWGR leaderboard style on overview page.
 * 44×44 avatars, 13px border-radius, JetBrains Mono stat values.
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
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
  const fmt = formatOverride ?? category.format;
  const unit = unitOverride ?? category.unit;
  const formattedStat = fmt(value);

  const ariaLabel = `Rank ${displayRank}, ${player.fullName}, ${formattedStat}${unit ? ` ${unit}` : ''}`;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.3), duration: 0.25 }}
    >
      <Link
        to={`/tourhub/player/${player.id}`}
        className="flex items-center hover:bg-muted/30 active:scale-[0.98] transition-transform"
        style={{
          padding: '12px 16px',
          minHeight: 64,
          borderBottom: '1px solid hsl(var(--border) / 0.15)',
          gap: 12,
        }}
        aria-label={ariaLabel}
      >
        {/* Rank */}
        <span
          style={{
            width: 32,
            textAlign: 'center',
            fontSize: 14,
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
            color: 'hsl(var(--muted-foreground) / 0.6)',
          }}
        >
          {displayRank}
        </span>

        {/* Avatar — 44×44 */}
        <div className="shrink-0" style={{ width: 44, height: 44 }}>
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={player.fullName}
              onError={(e) => { (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL; }}
              style={{
                width: 44,
                height: 44,
                borderRadius: '34%',
                objectFit: 'cover',
                border: '1px solid hsl(var(--border) / 0.5)',
              }}
            />
          ) : (
            <div
              className="flex items-center justify-center bg-muted"
              style={{
                width: 44,
                height: 44,
                borderRadius: '34%',
                border: '1px solid hsl(var(--border) / 0.5)',
              }}
            >
              <span className="text-muted-foreground text-xs font-semibold">
                {player.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-center" style={{ gap: 1 }}>
          <p style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.2px' }} className="text-foreground truncate leading-tight">
            {player.fullName}
          </p>
          <div className="flex items-center gap-1.5">
            <CountryFlag country={player.countryCode || player.country} size="sm" />
            {player.country && (
              <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground) / 0.6)' }}>
                {player.country}
              </span>
            )}
          </div>
        </div>

        {/* Stat value */}
        <div className="text-right shrink-0">
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
            }}
            className="text-foreground"
          >
            {formattedStat}
          </span>
          {unit && (
            <p
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.5px',
                textTransform: 'uppercase' as const,
                marginTop: 2,
              }}
              className="text-muted-foreground/60"
            >
              {unit}
            </p>
          )}
        </div>

        {/* Chevron */}
        <ChevronRight className="shrink-0" style={{ width: 14, height: 14, color: 'hsl(var(--muted-foreground) / 0.5)' }} />
      </Link>
    </motion.div>
  );
}
