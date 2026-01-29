/**
 * WorldRankShowcase - Premium horizontal showcase of top 10 world-ranked players
 * 200px × 280px rich cards with player images, rank badges, country flags
 * Per Apple-grade redesign spec
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTopWorldRanked, toTitleCase, getInitials } from '../../hooks/useWorldRankings';
import { RankBadge } from '../premium';
import { Trophy } from 'lucide-react';

// Country code to flag emoji mapping (simplified)
function getCountryFlag(countryCode: string): string {
  const countryToFlag: Record<string, string> = {
    'USA': '🇺🇸', 'US': '🇺🇸',
    'ENG': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'UK': '🇬🇧', 'GBR': '🇬🇧',
    'NIR': '🇬🇧', // Northern Ireland
    'SCO': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    'ESP': '🇪🇸',
    'JPN': '🇯🇵',
    'KOR': '🇰🇷',
    'AUS': '🇦🇺',
    'RSA': '🇿🇦', 'ZAF': '🇿🇦',
    'SWE': '🇸🇪',
    'NOR': '🇳🇴',
    'IRL': '🇮🇪',
    'FRA': '🇫🇷',
    'GER': '🇩🇪', 'DEU': '🇩🇪',
    'CAN': '🇨🇦',
    'MEX': '🇲🇽',
    'ARG': '🇦🇷',
    'CHI': '🇨🇱', 'CHL': '🇨🇱',
    'COL': '🇨🇴',
    'IND': '🇮🇳',
    'CHN': '🇨🇳',
    'THA': '🇹🇭',
    'PHI': '🇵🇭', 'PHL': '🇵🇭',
    'NZL': '🇳🇿',
    'DEN': '🇩🇰', 'DNK': '🇩🇰',
    'BEL': '🇧🇪',
    'ITA': '🇮🇹',
    'AUT': '🇦🇹',
    'FIN': '🇫🇮',
    'POL': '🇵🇱',
    'TWN': '🇹🇼',
  };
  return countryToFlag[countryCode?.toUpperCase()] || '🏳️';
}

interface WorldRankCardProps {
  player: {
    playerId: string;
    playerName: string;
    country: string | null;
    photoUrl: string | null;
    avgPoints?: number;
    worldRank: number;
  };
  rank: number;
}

function WorldRankCard({ player, rank }: WorldRankCardProps) {
  const isPodium = rank <= 3;
  const nameParts = player.playerName.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return (
    <Link
      to={`/tourhub/player/${player.playerId}`}
      className="flex-shrink-0 block group"
    >
      <motion.div
        className={cn(
          "relative w-[200px] h-[280px] rounded-[20px] overflow-hidden",
          "bg-[hsl(var(--th-bg-secondary))]",
          "transition-all duration-300",
          isPodium && "shadow-[0_8px_32px_rgba(0,0,0,0.5)]",
          !isPodium && "shadow-[0_4px_24px_rgba(0,0,0,0.3)]",
          "group-hover:scale-[1.02] group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
        )}
        whileTap={{ scale: 0.98 }}
      >
        {/* Player image */}
        <div className="absolute inset-0">
          {player.photoUrl ? (
            <img
              src={player.photoUrl}
              alt={player.playerName}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
              <span className="text-4xl font-bold text-white/30">
                {getInitials(player.playerName)}
              </span>
            </div>
          )}
        </div>

        {/* Gradient overlay */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%)'
          }}
        />

        {/* Rank badge - top left */}
        <div className="absolute top-3 left-3">
          <RankBadge rank={rank} size="lg" />
        </div>

        {/* #1 Gold glow effect */}
        {rank === 1 && (
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: 'inset 0 0 40px rgba(255,215,0,0.15)'
            }}
          />
        )}

        {/* Content - bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {/* Name */}
          <div className="mb-2">
            <p className="text-white/70 text-sm font-medium leading-tight">
              {firstName}
            </p>
            <p className="text-white text-xl font-bold leading-tight uppercase tracking-tight">
              {lastName}
            </p>
          </div>

          {/* Country */}
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-base">
              {getCountryFlag(player.country || '')}
            </span>
            <span className="text-white/60 text-xs">
              {toTitleCase(player.country) || 'Unknown'}
            </span>
          </div>

          {/* Avg points */}
          {player.avgPoints && (
            <div className="text-white/80 text-sm">
              <span className="font-mono font-bold">{player.avgPoints.toFixed(2)}</span>
              <span className="text-white/50 text-xs ml-1">avg pts</span>
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

export function WorldRankShowcase() {
  const { data: topPlayers, isLoading } = useTopWorldRanked(10);

  if (isLoading) {
    return (
      <section className="py-10">
        <div className="px-4 sm:px-6 mb-6">
          <div className="h-4 w-48 bg-slate-700/50 rounded animate-pulse" />
        </div>
        <div className="flex gap-4 overflow-hidden px-4 sm:px-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex-shrink-0 w-[200px] h-[280px] bg-slate-800/50 rounded-[20px] animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (topPlayers.length === 0) return null;

  return (
    <section className="py-10 bg-[hsl(var(--th-bg-canvas))]">
      {/* Section header */}
      <div className="px-4 sm:px-6 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-[hsl(var(--th-accent-gold))]" />
          <h2 className="th-caption-2 text-white/70">
            OFFICIAL WORLD GOLF RANKING
          </h2>
        </div>
        <Link 
          to="/tourhub?tab=players"
          className="text-xs text-white/50 hover:text-white/80 transition-colors"
        >
          View All →
        </Link>
      </div>

      {/* Horizontal scroll of cards */}
      <div className="flex gap-4 overflow-x-auto px-4 sm:px-6 pb-4 scrollbar-hide">
        {topPlayers.map((player, index) => (
          <motion.div
            key={player.playerId}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ 
              duration: 0.4, 
              delay: index * 0.05,
              ease: [0.16, 1, 0.3, 1]
            }}
          >
            <WorldRankCard 
              player={player} 
              rank={index + 1} 
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
