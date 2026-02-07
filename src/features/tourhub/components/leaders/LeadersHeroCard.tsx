/**
 * LeadersHeroCard — Showcase card for the #1 player in a category.
 * Light-mode, semantic tokens, SquircleAvatar.
 */

import { Link } from 'react-router-dom';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';
import { countryCodeToFlag, titleCaseCountry } from '../../utils/countryFlags';
import type { LeaderCategory } from './constants';

interface LeadersHeroCardProps {
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

export function LeadersHeroCard({ player, value, category }: LeadersHeroCardProps) {
  const photoUrl = resolvePhotoUrl(player.photoUrl, player.pgaTourId);
  const flag = countryCodeToFlag(player.countryCode);
  const countryName = titleCaseCountry(player.country);

  return (
    <Link
      to={`/tourhub/player/${player.id}`}
      className="block active:scale-[0.98] transition-transform"
    >
      <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden">
        {/* Subtle amber accent */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-amber-50/50 to-transparent pointer-events-none" />

        {/* Category label */}
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 relative">
          {category.label} Leader
        </p>

        <div className="flex items-center gap-5 relative">
          {/* Rank badge */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center shadow-md shrink-0">
            <span className="text-lg font-bold text-amber-900">1</span>
          </div>

          {/* Avatar */}
          <SquircleAvatar
            src={photoUrl}
            alt={player.fullName}
            size="xl"
            hideRing
            className="ring-2 ring-amber-400/30 ring-offset-2 ring-offset-[hsl(var(--card))]"
          />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-foreground truncate">
              {player.fullName}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {flag} {countryName}
            </p>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-mono text-2xl font-bold text-foreground">
                {category.format(value)}
              </span>
              {category.unit && (
                <span className="text-sm text-muted-foreground">{category.unit}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
