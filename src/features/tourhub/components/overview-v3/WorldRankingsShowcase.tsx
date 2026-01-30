/**
 * WorldRankingsShowcase - Photo-first horizontal scroll (Apple-grade)
 * No card backgrounds, content floats on page
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorldRankingsTop, type WorldRankedPlayer } from '../../hooks/useOverviewData';
import CountryFlag from '@/components/ui/country-flag';

function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
}

function PlayerItem({ player, index }: { player: WorldRankedPlayer; index: number }) {
  const isNo1 = player.rank === 1;
  
  return (
    <motion.div
      className="flex-shrink-0 w-20 text-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
    >
      {/* Photo */}
      <div className={cn(
        "w-20 h-20 rounded-2xl overflow-hidden mb-2 mx-auto bg-gradient-to-br from-slate-200 to-slate-300",
        isNo1 && "ring-2 ring-amber-400 ring-offset-2"
      )}>
        {player.photoUrl ? (
          <img 
            src={player.photoUrl} 
            alt={player.fullName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xl font-bold text-slate-400">
              {getInitials(player.firstName, player.lastName)}
            </span>
          </div>
        )}
      </div>
      
      {/* Rank */}
      <div className="flex items-center justify-center gap-1 mb-1">
        <span className={cn(
          "text-xs font-bold",
          isNo1 ? "text-amber-500" : "text-slate-400"
        )}>
          #{player.rank}
        </span>
        {isNo1 && <span className="text-sm">🏆</span>}
      </div>
      
      {/* Name - Last name only for cleaner look */}
      <p className="text-sm font-semibold text-slate-900 truncate px-1">
        {player.lastName}
      </p>
      
      {/* Country + Points */}
      <div className="flex items-center justify-center gap-1 mt-0.5">
        <CountryFlag country={player.country} size="sm" />
        {player.avgPoints && (
          <span className="text-xs text-slate-400">
            {player.avgPoints.toFixed(1)}
          </span>
        )}
      </div>
    </motion.div>
  );
}

export function WorldRankingsShowcase() {
  const { data: players, isLoading } = useWorldRankingsTop(10);

  if (isLoading) {
    return (
      <section className="py-6 bg-[#F8FAFC]">
        <div className="px-4 mb-4">
          <div className="h-4 w-40 bg-slate-200 rounded animate-pulse mb-1" />
          <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="flex gap-4 px-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex-shrink-0 w-20">
              <div className="w-20 h-20 rounded-2xl bg-slate-200 animate-pulse mb-2" />
              <div className="h-4 w-12 bg-slate-100 rounded animate-pulse mx-auto" />
            </div>
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
          <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
            Official World Golf Ranking
          </p>
          <h2 className="text-lg font-bold text-slate-900">Top 10 Players</h2>
        </div>
        <Link 
          to="/tourhub?tab=players"
          className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          View All →
        </Link>
      </div>

      {/* Horizontal Scroll - NO CARDS */}
      <div className="flex gap-4 px-4 overflow-x-auto no-scrollbar pb-2">
        {players.map((player, idx) => (
          <PlayerItem key={player.playerId} player={player} index={idx} />
        ))}
      </div>
    </section>
  );
}
