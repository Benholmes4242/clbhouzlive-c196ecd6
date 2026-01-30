/**
 * LiveGolfPulse - Real-time stats snapshot
 * 2x2 grid with live numbers
 */

import { motion } from 'framer-motion';
import { useLiveGolfPulse } from '../../hooks/useOverviewModules';
import { Skeleton } from '@/components/ui/skeleton';

export function LiveGolfPulse() {
  const { data: pulse, isLoading } = useLiveGolfPulse();

  if (isLoading) {
    return (
      <section className="px-4 py-6 border-t border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </div>
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-[100px] rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (!pulse) return null;

  return (
    <section className="px-4 py-6 border-t border-slate-100">
      {/* Header with Pulse Indicator */}
      <div className="flex items-center gap-2 mb-4">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
        </span>
        <h2 className="text-lg font-bold text-slate-900">Live Golf Pulse</h2>
      </div>

      {/* Stats Grid */}
      <motion.div
        className="grid grid-cols-2 gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Tournaments Live */}
        <div className="bg-slate-900 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-white">{pulse.liveNow}</p>
          <p className="text-xs text-white/60 mt-1">Tournaments Live</p>
        </div>

        {/* Active Players */}
        <div className="bg-slate-900 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-white">{pulse.activePlayers}</p>
          <p className="text-xs text-white/60 mt-1">Players Active</p>
        </div>

        {/* Birdies Today */}
        <div className="bg-emerald-600 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-white">{pulse.birdiesToday}</p>
          <p className="text-xs text-white/60 mt-1">Birdies Today</p>
        </div>

        {/* Avg vs Par */}
        <div className="bg-slate-100 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-slate-900">
            {pulse.avgScore > 0 ? '+' : ''}{pulse.avgScore.toFixed(1)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Avg vs Par</p>
        </div>
      </motion.div>
    </section>
  );
}
