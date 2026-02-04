/**
 * MoversThisWeek - World Rankings Movement (Apple-grade polish)
 * 
 * Features:
 * - Frosted glass cards with subtle border
 * - Movement badges repositioned to bottom-right of avatar
 * - Gradient badges (green up, red down)
 * - Badge pop-in animation with stagger
 * - Refined typography hierarchy
 * - Horizontal scroll with snap
 * - Shimmer skeleton loading
 * - Accessibility labels
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, Flag } from 'lucide-react';
import { useRankingMovers } from '../../hooks/useOverviewModules';
import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';
import { cn } from '@/lib/utils';
import CountryFlag from '@/components/ui/country-flag';

/** Shimmer skeleton for mover cards */
function MoverCardSkeleton({ index }: { index: number }) {
  return (
    <div 
      className="flex-shrink-0 flex flex-col items-center p-3 min-w-[100px]"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Avatar skeleton */}
      <div 
        className="w-[72px] h-[72px] rounded-full mb-2 overflow-hidden relative"
      >
        <div 
          className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200"
          style={{
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s linear infinite',
          }}
        />
      </div>
      {/* Name skeleton */}
      <div 
        className="h-4 w-16 rounded-full overflow-hidden relative"
      >
        <div 
          className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200"
          style={{
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s linear infinite',
          }}
        />
      </div>
      {/* Rank skeleton */}
      <div 
        className="h-3 w-14 mt-1 rounded-full overflow-hidden relative"
      >
        <div 
          className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200"
          style={{
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s linear infinite',
          }}
        />
      </div>
    </div>
  );
}

export function MoversThisWeek() {
  const navigate = useNavigate();
  const { data: movers, isLoading } = useRankingMovers();

  // Don't render if no significant movers
  if (!isLoading && (!movers || movers.length === 0)) {
    return (
      <section className="pt-6 pb-4">
        <div className="px-4 mb-4">
          <p className="text-[11px] font-medium text-slate-400/50 uppercase tracking-[0.5px] mb-1">
            World Rankings
          </p>
          <h2 className="text-[22px] font-semibold text-slate-900" style={{ letterSpacing: '-0.02em' }}>
            Movers This Week
          </h2>
        </div>
        <div className="text-center py-8 px-4">
          <Flag className="w-6 h-6 text-slate-300 mx-auto mb-2 opacity-30" />
          <p className="text-[15px] text-slate-400/50">No ranking changes this week</p>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="pt-6 pb-4">
        <div className="px-4 mb-4">
          <p className="text-[11px] font-medium text-slate-400/50 uppercase tracking-[0.5px] mb-1">
            World Rankings
          </p>
          <h2 className="text-[22px] font-semibold text-slate-900" style={{ letterSpacing: '-0.02em' }}>
            Movers This Week
          </h2>
        </div>
        <div 
          className="flex gap-3 pl-4 overflow-x-auto scrollbar-hide pb-4"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {[0, 1, 2, 3].map(i => (
            <MoverCardSkeleton key={i} index={i} />
          ))}
        </div>
        <style>{`
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </section>
    );
  }

  return (
    <section className="pt-6 pb-4">
      {/* Header - refined typography */}
      <div className="flex items-center justify-between px-4 mb-4">
        <div className="space-y-0.5">
          <p className="text-[11px] font-medium text-slate-400/50 uppercase tracking-[0.5px]">
            World Rankings
          </p>
          <h2 className="text-[22px] font-semibold text-slate-900" style={{ letterSpacing: '-0.02em' }}>
            Movers This Week
          </h2>
        </div>
      </div>

      {/* Horizontal Scroll with snap */}
      <div 
        className="flex gap-3 pl-4 overflow-x-auto scrollbar-hide pb-4 pr-4"
        style={{ 
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
        role="list"
        aria-label="Golf players with biggest ranking improvements this week"
      >
        {movers!.map((entry, idx) => {
          const isUp = entry.rankChange > 0;
          const previousRank = entry.priorRank || (entry.rank + (isUp ? entry.rankChange : -entry.rankChange));
          
          // Accessibility label
          const ariaLabel = `${entry.firstName} ${entry.lastName}, moved ${isUp ? 'up' : 'down'} ${Math.abs(entry.rankChange)} positions, from rank ${previousRank} to rank ${entry.rank}, ${entry.country || 'Unknown'}`;

          return (
            <motion.button
              key={entry.playerId}
              onClick={() => navigate(`/tourhub/player/${entry.playerId}`)}
              className={cn(
                "flex-shrink-0 flex flex-col items-center p-3 min-w-[100px]",
                "bg-white/60 backdrop-blur-sm rounded-2xl",
                "border border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
                "transition-transform duration-150 ease-out",
                "active:scale-[0.97]",
                "scroll-snap-align-start"
              )}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.04, duration: 0.2 }}
              aria-label={ariaLabel}
              role="listitem"
            >
              {/* Photo with Movement Badge */}
              <div className="relative mb-2">
                <div className="w-[72px] h-[72px] rounded-full overflow-hidden bg-slate-100 border-[3px] border-white shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
                  {(() => {
                    const photoUrl = resolvePhotoUrl(entry.photoUrl, entry.pgaTourId);
                    return photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={`${entry.firstName} ${entry.lastName}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-200">
                        <span className="text-lg font-bold text-slate-400">
                          {entry.firstName[0]}{entry.lastName[0]}
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Movement Badge - bottom-right position with pop animation */}
                <motion.div
                  className={cn(
                    "absolute -bottom-1 -right-1 flex items-center gap-0.5 px-2 py-1 rounded-xl",
                    "text-[12px] font-bold text-white",
                    "border-[2.5px] border-white shadow-[0_2px_6px_rgba(0,0,0,0.15)]",
                    isUp 
                      ? "bg-gradient-to-br from-[#34C759] to-[#30B350]" 
                      : "bg-gradient-to-br from-[#FF3B30] to-[#E6352B]"
                  )}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ 
                    delay: 0.1 + idx * 0.05, 
                    duration: 0.3,
                    type: 'spring',
                    stiffness: 400,
                    damping: 15
                  }}
                >
                  <span className="text-[10px]">{isUp ? '↑' : '↓'}</span>
                  <span>{Math.abs(entry.rankChange)}</span>
                </motion.div>
              </div>

              {/* Name - truncated */}
              <p 
                className="text-[15px] font-semibold text-[#1a1a1a] text-center max-w-[90px] truncate"
              >
                {entry.lastName}
              </p>

              {/* Ranking Change: Was → Now */}
              <div className="flex items-center gap-1 text-[13px] font-medium text-[#666] mt-1">
                <span className="opacity-50">#{previousRank}</span>
                <span className="text-[10px] opacity-40">→</span>
                <span className="font-semibold text-[#1a1a1a]">#{entry.rank}</span>
              </div>

              {/* Flag */}
              <div className="flex items-center justify-center mt-1.5">
                {entry.country && (
                  <div className="rounded-sm overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                    <CountryFlag country={entry.country} size="sm" />
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
      
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </section>
  );
}
