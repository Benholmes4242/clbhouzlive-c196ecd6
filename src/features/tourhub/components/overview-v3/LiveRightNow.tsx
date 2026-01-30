/**
 * LiveRightNow - Multi-Tour Live Snapshot
 * Dark cards with horizontal scroll, only shows when tournaments are live
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
            <Skeleton key={i} className="flex-shrink-0 w-[280px] h-[140px] rounded-2xl bg-slate-800" />
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
      <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2">
        {liveTournaments!.map((tournament, idx) => (
          <motion.button
            key={tournament.id}
            onClick={() => navigate(`/tourhub/tournament/${tournament.id}`)}
            className="flex-shrink-0 w-[280px] bg-slate-900 rounded-2xl p-4 text-left"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.2 }}
          >
            {/* Header Row */}
            <div className="flex items-center justify-between mb-2">
              <img
                src={getTourLogo(tournament.tourSlug)}
                alt=""
                className="h-5 w-auto brightness-0 invert opacity-70"
              />
              <span className="flex items-center gap-1 text-xs font-semibold text-red-400">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                LIVE
              </span>
            </div>

            {/* Tournament Name */}
            <h3 className="text-white font-semibold text-[15px] leading-snug line-clamp-2 mb-2">
              {tournament.name}
            </h3>

            {/* Leader Info */}
            {tournament.leader && (
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-sm truncate mr-2">
                  {tournament.leader.name}
                </span>
                <span className="text-emerald-400 font-semibold flex-shrink-0">
                  {tournament.leader.scoreDisplay}
                </span>
              </div>
            )}
          </motion.button>
        ))}
      </div>
    </section>
  );
}
