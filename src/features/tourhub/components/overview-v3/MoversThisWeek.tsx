/**
 * MoversThisWeek - World Rankings Movement (Apple-grade polish)
 * 
 * Features:
 * - Horizontal scroll with snap
 * - Frosted glass card backgrounds
 * - Movement badges positioned bottom-right with gradient
 * - Badge pop-in animation with stagger
 * - Shimmer skeleton loading
 * - Refined typography hierarchy
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingDown, Flag } from 'lucide-react';
import { useRankingMovers } from '../../hooks/useOverviewModules';
import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';
import { cn } from '@/lib/utils';
import CountryFlag from '@/components/ui/country-flag';

/** Skeleton card for loading state with shimmer */
function MoverSkeleton({ index }: { index: number }) {
  return (
    <div 
      className="flex flex-col items-center flex-shrink-0 p-3 min-w-[100px]"
      style={{ scrollSnapAlign: 'start' }}
    >
      {/* Avatar skeleton */}
      <div 
        className="w-[72px] h-[72px] rounded-full mb-2 overflow-hidden"
        style={{ 
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
          backgroundSize: '200% 100%',
          animation: `tourhubShimmer 1.5s infinite`,
          animationDelay: `${index * 0.1}s`,
        }}
      />
      {/* Name skeleton */}
      <div 
        className="h-4 w-16 rounded-full"
        style={{ 
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
          backgroundSize: '200% 100%',
          animation: `tourhubShimmer 1.5s infinite`,
          animationDelay: `${index * 0.1 + 0.05}s`,
        }}
      />
      {/* Ranking skeleton */}
      <div 
        className="h-3 w-12 rounded-full mt-2"
        style={{ 
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
          backgroundSize: '200% 100%',
          animation: `tourhubShimmer 1.5s infinite`,
          animationDelay: `${index * 0.1 + 0.1}s`,
        }}
      />
    </div>
  );
}

/** Movement badge with gradient and pop-in animation */
function MovementBadge({ 
  change, 
  isPositive, 
  animationDelay 
}: { 
  change: number; 
  isPositive: boolean;
  animationDelay: number;
}) {
  return (
    <motion.div
      className="absolute -bottom-1 -right-1 flex items-center gap-0.5 px-2 py-1 rounded-xl text-xs font-bold text-white"
      style={{
        background: isPositive 
          ? 'linear-gradient(135deg, #34C759 0%, #30B350 100%)'
          : 'linear-gradient(135deg, #FF3B30 0%, #E6352B 100%)',
        border: '2.5px solid white',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        delay: animationDelay,
        duration: 0.3,
        ease: [0.34, 1.56, 0.64, 1], // Spring-like ease
      }}
    >
      <span className="text-[10px]">{isPositive ? '↑' : '↓'}</span>
      <span>{Math.abs(change)}</span>
    </motion.div>
  );
}

export function MoversThisWeek() {
  const navigate = useNavigate();
  const { data: movers, isLoading } = useRankingMovers();

  // Loading state with shimmer skeletons
  if (isLoading) {
    return (
      <section className="pt-6 pb-6 border-t border-slate-100">
        <div className="px-4 mb-4 space-y-1">
          <p 
            className="text-[11px] font-medium uppercase"
            style={{ color: 'rgba(100, 116, 139, 0.5)', letterSpacing: '0.5px' }}
          >
            World Rankings
          </p>
          <h2 
            className="text-[22px] font-semibold text-slate-900"
            style={{ letterSpacing: '-0.02em' }}
          >
            Movers This Week
          </h2>
        </div>
        <div 
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-4 px-4"
          style={{ 
            marginLeft: '-16px',
            marginRight: '-16px',
          }}
        >
          {[0, 1, 2, 3].map(i => (
            <MoverSkeleton key={i} index={i} />
          ))}
        </div>
      </section>
    );
  }

  // Empty state
  if (!movers || movers.length === 0) {
    return (
      <section className="pt-6 pb-6 border-t border-slate-100">
        <div className="px-4 mb-4 space-y-1">
          <p 
            className="text-[11px] font-medium uppercase"
            style={{ color: 'rgba(100, 116, 139, 0.5)', letterSpacing: '0.5px' }}
          >
            World Rankings
          </p>
          <h2 
            className="text-[22px] font-semibold text-slate-900"
            style={{ letterSpacing: '-0.02em' }}
          >
            Movers This Week
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <Flag className="w-6 h-6 text-slate-300 mb-2" style={{ opacity: 0.3 }} />
          <p className="text-[15px] text-slate-500" style={{ opacity: 0.5 }}>
            No ranking changes this week
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-6 pb-6 border-t border-slate-100">
      {/* Header - Apple-grade typography */}
      <div className="px-4 mb-4 space-y-1">
        <p 
          className="text-[11px] font-medium uppercase"
          style={{ color: 'rgba(100, 116, 139, 0.5)', letterSpacing: '0.5px' }}
        >
          World Rankings
        </p>
        <h2 
          className="text-[22px] font-semibold text-slate-900"
          style={{ letterSpacing: '-0.02em' }}
        >
          Movers This Week
        </h2>
      </div>

      {/* Horizontal Scroll with Snap */}
      <div 
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-4 px-4"
        role="list"
        aria-label="Golf players with biggest ranking improvements this week"
        style={{ 
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          marginLeft: '-16px',
          marginRight: '-16px',
        }}
      >
        {movers.map((entry, idx) => {
          const isUp = entry.rankChange > 0;
          const previousRank = entry.priorRank || (entry.rank + (isUp ? entry.rankChange : -entry.rankChange));
          const photoUrl = resolvePhotoUrl(entry.photoUrl, entry.pgaTourId);
          const fullName = `${entry.firstName} ${entry.lastName}`;
          
          // Truncate name: show last name only if full name too long
          const displayName = fullName.length > 12 ? entry.lastName : fullName;

          return (
            <motion.button
              key={entry.playerId}
              onClick={() => navigate(`/tourhub/player/${entry.playerId}`)}
              role="listitem"
              aria-label={`${fullName}, moved ${isUp ? 'up' : 'down'} ${Math.abs(entry.rankChange)} positions, from rank ${previousRank} to rank ${entry.rank}, ${entry.country || 'Unknown country'}`}
              className="flex flex-col items-center flex-shrink-0 p-3 min-w-[100px] rounded-2xl transition-transform duration-150 ease-out active:scale-[0.97]"
              style={{
                background: 'rgba(255, 255, 255, 0.6)',
                border: '1px solid rgba(0, 0, 0, 0.04)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                scrollSnapAlign: 'start',
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.25 }}
            >
              {/* Player Image Container */}
              <div className="relative mb-2">
                <div 
                  className="w-[72px] h-[72px] rounded-full overflow-hidden"
                  style={{
                    border: '3px solid white',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-200">
                      <span className="text-lg font-bold text-slate-400">
                        {entry.firstName[0]}{entry.lastName[0]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Movement Badge - Bottom Right */}
                <MovementBadge 
                  change={entry.rankChange} 
                  isPositive={isUp}
                  animationDelay={0.1 + idx * 0.05}
                />
              </div>

              {/* Player Name */}
              <p 
                className="text-[15px] font-semibold text-slate-900 text-center truncate"
                style={{ maxWidth: '90px' }}
              >
                {displayName}
              </p>

              {/* Ranking Change: Old → New */}
              <div className="flex items-center gap-1 mt-1 text-[13px] font-medium text-slate-500">
                <span style={{ opacity: 0.5 }}>#{previousRank}</span>
                <span style={{ opacity: 0.4, fontSize: '10px' }}>→</span>
                <span className="font-semibold text-slate-900">#{entry.rank}</span>
              </div>

              {/* Country Flag */}
              {entry.country && (
                <div 
                  className="mt-1.5 overflow-hidden"
                  style={{
                    width: '20px',
                    height: '14px',
                    borderRadius: '2px',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                  }}
                >
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
