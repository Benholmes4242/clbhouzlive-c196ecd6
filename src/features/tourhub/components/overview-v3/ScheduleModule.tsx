/**
 * ScheduleModule - Carousel-based Tournament Schedule
 * Shows upcoming tournaments in a paginated carousel format
 * 5 tournaments per page, matches World Rankings module pattern
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUpcomingTournaments, ScheduledTournament } from '../../hooks/useTournamentSchedule';
import { ChevronRight, ChevronLeft, Calendar, MapPin, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const ITEMS_PER_PAGE = 5;

/** Badge for Major, Players Championship, or Signature events */
const TournamentBadge = ({ tournament }: { tournament: ScheduledTournament }) => {
  if (tournament.isMajor) {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold uppercase">
        <Trophy className="w-2.5 h-2.5" />
        Major
      </span>
    );
  }
  if (tournament.isPlayersChampionship) {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-semibold uppercase">
        <Trophy className="w-2.5 h-2.5" />
        Players
      </span>
    );
  }
  if (tournament.isSignature) {
    return (
      <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold uppercase">
        Signature
      </span>
    );
  }
  return null;
};

/** Badge showing days until tournament starts */
const DaysUntilBadge = ({ days }: { days: number }) => {
  if (days === 0) {
    return (
      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-medium">
        Starts Today
      </span>
    );
  }
  if (days === 1) {
    return (
      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-medium">
        Tomorrow
      </span>
    );
  }
  if (days <= 7) {
    return (
      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-medium">
        {days} days
      </span>
    );
  }
  return null;
};

/** Individual tournament row */
const TournamentRow = ({ 
  tournament, 
  onTap 
}: { 
  tournament: ScheduledTournament; 
  onTap: () => void; 
}) => {
  const startDate = new Date(tournament.startDate);
  
  return (
    <div
      onClick={onTap}
      className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 active:bg-slate-100 cursor-pointer transition-colors"
    >
      {/* Date Column */}
      <div className="w-14 flex-shrink-0 text-center">
        <div className="text-[13px] font-bold text-emerald-600 uppercase leading-none">
          {startDate.toLocaleDateString('en-US', { month: 'short' })}
        </div>
        <div className="text-xl font-bold text-slate-900 leading-tight">
          {startDate.getDate()}
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-12 bg-slate-200 flex-shrink-0" />

      {/* Tournament Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-semibold text-[15px] text-slate-900 truncate">
            {tournament.name}
          </span>
          <TournamentBadge tournament={tournament} />
        </div>
        <div className="flex items-center gap-1 text-[13px] text-slate-500">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">
            {tournament.venueName}
            {tournament.state && `, ${tournament.state}`}
          </span>
        </div>
      </div>

      {/* Right Side: Purse + Days Until */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-xs font-medium text-slate-600">
          {tournament.purseFormatted}
        </span>
        <DaysUntilBadge days={tournament.daysUntil} />
      </div>

      {/* Chevron */}
      <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
    </div>
  );
};

export function ScheduleModule() {
  const navigate = useNavigate();
  const { data: tournaments, isLoading } = useUpcomingTournaments(50);
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = useMemo(() => {
    if (!tournaments) return 0;
    return Math.ceil(tournaments.length / ITEMS_PER_PAGE);
  }, [tournaments]);

  const currentTournaments = useMemo(() => {
    if (!tournaments) return [];
    const start = currentPage * ITEMS_PER_PAGE;
    return tournaments.slice(start, start + ITEMS_PER_PAGE);
  }, [tournaments, currentPage]);

  const goToPrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <section className="py-6 border-t border-slate-100">
        <div className="px-4 mb-4">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>📅</span>
            Upcoming
          </p>
          <h2 className="text-lg font-bold text-slate-900">Tournament Schedule</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-14 h-12 bg-slate-100 rounded animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse" />
                  <div className="h-3 bg-slate-100 rounded w-1/2 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Empty state
  if (!tournaments?.length) {
    return (
      <section className="py-6 border-t border-slate-100">
        <div className="px-4 mb-4">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>📅</span>
            Upcoming
          </p>
          <h2 className="text-lg font-bold text-slate-900">Tournament Schedule</h2>
        </div>
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No upcoming tournaments</p>
          <p className="text-sm text-slate-400 mt-1">Check back later for the schedule</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 border-t border-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>📅</span>
            Upcoming
          </p>
          <h2 className="text-lg font-bold text-slate-900">Tournament Schedule</h2>
        </div>
        <button 
          onClick={() => navigate('/tourhub?tab=schedule')}
          className="text-sm font-semibold text-emerald-600 flex items-center gap-1"
        >
          View All
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Tournament List with Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          className="divide-y divide-slate-100"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {currentTournaments.map(tournament => (
            <TournamentRow
              key={tournament.id}
              tournament={tournament}
              onTap={() => navigate(`/tourhub/tournament/${tournament.id}`)}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Scroll Hint - only on first page */}
      {currentPage === 0 && totalPages > 1 && (
        <div className="text-center text-[10px] text-slate-400 mt-2 flex items-center justify-center gap-1">
          <span>←</span>
          <span>Scroll for more tournaments</span>
          <span>→</span>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <>
          <div className="flex items-center justify-center gap-4 py-3 mt-2">
            <button
              onClick={goToPrevPage}
              disabled={currentPage === 0}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                currentPage === 0
                  ? "text-slate-200 cursor-not-allowed"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              )}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Page Dots */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index)}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    index === currentPage
                      ? "w-6 bg-emerald-500"
                      : "w-2 bg-slate-200 hover:bg-slate-300"
                  )}
                />
              ))}
            </div>

            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages - 1}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                currentPage === totalPages - 1
                  ? "text-slate-200 cursor-not-allowed"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              )}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Page Count Label */}
          <p className="text-center text-xs text-slate-400">
            {currentPage * ITEMS_PER_PAGE + 1}–{Math.min((currentPage + 1) * ITEMS_PER_PAGE, tournaments.length)} of {tournaments.length}
          </p>
        </>
      )}
    </section>
  );
}
