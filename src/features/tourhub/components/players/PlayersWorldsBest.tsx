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

/** #1 Champion card */
function ChampionCard({ player }: { player: ElitePlayer }) {
  const photoUrl = getPlayerHeadshotUrl(player.playerName, player.tourCode ?? 'pga');
  const flag = countryCodeToFlag(player.countryCode);
  const country = titleCaseCountry(player.country);
  const initials = getInitials(player.playerName);

  return (
    <Link
      to={`/tourhub/player/${player.playerId}`}
      className="block active:scale-[0.98] transition-transform"
    >
      <div className="relative overflow-hidden rounded-2xl p-5 bg-card border border-border">
        <div className="relative flex items-center gap-4">
          {/* Rank number — plain, amber */}
          <span
            className="flex-shrink-0"
            style={{
              width: 20,
              fontSize: 13,
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              color: 'hsl(var(--accent-amber))',
            }}
          >
            1
          </span>

          {/* Avatar */}
          <SquircleAvatar
            src={photoUrl}
            alt={player.playerName}
            fallback={initials}
            size="xl"
            hideRing
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
  const photoUrl = getPlayerHeadshotUrl(player.playerName, player.tourCode ?? 'pga');
  const flag = countryCodeToFlag(player.countryCode);
  const country = titleCaseCountry(player.country);
  const initials = getInitials(player.playerName);

  return (
    <Link
      to={`/tourhub/player/${player.playerId}`}
      className="block flex-shrink-0 active:scale-[0.97] transition-transform"
    >
      <div className="relative w-[150px] bg-card border border-border rounded-xl p-3 text-center">
        {/* Rank number — plain, amber for #1 else muted */}
        <span
          className="absolute top-2 left-2.5"
          style={{
            fontSize: 11,
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            color: player.worldRank === 1
              ? 'hsl(var(--accent-amber))'
              : 'hsl(var(--muted-foreground))',
          }}
        >
          {player.worldRank}
        </span>

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
          className="text-sm font-medium text-primary flex items-center gap-0.5 active:scale-[0.95] transition-transform focus:outline-none focus-visible:outline-none"
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
            {runners.map((player, index) => (
              <RunnerCard key={player.playerId} player={player} displayRank={index + 2} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
