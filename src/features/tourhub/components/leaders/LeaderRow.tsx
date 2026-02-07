/**
 * LeaderRow — Individual ranked player row for positions 2+.
 * Semantic tokens, font-mono stats, SquircleAvatar.
 */

import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';
import { countryCodeToFlag, titleCaseCountry } from '../../utils/countryFlags';
import type { LeaderCategory } from './constants';

interface LeaderRowProps {
  rank: number;
  player: {
    id: string;
    fullName: string;
    country?: string | null;
    countryCode?: string | null;
    photoUrl?: string | null;
    pgaTourId?: string | null;
  };
  value: number;
  category: LeaderCategory;
}

export function LeaderRow({ rank, player, value, category }: LeaderRowProps) {
  const photoUrl = resolvePhotoUrl(player.photoUrl, player.pgaTourId);
  const flag = countryCodeToFlag(player.countryCode);
  const countryName = titleCaseCountry(player.country);

  return (
    <Link
      to={`/tourhub/player/${player.id}`}
      className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 border-b border-border/50 last:border-0 active:scale-[0.98] transition-transform"
    >
      {/* Rank */}
      <span className="w-8 text-center font-mono text-sm font-semibold text-muted-foreground">
        {rank}
      </span>

      {/* Avatar */}
      <SquircleAvatar
        src={photoUrl}
        alt={player.fullName}
        size="sm"
        hideRing
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {player.fullName}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {flag} {countryName}
        </p>
      </div>

      {/* Stat value */}
      <span className="font-mono text-sm font-bold text-foreground shrink-0">
        {category.format(value)}
      </span>

      {/* Chevron */}
      <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
    </Link>
  );
}
