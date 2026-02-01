/**
 * MoversThisWeek - World Rankings Movement
 * Horizontal scroll with player photos, movement badges, and "Was → Now" format
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useRankingMovers } from '../../hooks/useOverviewModules';
import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import CountryFlag from '@/components/ui/country-flag';

export function MoversThisWeek() {
  const navigate = useNavigate();
  const { data: movers, isLoading } = useRankingMovers();

  // Don't render if no significant movers
  if (!isLoading && (!movers || movers.length === 0)) {
    return null;
  }

  if (isLoading) {
    return (
      <section className="py-6 border-t border-slate-100">
        <div className="px-4 mb-4">
          <Skeleton className="h-3 w-32 mb-1" />
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="flex gap-4 px-4 overflow-x-auto scrollbar-hide pb-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex-shrink-0 w-[100px] text-center">
              <Skeleton className="w-[72px] h-[72px] mx-auto rounded-2xl mb-2" />
              <Skeleton className="h-4 w-16 mx-auto" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 border-t border-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-4">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            World Rankings
          </p>
          <h2 className="text-lg font-bold text-slate-900">Movers This Week</h2>
        </div>
      </div>

      {/* Horizontal Scroll */}
      <div className="flex gap-4 px-4 overflow-x-auto scrollbar-hide pb-2 -webkit-overflow-scrolling-touch">
        {movers!.map((entry, idx) => {
          const isUp = entry.rankChange > 0;
          const previousRank = entry.priorRank || (entry.rank + (isUp ? entry.rankChange : -entry.rankChange));

          return (
            <motion.button
              key={entry.playerId}
              onClick={() => navigate(`/tourhub/player/${entry.playerId}`)}
              className="flex-shrink-0 w-[100px] text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.04, duration: 0.2 }}
            >
              {/* Photo with Badge */}
              <div className="relative">
                <div className="w-[72px] h-[72px] mx-auto rounded-2xl overflow-hidden bg-slate-100 mb-2 shadow-sm">
                  {resolvePhotoUrl(entry.photoUrl) ? (
                    <img
                      src={resolvePhotoUrl(entry.photoUrl)!}
                      alt={`${entry.firstName} ${entry.lastName}`}
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

                {/* Movement Badge */}
                <div
                  className={cn(
                    "absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-xs font-bold shadow-sm",
                    isUp ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                  )}
                >
                  {isUp ? '↑' : '↓'} {Math.abs(entry.rankChange)}
                </div>
              </div>

              {/* Name */}
              <p className="text-sm font-semibold text-slate-900 mt-2 truncate">
                {entry.lastName}
              </p>

              {/* Was → Now Format */}
              <p className="text-xs text-slate-500 mt-0.5">
                <span className="text-slate-400">#{previousRank}</span>
                <span className="mx-1">→</span>
                <span className="font-semibold text-slate-700">#{entry.rank}</span>
              </p>

              {/* Flag */}
              <div className="flex items-center justify-center mt-1">
                {entry.country && <CountryFlag country={entry.country} size="sm" />}
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
