/**
 * FeaturedPlayersCarousel - Horizontal featured player strip
 * Shows dynamic selection: Top ranked, most wins, most active, rising stars
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TourPlayer, TourPlayerStatistics } from '../../hooks/useTourHubData';
import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';

interface FeaturedPlayerCardProps {
  player: TourPlayer;
  stats?: TourPlayerStatistics;
  highlight: string;
  className?: string;
}

// Cinematic gradient patterns
const cardGradients = [
  'from-emerald-800/90 via-emerald-700/70 to-teal-800/80',
  'from-slate-800/90 via-slate-700/70 to-zinc-800/80',
  'from-amber-800/80 via-orange-800/60 to-yellow-900/70',
  'from-blue-800/90 via-blue-700/70 to-indigo-800/80',
  'from-rose-800/80 via-pink-800/60 to-red-900/70',
];

function FeaturedPlayerCard({ player, stats, highlight, className }: FeaturedPlayerCardProps) {
  const initials = player.full_name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const gradientIndex = player.full_name.length % cardGradients.length;

  return (
    <Link
      to={`/tourhub/player/${player.id}`}
      className={cn(
        "group relative flex-shrink-0 w-36 h-44 rounded-xl overflow-hidden transition-all snap-start",
        "hover:scale-[1.02] shadow-lg hover:shadow-xl",
        className
      )}
    >
      {/* Background gradient */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br",
        cardGradients[gradientIndex]
      )} />

      {/* Texture overlay */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 160 192" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id={`player-dots-${player.id}`} x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="8" cy="8" r="0.8" fill="white" />
            </pattern>
          </defs>
          <rect width="160" height="192" fill={`url(#player-dots-${player.id})`} />
        </svg>
      </div>

      {/* Dark gradient for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Avatar or initials */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2">
        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden border-2 border-white/30">
          {resolvePhotoUrl(player.photo_url) ? (
            <img 
              src={resolvePhotoUrl(player.photo_url)!} 
              alt={player.full_name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="text-lg font-bold text-white">{initials}</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-3 text-center">
        <h3 className="font-semibold text-white text-sm leading-tight line-clamp-2 mb-0.5">
          {player.full_name}
        </h3>
        {player.country && (
          <p className="text-white/70 text-xs mb-2">{player.country}</p>
        )}
        <span className="inline-block px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[10px] font-medium">
          {highlight}
        </span>
      </div>

      {/* Hover indicator */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight className="w-4 h-4 text-white/80" />
      </div>
    </Link>
  );
}

interface FeaturedPlayersCarouselProps {
  players: TourPlayer[];
  stats: TourPlayerStatistics[];
}

export function FeaturedPlayersCarousel({ players, stats }: FeaturedPlayersCarouselProps) {
  // Build featured players list with dynamic highlights
  const featuredPlayers = useMemo(() => {
    const featured: { player: TourPlayer; stats?: TourPlayerStatistics; highlight: string }[] = [];
    
    // Create a map of player stats for quick lookup
    const statsMap = new Map(stats.map(s => [s.player_id, s]));
    
    // Helper to extract world rank from raw_data
    const getWorldRank = (s: TourPlayerStatistics): number | null => {
      const rawData = s as unknown as { raw_data?: { statistics?: { world_rank?: number } } };
      const rank = rawData?.raw_data?.statistics?.world_rank;
      return typeof rank === 'number' && rank >= 1 ? rank : null;
    };
    
    // Top ranked players (by OWGR world_rank from raw_data)
    const topRanked = stats
      .filter(s => getWorldRank(s) && s.player)
      .sort((a, b) => (getWorldRank(a) || 999) - (getWorldRank(b) || 999))
      .slice(0, 3);
    
    topRanked.forEach(s => {
      if (s.player) {
        featured.push({
          player: s.player,
          stats: s,
          highlight: `World #${getWorldRank(s)}`,
        });
      }
    });

    // Most wins
    const mostWins = stats
      .filter(s => s.wins && s.wins > 0 && s.player)
      .sort((a, b) => (b.wins || 0) - (a.wins || 0))
      .slice(0, 1);
    
    mostWins.forEach(s => {
      if (s.player && !featured.some(f => f.player.id === s.player?.id)) {
        featured.push({
          player: s.player,
          stats: s,
          highlight: `${s.wins} win${(s.wins || 0) > 1 ? 's' : ''} this season`,
        });
      }
    });

    // Most active (events played)
    const mostActive = stats
      .filter(s => s.events_played && s.player)
      .sort((a, b) => (b.events_played || 0) - (a.events_played || 0))
      .slice(0, 1);
    
    mostActive.forEach(s => {
      if (s.player && !featured.some(f => f.player.id === s.player?.id)) {
        featured.push({
          player: s.player,
          stats: s,
          highlight: `${s.events_played} events played`,
        });
      }
    });

    // Rising star (newest pro with stats)
    const risingStars = players
      .filter(p => p.turned_pro && p.turned_pro >= 2020)
      .sort((a, b) => (b.turned_pro || 0) - (a.turned_pro || 0))
      .slice(0, 2);

    risingStars.forEach(p => {
      if (!featured.some(f => f.player.id === p.id)) {
        featured.push({
          player: p,
          stats: statsMap.get(p.id),
          highlight: `Pro since ${p.turned_pro}`,
        });
      }
    });

    // Fill to at least 5 if we have more players
    if (featured.length < 5) {
      const remaining = players
        .filter(p => !featured.some(f => f.player.id === p.id))
        .slice(0, 5 - featured.length);
      
      remaining.forEach(p => {
        featured.push({
          player: p,
          stats: statsMap.get(p.id),
          highlight: p.country || 'PGA Tour',
        });
      });
    }

    return featured.slice(0, 5);
  }, [players, stats]);

  if (featuredPlayers.length === 0) return null;

  return (
    <div className="relative -mx-4 px-4">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-3 snap-x snap-mandatory">
        {featuredPlayers.map(({ player, stats, highlight }) => (
          <FeaturedPlayerCard
            key={player.id}
            player={player}
            stats={stats}
            highlight={highlight}
          />
        ))}
      </div>
    </div>
  );
}
