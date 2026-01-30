/**
 * TourBreakdown - Shows tournaments by tour with progress bars
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTournamentsByTour, TOUR_CONFIG, type TourStats } from '../../hooks/useOverviewData';
import { format } from 'date-fns';

function TourCard({ stats, index }: { stats: TourStats; index: number }) {
  const tourConfig = TOUR_CONFIG[stats.tourSlug] || TOUR_CONFIG.pga;
  const completionPercent = stats.tournamentCount > 0 
    ? Math.round((stats.completedCount / stats.tournamentCount) * 100) 
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link to={`/tourhub?tab=schedule&tour=${stats.tourSlug}`}>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-lg hover:border-slate-300 transition-all group">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                style={{ backgroundColor: `${tourConfig.color}15` }}
              >
                {tourConfig.emoji}
              </div>
              <div>
                <h3 
                  className="font-semibold text-sm"
                  style={{ color: tourConfig.color }}
                >
                  {tourConfig.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {stats.tournamentCount} tournaments
                </p>
              </div>
            </div>
            
            {/* Status Badge */}
            {stats.liveCount > 0 ? (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-50 border border-red-200">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
                <span className="text-xs font-medium text-red-600">
                  {stats.liveCount} Live
                </span>
              </div>
            ) : stats.nextTournament ? (
              <span className="text-xs text-slate-400">
                Next: {format(new Date(stats.nextTournament.startDate), 'MMM d')}
              </span>
            ) : null}
          </div>

          {/* Progress Bar */}
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: tourConfig.color }}
              initial={{ width: 0 }}
              animate={{ width: `${completionPercent}%` }}
              transition={{ delay: 0.3 + index * 0.05, duration: 0.6, ease: 'easeOut' }}
            />
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">
              {completionPercent}% complete
            </span>
            <span className="text-slate-400">
              {stats.completedCount} played • {stats.upcomingCount} remaining
            </span>
          </div>

          {/* Next Event Preview */}
          {stats.nextTournament && !stats.liveCount && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Next Event</p>
                  <p className="text-sm font-medium text-slate-700 line-clamp-1">
                    {stats.nextTournament.name}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </div>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

export function TourBreakdown() {
  const { data: tourStats, isLoading } = useTournamentsByTour();

  if (isLoading) {
    return (
      <section className="py-6 px-4 bg-[#F8FAFC]">
        <div className="h-6 w-32 bg-slate-200 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (!tourStats || tourStats.length === 0) {
    return null;
  }

  return (
    <section className="py-6 px-4 bg-[#F8FAFC]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xs font-bold text-slate-500 tracking-widest uppercase mb-0.5">
            Professional Tours
          </h2>
          <p className="text-slate-800 text-lg font-semibold">All Tours</p>
        </div>
        <Link 
          to="/tourhub?tab=schedule"
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          Full Schedule
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Tour Cards */}
      <div className="space-y-3">
        {tourStats.map((stats, idx) => (
          <TourCard key={stats.tourId} stats={stats} index={idx} />
        ))}
      </div>
    </section>
  );
}
