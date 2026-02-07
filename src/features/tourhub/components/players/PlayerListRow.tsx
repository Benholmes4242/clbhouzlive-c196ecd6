/**
 * PlayerListRow - Clean, reusable player row for all tier views.
 * Uses SquircleAvatar, semantic tokens, countryCodeToFlag.
 */

import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';
import { countryCodeToFlag, titleCaseCountry } from '../../utils/countryFlags';

function getRankBadgeClasses(rank: number): string {
  if (rank === 1) return 'bg-gradient-to-br from-amber-300 to-amber-500 text-amber-900';
  if (rank === 2) return 'bg-gradient-to-br from-slate-300 to-slate-400 text-white';
  if (rank === 3) return 'bg-gradient-to-br from-amber-600 to-amber-700 text-white';
  if (rank <= 10) return 'bg-foreground/10 text-foreground';
  return 'bg-muted text-muted-foreground';
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
  statValue?: string;
  statLabel?: string;
  variant?: 'default' | 'ranked';
}

export function PlayerListRow({
  player,
  rank,
  statValue,
  statLabel,
  variant = 'default',
}: PlayerListRowProps) {
  const photoUrl = resolvePhotoUrl(player.photoUrl, player.pgaTourId);
  const flag = countryCodeToFlag(player.countryCode);
  const countryName = titleCaseCountry(player.country);

  const initials = player.fullName
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Link
      to={`/tourhub/player/${player.id}`}
      className={cn(
        "flex items-center gap-3 px-4 py-3.5",
        "bg-card hover:bg-muted/50",
        "border-b border-border/50 last:border-0",
        "active:scale-[0.98] transition-transform"
      )}
    >
      {/* Rank badge */}
      {variant === 'ranked' && rank != null && (
        <div className={cn(
          "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
          getRankBadgeClasses(rank)
        )}>
          {rank}
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
        <h3 className="text-sm font-semibold text-foreground truncate">
          {player.fullName}
        </h3>
        {countryName && (
          <div className="flex items-center gap-1.5 mt-0.5">
            {flag && <span className="text-sm leading-none">{flag}</span>}
            <span className="text-xs text-muted-foreground truncate">{countryName}</span>
          </div>
        )}
      </div>

      {/* Stat value */}
      {statValue && (
        <div className="text-right shrink-0">
          <p className="font-mono text-sm font-semibold text-foreground">{statValue}</p>
          {statLabel && (
            <p className="text-[10px] text-muted-foreground">{statLabel}</p>
          )}
        </div>
      )}

      {/* Chevron */}
      <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
    </Link>
  );
}
