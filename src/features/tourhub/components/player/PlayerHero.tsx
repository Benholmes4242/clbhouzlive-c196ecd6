/**
 * PlayerHero - Premium profile header with SquircleAvatar,
 * country flag emoji, rank badges, and clean stat boxes.
 */

import { Globe } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { cn } from '@/lib/utils';
import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';
import { countryCodeToFlag, titleCaseCountry } from '../../utils/countryFlags';
import type { TourPlayer, TourPlayerStatistics } from '../../hooks/useTourHubData';

interface HeroStatProps {
  label: string;
  value: string | number | null;
  highlight?: boolean;
}

function HeroStat({ label, value, highlight = false }: HeroStatProps) {
  const hasValue = value !== null && value !== '—' && value !== undefined;

  return (
    <div className={cn(
      "text-center px-3 py-4 rounded-xl transition-all",
      highlight && hasValue
        ? "bg-amber-500/10 border border-amber-500/20"
        : "bg-muted/40 border border-border/50"
    )}>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
        {label}
      </span>
      <span className={cn(
        "text-xl font-bold font-mono block",
        hasValue ? (highlight ? "text-amber-500" : "text-foreground") : "text-muted-foreground"
      )}>
        {hasValue ? value : '—'}
      </span>
    </div>
  );
}

interface PlayerHeroProps {
  player: TourPlayer;
  playerStats: TourPlayerStatistics | null;
}

export function PlayerHero({ player, playerStats }: PlayerHeroProps) {
  const photoUrl = resolvePhotoUrl(player.photo_url, player.pga_tour_id);

  const initials = player.full_name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const age = player.birth_date
    ? Math.floor((Date.now() - new Date(player.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const flag = countryCodeToFlag(player.country_code);
  const countryDisplay = player.country ? titleCaseCountry(player.country) : null;
  const isWorldNo1 = playerStats?.world_rank === 1;

  return (
    <div className={cn(
      "relative rounded-2xl overflow-hidden bg-card border shadow-sm",
      isWorldNo1 ? "border-amber-300/60" : "border-border/50"
    )}>
      {/* World #1 top accent bar */}
      {isWorldNo1 && (
        <div className="h-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400" />
      )}

      <div className="relative px-6 py-8">
        {/* Avatar + Name row */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-6">
          <div className="flex items-center gap-5">
            <SquircleAvatar
              src={photoUrl}
              alt={player.full_name}
              fallback={initials}
              size="2xl"
              enableGlow={isWorldNo1}
              hideRing
            />

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1.5">
                {player.full_name}
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {countryDisplay && (
                  <span className="flex items-center gap-1.5">
                    {flag ? (
                      <span className="text-lg leading-none">{flag}</span>
                    ) : (
                      <Globe className="w-4 h-4" />
                    )}
                    {countryDisplay}
                  </span>
                )}
                {age && (
                  <>
                    <span className="text-border">•</span>
                    <span>Age {age}</span>
                  </>
                )}
              </div>

              {/* Rank pills */}
              <div className="flex flex-wrap gap-2 mt-2.5">
                {playerStats?.world_rank && playerStats.world_rank > 0 && (
                  <span className={cn(
                    "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border",
                    isWorldNo1
                      ? "bg-amber-50 border-amber-200 text-amber-700"
                      : "bg-primary/5 border-primary/20 text-primary"
                  )}>
                    #{playerStats.world_rank} World
                  </span>
                )}
                {playerStats?.fedex_rank && playerStats.fedex_rank > 0 && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-primary/5 border border-primary/20 text-primary">
                    #{playerStats.fedex_rank} FedEx
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <HeroStat
            label="World Rank"
            value={playerStats?.world_rank && playerStats.world_rank > 0 ? `#${playerStats.world_rank}` : null}
            highlight={isWorldNo1}
          />
          <HeroStat
            label="FedEx Rank"
            value={playerStats?.fedex_rank && playerStats.fedex_rank > 0 ? `#${playerStats.fedex_rank}` : null}
          />
          <HeroStat
            label="Season Wins"
            value={playerStats?.wins != null ? playerStats.wins : null}
            highlight={!!(playerStats?.wins && playerStats.wins > 0)}
          />
          <HeroStat
            label="Events"
            value={playerStats?.events_played ?? null}
          />
        </div>
      </div>
    </div>
  );
}
