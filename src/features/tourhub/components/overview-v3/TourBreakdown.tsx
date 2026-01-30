/**
 * TourBreakdown - Clean list with no progress bars (Apple-grade)
 * Simple rows with tour logos, counts, and status
 */

import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTournamentsByTour, TOUR_CONFIG, type TourStats } from '../../hooks/useOverviewData';
import { getTourLogo } from '../../utils/tourLogos';
import { format } from 'date-fns';

function TourRow({ stats, index }: { stats: TourStats; index: number }) {
  const navigate = useNavigate();
  const tourConfig = TOUR_CONFIG[stats.tourSlug] || TOUR_CONFIG.pga;

  return (
    <motion.button
      onClick={() => navigate(`/tourhub?tab=schedule&tour=${stats.tourSlug}`)}
      className="w-full flex items-center gap-3 px-4 py-4 hover:bg-slate-50 active:bg-slate-100 transition-colors border-b border-slate-100 last:border-b-0"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
    >
      {/* Tour Logo */}
      <img 
        src={getTourLogo(stats.tourSlug)}
        alt={tourConfig.name}
        className="w-10 h-8 object-contain flex-shrink-0"
      />
      
      {/* Name & Count */}
      <div className="flex-1 text-left min-w-0">
        <h3 className="font-semibold text-slate-900">{tourConfig.name}</h3>
        <p className="text-sm text-slate-500">
          {stats.tournamentCount} tournaments
        </p>
      </div>
      
      {/* Status */}
      {stats.liveCount > 0 ? (
        <span className="flex items-center gap-1 text-sm font-semibold text-red-500 flex-shrink-0">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          {stats.liveCount} Live
        </span>
      ) : stats.nextTournament ? (
        <span className="text-sm text-slate-400 flex-shrink-0">
          Next: {format(new Date(stats.nextTournament.startDate), 'MMM d')}
        </span>
      ) : null}
      
      {/* Chevron */}
      <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
    </motion.button>
  );
}

export function TourBreakdown() {
  const { data: tourStats, isLoading } = useTournamentsByTour();

  if (isLoading) {
    return (
      <section className="py-6 bg-[#F8FAFC] border-t border-slate-100">
        <div className="flex items-center justify-between px-4 mb-4">
          <div className="h-6 w-24 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="space-y-0">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-3 px-4 py-4 border-b border-slate-100">
              <div className="w-10 h-8 bg-slate-200 rounded animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-1/3 bg-slate-200 rounded animate-pulse" />
                <div className="h-4 w-1/4 bg-slate-100 rounded animate-pulse" />
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
    <section className="py-6 bg-[#F8FAFC] border-t border-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-4">
        <h2 className="text-xl font-bold text-slate-900">Tours</h2>
        <Link 
          to="/tourhub?tab=schedule"
          className="text-sm font-semibold text-emerald-600 flex items-center gap-1 hover:text-emerald-700 transition-colors"
        >
          Full Schedule
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      
      {/* Tour List - Clean, No Progress Bars */}
      <div className="space-y-0 -mx-0">
        {tourStats.map((stats, idx) => (
          <TourRow key={stats.tourId} stats={stats} index={idx} />
        ))}
      </div>
    </section>
  );
}
