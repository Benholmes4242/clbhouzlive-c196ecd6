/**
 * WorldRankingsSection - Prestige treatment for world rankings
 * Top 3 with medal glows (gold/silver/bronze), oversized rank, larger cards
 * Remaining as refined list rows with more padding
 */

import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTopWorldRanked, toTitleCase, getInitials } from '../../hooks/useWorldRankings';
import { cn } from '@/lib/utils';

// Medal glow colors per spec
const medalStyles = {
  1: {
    glow: 'shadow-[0_0_20px_rgba(251,191,36,0.4)]',
    bg: 'bg-gradient-to-br from-amber-100 via-yellow-50 to-amber-100',
    border: 'border-2 border-amber-400',
    rankColor: 'text-amber-500',
    avatarRing: 'ring-2 ring-amber-400',
    avatarBg: 'bg-gradient-to-br from-amber-100 to-yellow-200',
  },
  2: {
    glow: 'shadow-[0_0_16px_rgba(148,163,184,0.35)]',
    bg: 'bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100',
    border: 'border-2 border-slate-300',
    rankColor: 'text-slate-400',
    avatarRing: 'ring-2 ring-slate-300',
    avatarBg: 'bg-gradient-to-br from-slate-100 to-slate-200',
  },
  3: {
    glow: 'shadow-[0_0_16px_rgba(180,83,9,0.3)]',
    bg: 'bg-gradient-to-br from-orange-100 via-amber-50 to-orange-100',
    border: 'border-2 border-amber-600/50',
    rankColor: 'text-amber-700',
    avatarRing: 'ring-2 ring-amber-600/50',
    avatarBg: 'bg-gradient-to-br from-orange-100 to-amber-200',
  },
};

export function WorldRankingsSection() {
  const { data: topPlayers, isLoading } = useTopWorldRanked(10);

  if (isLoading) {
    return (
      <section className="bg-slate-50 -mx-4 sm:-mx-6 px-4 sm:px-6 py-8">
        <div className="animate-pulse">
          <div className="h-4 w-40 bg-slate-200 rounded mb-6" />
          <div className="flex gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex-shrink-0 w-[150px] h-[190px] bg-slate-100 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (topPlayers.length === 0) return null;

  const top3 = topPlayers.slice(0, 3);
  const remaining = topPlayers.slice(3, 8);

  return (
    <section className="bg-slate-50 -mx-4 sm:-mx-6 px-4 sm:px-6 py-8">
      {/* Header - matching Schedule page section headers */}
      <div className="flex items-center justify-between mb-6">
        <h3 
          className="font-extrabold text-slate-800 uppercase"
          style={{ fontSize: '13px', letterSpacing: '0.08em' }}
        >
          World Rankings
        </h3>
        <Link 
          to="/tourhub?tab=players"
          className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 transition-colors"
        >
          All Rankings <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      
      {/* Top 3 - Larger cards with medal glows */}
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
        {top3.map((player, index) => {
          const rank = index + 1 as 1 | 2 | 3;
          const style = medalStyles[rank];
          
          return (
            <motion.div
              key={player.playerId}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              <Link
                to={`/tourhub/player/${player.playerId}`}
                className="flex-shrink-0 w-[150px] group block"
              >
                <div 
                  className={cn(
                    "h-[200px] rounded-xl p-4 flex flex-col relative overflow-hidden",
                    "bg-white transition-all duration-300",
                    style.border,
                    style.glow,
                    "group-hover:shadow-lg"
                  )}
                >
                  {/* Oversized rank number - low opacity background */}
                  <span 
                    className={cn(
                      "absolute top-2 right-2 text-6xl font-black leading-none opacity-10",
                      style.rankColor
                    )}
                  >
                    {player.worldRank}
                  </span>
                  
                  {/* Rank badge */}
                  <span 
                    className={cn(
                      "text-2xl font-extrabold leading-none flex-shrink-0 z-10",
                      style.rankColor
                    )}
                  >
                    #{player.worldRank}
                  </span>
                  
                  {/* Avatar - centered, larger */}
                  <div className="flex-shrink-0 flex justify-center mt-3">
                    <div 
                      className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center overflow-hidden",
                        style.avatarRing,
                        style.avatarBg
                      )}
                    >
                      {player.photoUrl ? (
                        <img 
                          src={player.photoUrl}
                          alt={player.playerName}
                          className="w-full h-full rounded-full object-cover object-top"
                        />
                      ) : (
                        <span className={cn("text-sm font-bold", style.rankColor)}>
                          {getInitials(player.playerName)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Name */}
                  <div className="flex-shrink-0 h-[40px] flex items-start justify-center mt-3">
                    <p className="text-sm font-semibold text-foreground text-center leading-tight line-clamp-2">
                      {player.playerName}
                    </p>
                  </div>

                  {/* Country */}
                  <p className="flex-shrink-0 text-[11px] text-muted-foreground text-center mt-auto">
                    {toTitleCase(player.country) || 'Unknown'}
                  </p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Remaining Rankings - List rows with more padding */}
      {remaining.length > 0 && (
        <div className="mt-4 space-y-1">
          {remaining.map((player, index) => (
            <Link
              key={player.playerId}
              to={`/tourhub/player/${player.playerId}`}
              className="flex items-center gap-3 py-3.5 px-3 -mx-3 rounded-lg transition-colors hover:bg-slate-100/80 group"
            >
              {/* Avatar - slightly larger */}
              <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
                {player.photoUrl ? (
                  <img 
                    src={player.photoUrl}
                    alt={player.playerName}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xs font-bold text-slate-400">
                      {getInitials(player.playerName)}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Name & Country */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate group-hover:text-primary transition-colors">
                  {player.playerName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {toTitleCase(player.country) || 'Unknown'}
                </p>
              </div>
              
              {/* Rank - right aligned, bold but quiet */}
              <span className="text-base font-bold text-slate-300 flex-shrink-0">
                #{player.worldRank}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
