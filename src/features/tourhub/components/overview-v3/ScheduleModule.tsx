/**
 * ScheduleModule - Tournament Schedule Carousel with Tour Pills
 * 
 * Features:
 * - Tour filter pills (PGA, LIV, DP World, etc.)
 * - Horizontal 4-card carousel per page
 * - Smart initial page (auto-scroll to current/upcoming)
 * - Pagination matching World Rankings pattern
 * - Winner display for completed tournaments
 */

import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  useSeasonTournaments, 
  useAvailableTours, 
  getInitialPage,
  type SeasonTournament 
} from '../../hooks/useSeasonTournaments';
import { ScheduleTournamentCard } from '../schedule/ScheduleTournamentCard';

const ITEMS_PER_PAGE = 4;

/** Tour Filter Pill */
function TourPill({ 
  tour, 
  isActive, 
  onClick 
}: { 
  tour: { tourKey: string; tourName: string; count: number };
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-200",
        isActive
          ? "bg-emerald-600 text-white shadow-sm"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      )}
    >
      {tour.tourName}
    </button>
  );
}

/** Compact Tournament Card for Carousel */
function CarouselCard({ tournament }: { tournament: SeasonTournament }) {
  return (
    <div className="w-[calc(50%-6px)] flex-shrink-0">
      <ScheduleTournamentCard 
        tournament={tournament} 
        compact 
      />
    </div>
  );
}

export function ScheduleModule() {
  const navigate = useNavigate();
  const { data: availableTours, isLoading: toursLoading } = useAvailableTours();
  
  // Default to PGA, fall back to first available tour
  const [selectedTour, setSelectedTour] = useState<string>('pga');
  const [currentPage, setCurrentPage] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Fetch tournaments for selected tour
  const { data: tournaments, isLoading: tournamentsLoading } = useSeasonTournaments(selectedTour);
  
  // Set default tour when available tours load
  useEffect(() => {
    if (availableTours && availableTours.length > 0 && !hasInitialized) {
      const pgaTour = availableTours.find(t => t.tourKey === 'pga');
      if (pgaTour) {
        setSelectedTour('pga');
      } else {
        setSelectedTour(availableTours[0].tourKey);
      }
    }
  }, [availableTours, hasInitialized]);
  
  // Calculate pagination
  const totalTournaments = tournaments?.length || 0;
  const totalPages = Math.ceil(totalTournaments / ITEMS_PER_PAGE);
  
  // Set initial page to current/upcoming tournament when data loads
  useEffect(() => {
    if (tournaments && tournaments.length > 0 && !hasInitialized) {
      const initialPage = getInitialPage(tournaments, ITEMS_PER_PAGE);
      setCurrentPage(initialPage);
      setHasInitialized(true);
    }
  }, [tournaments, hasInitialized]);
  
  // Reset page when tour changes
  useEffect(() => {
    if (hasInitialized && tournaments) {
      const initialPage = getInitialPage(tournaments, ITEMS_PER_PAGE);
      setCurrentPage(initialPage);
    }
  }, [selectedTour]);
  
  const currentTournaments = useMemo(() => {
    if (!tournaments) return [];
    const start = currentPage * ITEMS_PER_PAGE;
    return tournaments.slice(start, start + ITEMS_PER_PAGE);
  }, [tournaments, currentPage]);
  
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalTournaments);
  
  const goToPrevPage = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };
  
  const goToNextPage = () => {
    if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1);
  };
  
  const handleTourChange = (tourKey: string) => {
    setSelectedTour(tourKey);
    setHasInitialized(false); // Reset to recalculate initial page
  };
  
  // Loading state
  if (toursLoading || tournamentsLoading) {
    return (
      <section className="py-6 border-t border-slate-100">
        <div className="px-4 mb-4">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>📅</span>
            Season Schedule
          </p>
          <h2 className="text-lg font-bold text-slate-900">Tournament Schedule</h2>
        </div>
        {/* Tour pills skeleton */}
        <div className="flex gap-2 px-4 mb-4 overflow-x-auto scrollbar-hide">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-8 w-24 bg-slate-100 rounded-full animate-pulse flex-shrink-0" />
          ))}
        </div>
        {/* Cards skeleton */}
        <div className="flex gap-3 px-4">
          {[1, 2].map(i => (
            <div key={i} className="w-[calc(50%-6px)] h-[180px] bg-slate-100 rounded-2xl animate-pulse flex-shrink-0" />
          ))}
        </div>
      </section>
    );
  }
  
  // No tours available
  if (!availableTours || availableTours.length === 0) {
    return null;
  }
  
  // Get current tour display name for empty state
  const currentTourName = availableTours.find(t => t.tourKey === selectedTour)?.tourName || 'this tour';
  
  return (
    <section className="py-6 border-t border-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>📅</span>
            Season Schedule
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
      
      {/* Tour Filter Pills */}
      <div className="flex gap-2 px-4 mb-4 overflow-x-auto scrollbar-hide pb-1">
        {availableTours.map(tour => (
          <TourPill
            key={tour.tourKey}
            tour={tour}
            isActive={selectedTour === tour.tourKey}
            onClick={() => handleTourChange(tour.tourKey)}
          />
        ))}
      </div>
      
      {/* Empty State */}
      {(!tournaments || tournaments.length === 0) && (
        <div className="text-center py-12 px-4">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No tournaments scheduled</p>
          <p className="text-sm text-slate-400 mt-1">
            No tournaments scheduled for {currentTourName} this season
          </p>
        </div>
      )}
      
      {/* Tournament Carousel */}
      {tournaments && tournaments.length > 0 && (
        <>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${selectedTour}-${currentPage}`}
              className="px-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* 2x2 Grid for 4 cards */}
              <div className="flex flex-wrap gap-3">
                {currentTournaments.map(tournament => (
                  <CarouselCard key={tournament.id} tournament={tournament} />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
          
          {/* Pagination Footer */}
          {totalPages > 1 && (
            <>
              <div className="flex items-center justify-center gap-4 py-3 mt-3">
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
                
                {/* Page dots */}
                <div className="flex items-center gap-1.5">
                  {[...Array(Math.min(totalPages, 10))].map((_, i) => {
                    // Smart dot display for many pages
                    let dotIndex = i;
                    if (totalPages > 10) {
                      if (currentPage < 5) {
                        dotIndex = i;
                      } else if (currentPage > totalPages - 6) {
                        dotIndex = totalPages - 10 + i;
                      } else {
                        dotIndex = currentPage - 4 + i;
                      }
                    }
                    
                    return (
                      <button
                        key={dotIndex}
                        onClick={() => setCurrentPage(dotIndex)}
                        className={cn(
                          "rounded-full transition-all",
                          dotIndex === currentPage 
                            ? "w-5 h-2 bg-emerald-500" 
                            : "w-2 h-2 bg-slate-200 hover:bg-slate-300"
                        )}
                      />
                    );
                  })}
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
              
              {/* Page count label */}
              <p className="text-center text-xs text-slate-400">
                {startIndex + 1}–{endIndex} of {totalTournaments}
              </p>
            </>
          )}
        </>
      )}
    </section>
  );
}
