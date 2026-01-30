/**
 * WorldRankingsShowcase - Horizontal scrolling Top 10 cards
 * Premium display with gold #1 treatment
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Trophy, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorldRankingsTop, type WorldRankedPlayer } from '../../hooks/useOverviewData';
import CountryFlag from '@/components/ui/country-flag';

function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
}

function getRankStyle(rank: number) {
  if (rank === 1) {
    return {
      badge: 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/30',
      card: 'bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200 ring-2 ring-amber-300/50',
      glow: true,
    };
  }
  if (rank === 2) {
    return {
      badge: 'bg-gradient-to-br from-slate-300 to-slate-400 text-white',
      card: 'bg-white border-slate-200',
      glow: false,
    };
  }
  if (rank === 3) {
    return {
      badge: 'bg-gradient-to-br from-amber-600 to-amber-700 text-white',
      card: 'bg-white border-slate-200',
      glow: false,
    };
  }
  return {
    badge: 'bg-slate-100 text-slate-600',
    card: 'bg-white border-slate-200',
    glow: false,
  };
}

function PlayerCard({ player, index }: { player: WorldRankedPlayer; index: number }) {
  const style = getRankStyle(player.rank);
  const isNo1 = player.rank === 1;
  
  return (
    <motion.div
      className={cn(
        "flex-shrink-0 rounded-2xl border p-4 transition-all hover:shadow-lg",
        style.card,
        isNo1 ? "w-44" : "w-36"
      )}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -4 }}
    >
      {/* Glow effect for #1 */}
      {style.glow && (
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-400/20 to-amber-600/20 rounded-2xl blur-xl -z-10" />
      )}

      {/* Avatar / Photo */}
      <div className={cn(
        "relative mx-auto mb-3 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center overflow-hidden",
        isNo1 ? "w-20 h-20" : "w-14 h-14"
      )}>
        {player.photoUrl ? (
          <img 
            src={player.photoUrl} 
            alt={player.fullName}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className={cn(
            "font-bold text-slate-500",
            isNo1 ? "text-xl" : "text-sm"
          )}>
            {getInitials(player.firstName, player.lastName)}
          </span>
        )}
        
        {/* Rank Badge */}
        <div className={cn(
          "absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full flex items-center justify-center font-bold",
          style.badge,
          isNo1 ? "w-8 h-8 text-sm" : "w-6 h-6 text-xs"
        )}>
          {player.rank === 1 && <Trophy className="h-4 w-4" />}
          {player.rank > 1 && `#${player.rank}`}
        </div>
      </div>

      {/* Name */}
      <div className="text-center">
        <p className={cn(
          "font-bold text-slate-800 line-clamp-1",
          isNo1 ? "text-base" : "text-sm"
        )}>
          {isNo1 ? player.fullName : player.lastName}
        </p>
        {!isNo1 && (
          <p className="text-xs text-slate-500">{player.firstName}</p>
        )}
      </div>

      {/* Country */}
      <div className="flex items-center justify-center gap-1.5 mt-2">
        <CountryFlag country={player.country} size="sm" />
      </div>

      {/* Points (if available) */}
      {player.avgPoints && (
        <div className="flex items-center justify-center gap-1 mt-2">
          <TrendingUp className="h-3 w-3 text-emerald-500" />
          <span className="text-xs font-medium text-slate-600">
            {player.avgPoints.toFixed(2)} pts
          </span>
        </div>
      )}
    </motion.div>
  );
}

export function WorldRankingsShowcase() {
  const { data: players, isLoading } = useWorldRankingsTop(10);

  if (isLoading) {
    return (
      <section className="py-6 bg-[#F8FAFC]">
        <div className="px-4 mb-4">
          <div className="h-6 w-48 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="flex gap-3 px-4 overflow-hidden">
          {[1, 2, 3, 4, 5].map(i => (
            <div 
              key={i} 
              className={cn(
                "flex-shrink-0 rounded-2xl bg-slate-100 animate-pulse",
                i === 1 ? "w-44 h-48" : "w-36 h-40"
              )} 
            />
          ))}
        </div>
      </section>
    );
  }

  if (!players || players.length === 0) {
    return null;
  }

  return (
    <section className="py-6 bg-[#F8FAFC]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-4">
        <div>
          <h2 className="text-xs font-bold text-slate-500 tracking-widest uppercase mb-0.5">
            Official World Golf Ranking
          </h2>
          <p className="text-slate-800 text-lg font-semibold">Top 10 Players</p>
        </div>
        <Link 
          to="/tourhub?tab=players"
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          View All
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Horizontal Scroll */}
      <div className="flex gap-3 px-4 overflow-x-auto no-scrollbar pb-2">
        {players.map((player, idx) => (
          <PlayerCard key={player.playerId} player={player} index={idx} />
        ))}
      </div>
    </section>
  );
}
