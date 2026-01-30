/**
 * LiveRightNow - Multi-Tour Live Snapshot
 * Image-backed cards with horizontal scroll, only shows when tournaments are live
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLiveRightNow } from '../../hooks/useOverviewModules';
import { getTourLogo } from '../../utils/tourLogos';
import { Skeleton } from '@/components/ui/skeleton';

export function LiveRightNow() {
  const navigate = useNavigate();
  const { data: liveTournaments, isLoading } = useLiveRightNow();

  // Don't render if no live tournaments
  if (!isLoading && (!liveTournaments || liveTournaments.length === 0)) {
    return null;
  }

  if (isLoading) {
    return (
      <section className="py-4">
        <div className="flex items-center gap-2 px-4 mb-3">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2">
          {[1, 2].map(i => (
            <Skeleton key={i} className="flex-shrink-0 w-[280px] h-[140px] rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-4">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 mb-3">
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
          Live Right Now
        </h2>
      </div>

      {/* Horizontal Scroll Cards */}
      <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2 -webkit-overflow-scrolling-touch">
        {liveTournaments!.map((tournament, idx) => (
          <motion.button
            key={tournament.id}
            onClick={() => navigate(`/tourhub/tournament/${tournament.id}`)}
            className="flex-shrink-0 w-[280px] rounded-2xl overflow-hidden relative border border-black/5 shadow-sm"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.2 }}
          >
            {/* Course Image Background */}
            <div className="absolute inset-0">
              {tournament.courseImage ? (
                <img
                  src={tournament.courseImage}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900" />
              )}
              {/* Gradient overlay for text legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
            </div>

            {/* Content */}
            <div className="relative z-10 p-4 h-[140px] flex flex-col justify-between text-left">
              {/* Header Row */}
              <div className="flex items-center justify-between">
                <img
                  src={getTourLogo(tournament.tourSlug)}
                  alt=""
                  className="h-5 w-auto drop-shadow-lg"
                />
                <span className="flex items-center gap-1 text-xs font-semibold text-red-400">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  LIVE
                </span>
              </div>

              {/* Tournament Name & Leader */}
              <div>
                <h3 className="text-white font-semibold text-[15px] leading-snug line-clamp-2 mb-1">
                  {tournament.name}
                </h3>

                {tournament.leader && (
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 text-sm truncate mr-2">
                      {tournament.leader.name}
                    </span>
                    <span className="text-emerald-400 font-bold text-lg flex-shrink-0">
                      {tournament.leader.scoreDisplay}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
