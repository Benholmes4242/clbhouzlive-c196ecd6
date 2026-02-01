/**
 * MoversStrip - Horizontal Delta Strip
 * 
 * Design: Horizontal scroll with circular movement indicators
 * Per redesign brief: Minimal vertical footprint, clear movement direction
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useRankingMovers } from '../../hooks/useOverviewModules';
import { cn } from '@/lib/utils';

/** Loading skeleton */
const MoversStripSkeleton = () => (
  <section className="py-8">
    <div className="px-4 mb-4">
      <div className="h-6 w-40 bg-slate-100 rounded animate-pulse" />
    </div>
    <div className="flex gap-3 px-4 overflow-hidden">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex flex-col items-center gap-2 py-2 min-w-[80px]">
          <div className="w-12 h-12 rounded-full bg-slate-100 animate-pulse" />
          <div className="h-3 w-14 bg-slate-100 rounded animate-pulse" />
          <div className="h-3 w-8 bg-slate-100 rounded animate-pulse" />
        </div>
      ))}
    </div>
  </section>
);

export function MoversStrip() {
  const navigate = useNavigate();
  const { data: movers, isLoading } = useRankingMovers();

  // Don't render if no movers
  if (!isLoading && (!movers || movers.length === 0)) {
    return null;
  }

  if (isLoading) {
    return <MoversStripSkeleton />;
  }

  return (
    <section className="py-8">
      {/* Header */}
      <div className="px-4 mb-4">
        <h2 className="text-xl font-bold text-slate-900">Movers This Week</h2>
      </div>

      {/* Horizontal Scroll Strip */}
      <div 
        className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {movers!.map((entry, idx) => {
          const isUp = entry.rankChange > 0;

          return (
            <motion.button
              key={entry.playerId}
              onClick={() => navigate(`/tourhub/player/${entry.playerId}`)}
              className="flex flex-col items-center gap-2 py-2 min-w-[80px] flex-shrink-0"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.03, duration: 0.15 }}
            >
              {/* Circular Movement Indicator */}
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center text-base font-bold",
                isUp 
                  ? "bg-emerald-100 text-emerald-700" 
                  : "bg-red-100 text-red-600"
              )}>
                {isUp ? '+' : ''}{entry.rankChange}
              </div>

              {/* Player Last Name */}
              <span className="text-sm font-semibold text-slate-900 text-center truncate max-w-[80px]">
                {entry.lastName}
              </span>

              {/* Current Rank */}
              <span className="text-xs text-slate-500 font-mono">
                #{entry.rank}
              </span>
            </motion.button>
          );
        })}
      </div>
      
      {/* Bottom divider */}
      <div className="h-px bg-slate-100 mt-4" />
    </section>
  );
}

export default MoversStrip;
