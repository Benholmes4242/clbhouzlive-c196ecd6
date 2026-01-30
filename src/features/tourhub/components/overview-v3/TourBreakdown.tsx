/**
 * TourBreakdown - Clean rows with progress bars (Apple-grade, no cards)
 * Tour logos + progress visualization
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTournamentsByTour, TOUR_CONFIG, type TourStats } from '../../hooks/useOverviewData';
import { getTourLogo } from '../../utils/tourLogos';
import { format } from 'date-fns';

// Tour-specific progress bar colors
const getTourProgressColor = (alias: string): string => {
  const colors: Record<string, string> = {
    'pga': 'bg-blue-500',
    'euro': 'bg-purple-500', 
    'lpga': 'bg-pink-500',
    'liv': 'bg-red-500',
    'pgad': 'bg-emerald-500',
    'champ': 'bg-amber-500',
  };
  return colors[alias] || 'bg-slate-400';
};

function TourRow({ stats, index }: { stats: TourStats; index: number }) {
  const tourConfig = TOUR_CONFIG[stats.tourSlug] || TOUR_CONFIG.pga;
  const completionPercent = stats.tournamentCount > 0 
    ? Math.round((stats.completedCount / stats.tournamentCount) * 100) 
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
    >
      <Link to={`/tourhub?tab=schedule&tour=${stats.tourSlug}`}>
        <div className="py-4 border-t border-slate-100 first:border-t-0 active:bg-slate-50 transition-colors">
          <div className="flex items-start gap-3">
            {/* Tour Logo */}
            <img 
              src={getTourLogo(stats.tourSlug)}
              alt={tourConfig.name}
              className="w-10 h-8 object-contain flex-shrink-0"
            />
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header Row */}
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-slate-900">{tourConfig.name}</h3>
                {stats.liveCount > 0 ? (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-red-500">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    {stats.liveCount} Live
                  </span>
                ) : stats.nextTournament ? (
                  <span className="text-xs text-slate-400">
                    Next: {format(new Date(stats.nextTournament.startDate), 'MMM d')}
                  </span>
                ) : null}
              </div>
              
              {/* Subtitle */}
              <p className="text-sm text-slate-500 mb-2">
                {stats.tournamentCount} tournaments · {completionPercent}% complete
              </p>
              
              {/* Progress Bar */}
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  className={cn("h-full rounded-full", getTourProgressColor(stats.tourSlug))}
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercent}%` }}
                  transition={{ delay: 0.2 + index * 0.04, duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
            
            {/* Chevron */}
            <ChevronRight className="h-5 w-5 text-slate-300 flex-shrink-0 mt-0.5" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function TourBreakdown() {
  const { data: tourStats, isLoading } = useTournamentsByTour();

  if (isLoading) {
    return (
      <section className="px-4 py-6 bg-[#F8FAFC]">
        <div className="h-4 w-32 bg-slate-200 rounded animate-pulse mb-4" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex gap-3">
              <div className="w-10 h-8 bg-slate-200 rounded animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-1/2 bg-slate-200 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-slate-100 rounded animate-pulse" />
                <div className="h-1.5 w-full bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!tourStats || tourStats.length === 0) {
    return null;
  }

  return (
    <section className="px-4 py-6 bg-[#F8FAFC]">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
          Professional Tours
        </h2>
        <Link 
          to="/tourhub?tab=schedule"
          className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          Full Schedule →
        </Link>
      </div>
      
      {/* Tour List - NO CARDS */}
      <div className="space-y-0">
        {tourStats.map((stats, idx) => (
          <TourRow key={stats.tourId} stats={stats} index={idx} />
        ))}
      </div>
    </section>
  );
}
