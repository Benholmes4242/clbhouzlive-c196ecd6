/**
 * PlayersWorldsBest - Top 5 world-ranked players showcase.
 * Light-mode, semantic tokens, SquircleAvatar with R2 photos.
 */

import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import { countryCodeToFlag, titleCaseCountry } from '../../utils/countryFlags';
import type { ElitePlayer } from '../../hooks/useElitePlayers';

interface PlayersWorldsBestProps {
  players: ElitePlayer[];
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function getRankBadgeClasses(rank: number): string {
  if (rank === 1) return 'bg-gradient-to-br from-amber-300 to-amber-500 text-amber-900';
  if (rank === 2) return 'bg-gradient-to-br from-slate-300 to-slate-400 text-white';
  if (rank === 3) return 'bg-gradient-to-br from-amber-600 to-amber-700 text-white';
  return 'bg-muted text-muted-foreground';
}

/** #1 Champion card */
function ChampionCard({ player }: { player: ElitePlayer }) {
  const photoUrl = getPlayerHeadshotUrl(player.playerName, 'pga');
  const flag = countryCodeToFlag(player.countryCode);
  const country = titleCaseCountry(player.country);
  const initials = getInitials(player.playerName);

  return (
    <Link
      to={`/tourhub/player/${player.playerId}`}
      className="block active:scale-[0.98] transition-transform"
    >
      <div className={cn(
        "relative overflow-hidden rounded-2xl p-5",
        "bg-card border border-border"
      )}>
        {/* Subtle amber gradient for world #1 */}
        <div className="absolute inset-0 bg-gradient-to-l from-amber-50 to-transparent pointer-events-none" />

        <div className="relative flex items-center gap-4">
          {/* Rank badge */}
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0",
            getRankBadgeClasses(1)
          )}>
            1
          </div>

          {/* Avatar */}
          <SquircleAvatar
            src={photoUrl}
            alt={player.playerName}
            fallback={initials}
            size="xl"
            hideRing
            className="ring-2 ring-amber-400/40 ring-offset-2 ring-offset-card"
          />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-foreground">{player.playerName}</h3>
            <div className="flex items-center gap-1.5 mt-1">
              {flag && <span className="text-lg leading-none">{flag}</span>}
              <span className="text-sm text-muted-foreground">{country}</span>
            </div>
            {player.avgPoints != null && (
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="font-mono text-lg font-bold text-amber-600">
                  {player.avgPoints.toFixed(2)}
                </span>
                <span className="text-xs text-muted-foreground">avg pts</span>
              </div>
            )}
          </div>

          <ChevronRight className="w-5 h-5 text-muted-foreground/50 shrink-0" />
        </div>
      </div>
    </Link>
  );
}

/** #2-5 Runner cards in horizontal scroll */
function RunnerCard({ player }: { player: ElitePlayer }) {
  const photoUrl = getPlayerHeadshotUrl(player.playerName, 'pga');
  const flag = countryCodeToFlag(player.countryCode);
  const country = titleCaseCountry(player.country);
  const initials = getInitials(player.playerName);

  return (
    <Link
      to={`/tourhub/player/${player.playerId}`}
      className="block flex-shrink-0 active:scale-[0.97] transition-transform"
    >
      <div className={cn(
        "relative w-[150px] bg-card border border-border rounded-xl p-3 text-center"
      )}>
        {/* Rank badge */}
        <div className={cn(
          "absolute -top-1 -left-1 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold z-10",
          getRankBadgeClasses(player.worldRank)
        )}>
          {player.worldRank}
        </div>

        {/* Avatar centered */}
        <div className="flex justify-center">
          <SquircleAvatar
            src={photoUrl}
            alt={player.playerName}
            fallback={initials}
            size="md"
            hideRing
          />
        </div>

        {/* Name */}
        <p className="text-sm font-semibold text-foreground truncate mt-2">
          {player.playerName}
        </p>

        {/* Country */}
        <div className="flex items-center justify-center gap-1 mt-0.5">
          {flag && <span className="text-xs leading-none">{flag}</span>}
          <span className="text-xs text-muted-foreground truncate">{country}</span>
        </div>

        {/* Points */}
        {player.avgPoints != null && (
          <div className="flex items-baseline justify-center gap-1 mt-1.5">
            <span className="font-mono text-base font-bold text-foreground">
              {player.avgPoints.toFixed(1)}
            </span>
            <span className="text-[10px] text-muted-foreground">pts</span>
          </div>
        )}
      </div>
    </Link>
  );
}

export function PlayersWorldsBest({ players }: PlayersWorldsBestProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (players.length === 0) return null;

  const champion = players[0];
  const runners = players.slice(1, 5);

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-amber-400" />
          <h2 className="text-lg font-bold text-foreground tracking-tight">
            World's Best
          </h2>
        </div>
        <Link
          to="/tourhub?tab=players&tier=elite"
          className="text-sm font-medium text-primary flex items-center gap-0.5 active:scale-[0.95] transition-transform"
        >
          View All
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Champion card */}
      <ChampionCard player={champion} />

      {/* Runners carousel */}
      {runners.length > 0 && (
        <div className="-mx-4">
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2"
          >
            {runners.map((player) => (
              <RunnerCard key={player.playerId} player={player} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
