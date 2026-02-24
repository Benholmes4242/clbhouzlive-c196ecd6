/**
 * LeaderRow — Matches OWGR leaderboard style on overview page.
 * 44×44 avatars, 13px border-radius, JetBrains Mono stat values.
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
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
  const flag = countryCodeToFlag(player.countryCode);
  const countryName = titleCaseCountry(player.country);
  const fmt = formatOverride ?? category.format;
  const unit = unitOverride ?? category.unit;
  const formattedStat = fmt(value);

  const ariaLabel = `Rank ${displayRank}, ${player.fullName}, ${countryName || 'Unknown'}, ${formattedStat}${unit ? ` ${unit}` : ''}`;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02, duration: 0.25 }}
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
        {/* Rank — 14px, 600, muted/50, 32px wide, centered */}
        <span
          style={{
            width: 32,
            textAlign: 'center',
            fontSize: 14,
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
            color: 'hsl(var(--muted-foreground) / 0.5)',
          }}
        >
          {displayRank}
        </span>

        {/* Avatar — 44×44, border-radius 13px */}
        <div className="shrink-0" style={{ width: 44, height: 44 }}>
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={player.fullName}
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
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
                borderRadius: 12,
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
          <p style={{ fontSize: 14, fontWeight: 600 }} className="text-foreground truncate leading-tight">
            {player.fullName}
          </p>
          <div className="flex items-center gap-1.5">
            {flag && <span className="text-xs leading-none">{flag}</span>}
            <span style={{ fontSize: 11, fontWeight: 400 }} className="text-muted-foreground truncate">{countryName}</span>
          </div>
        </div>

        {/* Stat value — JetBrains Mono, 15px, 700, tabular-nums */}
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
                fontSize: 9,
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

        {/* Chevron — 3.5, muted/25 */}
        <ChevronRight className="shrink-0" style={{ width: 14, height: 14, color: 'hsl(var(--muted-foreground) / 0.25)' }} />
      </Link>
    </motion.div>
  );
}
