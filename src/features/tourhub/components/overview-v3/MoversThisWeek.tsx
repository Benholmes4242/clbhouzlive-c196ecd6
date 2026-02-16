/**
 * MoversThisWeek - World Rankings Movement
 * Apple-grade horizontal scroll with player photos, movement badges, and "Was → Now" format
 * 
 * Features:
 * - Frosted glass card backgrounds
 * - Movement badges positioned bottom-right with gradient styling
 * - Staggered pop-in animation for badges
 * - Smooth horizontal scroll with snap
 * - Card press animation
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingDown } from 'lucide-react';
import { useRankingMovers } from '../../hooks/useOverviewModules';
import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import CountryFlag from '@/components/ui/country-flag';

/** Skeleton card with shimmer animation */
function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-[100px] flex flex-col items-center p-3">
      <div 
        className="w-[68px] mb-2"
        style={{
          aspectRatio: '1 / 1.05',
          borderRadius: '34%',
          background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite linear',
        }}
      />
      <div 
        className="h-4 w-16 rounded-full mb-1"
        style={{
          background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite linear',
        }}
      />
      <div 
        className="h-3 w-12 rounded-full"
        style={{
          background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite linear',
        }}
      />
    </div>
  );
}

export function MoversThisWeek() {
  const navigate = useNavigate();
  const { data: movers, isLoading } = useRankingMovers();

  // Don't render if no significant movers
  if (!isLoading && (!movers || movers.length === 0)) {
    return (
      <section className="pt-6 pb-4 border-t border-slate-100">
        <div className="px-4 mb-4">
          <h2 className="text-[22px] font-semibold text-slate-900">Movers This Week</h2>
        </div>
        {/* Empty state */}
        <div className="text-center py-8 px-4">
          <TrendingDown className="w-6 h-6 text-slate-300/60 mx-auto mb-2" />
          <p className="text-[15px] text-slate-400/50">No ranking changes this week</p>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="pt-6 pb-4 border-t border-slate-100">
        <div className="px-4 mb-4">
          <h2 className="text-[22px] font-semibold text-slate-900">Movers This Week</h2>
        </div>
        <div 
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-4"
          style={{ 
            paddingLeft: '16px', 
            paddingRight: '16px',
            WebkitOverflowScrolling: 'touch',
          }}
          role="list"
          aria-label="Loading golf players with ranking changes"
        >
          {[1, 2, 3, 4].map(i => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="pt-6 pb-4 border-t border-slate-100">
      {/* Header - No label, just title */}
      <div className="px-4 mb-4">
        <h2 className="text-[22px] font-semibold text-slate-900">Movers This Week</h2>
      </div>

      {/* Horizontal Scroll - Fixed left padding alignment */}
      <div 
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-4 px-4"
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'x mandatory',
        }}
        role="list"
        aria-label="Golf players with biggest ranking improvements this week"
      >
        {movers!.map((entry, idx) => {
          const isUp = entry.rankChange > 0;
          const previousRank = entry.priorRank || (entry.rank + (isUp ? entry.rankChange : -entry.rankChange));

          return (
            <motion.button
              key={entry.playerId}
              onClick={() => navigate(`/tourhub/player/${entry.playerId}`)}
              className="flex-shrink-0 flex flex-col items-center p-3 pb-[14px] rounded-2xl border transition-colors overflow-visible"
              style={{
                minWidth: '100px',
                background: 'rgba(255, 255, 255, 0.6)',
                borderColor: 'rgba(0, 0, 0, 0.04)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                scrollSnapAlign: 'start',
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ delay: idx * 0.04, duration: 0.2 }}
              role="listitem"
              aria-label={`${entry.firstName} ${entry.lastName}, moved ${isUp ? 'up' : 'down'} ${Math.abs(entry.rankChange)} positions, from rank ${previousRank} to rank ${entry.rank}, ${entry.country || 'Unknown country'}`}
            >
              {/* Photo with Badge - Squircle shape */}
              <div className="relative mb-2">
                <div 
                  className="w-[68px] overflow-hidden bg-slate-100"
                  style={{
                    aspectRatio: '1 / 1.05',
                    borderRadius: '34%',
                    border: '3px solid white',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  {(() => {
                    const photoUrl = resolvePhotoUrl(entry.photoUrl, entry.pgaTourId);
                    return photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={`${entry.firstName} ${entry.lastName}`}
                        className="w-full h-full object-cover object-top"
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

                {/* Movement Badge - Bottom right with gradient */}
                <motion.div
                  className={cn(
                    "absolute -bottom-1 -right-1 flex items-center gap-0.5 px-2 py-1 rounded-xl text-[12px] font-bold text-white"
                  )}
                  style={{
                    background: isUp 
                      ? 'linear-gradient(135deg, #22C55E 0%, #1EA34E 100%)'
                      : 'linear-gradient(135deg, #FF3B30 0%, #E6352B 100%)',
                    border: '2.5px solid white',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ 
                    delay: 0.1 + idx * 0.05,
                    duration: 0.3,
                    ease: [0.34, 1.56, 0.64, 1], // Spring-like ease
                  }}
                >
                  <span className="text-[10px]">{isUp ? '↑' : '↓'}</span>
                  {Math.abs(entry.rankChange)}
                </motion.div>
              </div>

              {/* Name */}
              <p 
                className="text-[15px] font-semibold text-slate-900 text-center truncate mb-1"
                style={{ maxWidth: '90px' }}
              >
                {entry.lastName}
              </p>

              {/* Was → Now Format */}
              <div className="flex items-center gap-1 text-[13px] font-medium text-slate-500 mb-1.5">
                <span className="opacity-50">#{previousRank}</span>
                <span className="text-[10px] opacity-40">→</span>
                <span className="font-semibold text-slate-900">#{entry.rank}</span>
              </div>

              {/* Flag - transparent background, no container */}
              {entry.country && (
                <div className="flex items-center justify-center mt-1.5">
                  <CountryFlag country={entry.country} size="sm" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
