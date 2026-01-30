/**
 * ComingUpNext - Next 7 Days Tournaments
 * Clean list with countdown timers
 */

import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useComingUpNext } from '../../hooks/useOverviewModules';
import { getTourLogo } from '../../utils/tourLogos';
import { Skeleton } from '@/components/ui/skeleton';

function getCountdown(startDate: string): string {
  const days = Math.ceil((new Date(startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Starts today';
  if (days === 1) return 'Starts tomorrow';
  return `In ${days} days`;
}

function formatPurse(purse: number | null): string {
  if (!purse) return '';
  if (purse >= 1000000) {
    return `$${(purse / 1000000).toFixed(purse % 1000000 === 0 ? 0 : 1)}M`;
  }
  return `$${(purse / 1000).toFixed(0)}K`;
}

export function ComingUpNext() {
  const navigate = useNavigate();
  const { data: tournaments, isLoading } = useComingUpNext();

  // Don't render if no upcoming tournaments
  if (!isLoading && (!tournaments || tournaments.length === 0)) {
    return null;
  }

  if (isLoading) {
    return (
      <section className="px-4 py-6 border-t border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-0 -mx-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
              <Skeleton className="w-8 h-6" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-6 border-t border-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900">Coming Up</h2>
        <Link
          to="/tourhub?tab=schedule"
          className="text-sm font-semibold text-emerald-600 flex items-center gap-1 hover:text-emerald-700"
        >
          Full Schedule
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Tournament List */}
      <div className="space-y-0 -mx-4">
        {tournaments!.map((tournament, idx) => (
          <motion.button
            key={tournament.id}
            onClick={() => navigate(`/tourhub/tournament/${tournament.id}`)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 active:bg-slate-100 border-b border-slate-100 last:border-b-0"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03, duration: 0.2 }}
          >
            {/* Tour Logo */}
            <img
              src={getTourLogo(tournament.tourSlug)}
              alt=""
              className="w-8 h-6 object-contain flex-shrink-0"
            />

            {/* Content */}
            <div className="flex-1 text-left min-w-0">
              <h3 className="font-semibold text-slate-900 text-[15px] truncate">
                {tournament.name}
              </h3>
              <p className="text-sm text-slate-500">
                {tournament.venueCity}
                {tournament.venueCity && tournament.venueCountry && ', '}
                {tournament.venueCountry}
              </p>
            </div>

            {/* Countdown & Purse */}
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-medium text-slate-900">
                {getCountdown(tournament.startDate)}
              </p>
              {tournament.purse && (
                <p className="text-xs text-slate-400">
                  {formatPurse(tournament.purse)}
                </p>
              )}
            </div>

            <ChevronRight className="w-4 h-4 text-slate-300" />
          </motion.button>
        ))}
      </div>
    </section>
  );
}
