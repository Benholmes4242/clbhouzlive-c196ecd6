/**
 * ScheduleModule - Tournament Schedule Carousel with Tour Pills
 * 
 * Features:
 * - Tour filter pills (PGA, LIV, DP World, etc.)
 * - Horizontal 4-card carousel per page
 * - Smart initial page (auto-scroll to current/upcoming)
 * - Swipe gesture support for mobile
 * - Pagination matching World Rankings pattern
 * - Winner display for completed tournaments
 * - Prefetches adjacent page images for smooth transitions
 * - Apple-grade polish: shimmer loading, pill pagination, scroll snap
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { ChevronRight, ChevronLeft, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  useSeasonTournaments, 
  useAvailableTours, 
  getInitialPage,
  type SeasonTournament 
} from '../../hooks/useSeasonTournaments';
import { ScheduleTournamentCard, prefetchTournamentImages } from '../schedule/ScheduleTournamentCard';
import { getCourseImage } from '../../utils/placeholders';

const ITEMS_PER_PAGE = 4;

/** Tour Filter Pill - with refined styling */
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
        "active:scale-95",
        isActive
          ? "bg-[#374151] text-white shadow-[0_2px_8px_rgba(55,65,81,0.25)]"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-300"
      )}
    >
      {tour.tourName}
    </button>
  );
}

/** Compact Tournament Card for Carousel */
function CarouselCard({ tournament }: { tournament: SeasonTournament }) {
  return (
    <div className="w-[calc(50%-6px)] flex-shrink-0 scroll-snap-align-start">
      <ScheduleTournamentCard 
        tournament={tournament} 
        compact 
      />
    </div>
  );
}

/** Shimmer skeleton for tournament cards */
function CardSkeleton({ compact = false }: { compact?: boolean }) {
  const height = compact ? 'h-36' : 'h-44';
  return (
    <div 
      className={cn(
        "w-[calc(50%-6px)] flex-shrink-0 rounded-2xl overflow-hidden relative",
        height
      )}
    >
      <div 
        className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200"
        style={{
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s linear infinite',
        }}
      />
      {/* Content skeleton */}
      <div className="absolute inset-0 flex flex-col justify-end p-3">
        <div className="h-4 w-3/4 bg-slate-300/50 rounded mb-1.5" />
        <div className="h-3 w-1/2 bg-slate-300/40 rounded" />
      </div>
    </div>
  );
}

export function ScheduleModule() {
  const navigate = useNavigate();
  const { data: availableTours, isLoading: toursLoading } = useAvailableTours();
  
  // Default to PGA, fall back to first available tour
  const [selectedTour, setSelectedTour] = useState<string>('pga');
  const [currentPage, setCurrentPage] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  
  // Fetch tournaments for selected tour
  const { data: tournaments, isLoading: tournamentsLoading, isFetching } = useSeasonTournaments(selectedTour);
  
  // Calculate pagination
  const totalTournaments = tournaments?.length || 0;
  const totalPages = Math.ceil(totalTournaments / ITEMS_PER_PAGE);
  
  // Set initial page when tour changes and data loads
  useEffect(() => {
    if (tournaments && tournaments.length > 0 && !isFetching) {
      const initialPage = getInitialPage(tournaments, ITEMS_PER_PAGE);
      setCurrentPage(initialPage);
    }
  }, [tournaments, selectedTour, isFetching]);
  
  // Get tournaments for a specific page
  const getPageTournaments = useCallback((page: number) => {
    if (!tournaments) return [];
    const start = page * ITEMS_PER_PAGE;
    return tournaments.slice(start, start + ITEMS_PER_PAGE);
  }, [tournaments]);
  
  const currentTournaments = useMemo(() => {
    return getPageTournaments(currentPage);
  }, [getPageTournaments, currentPage]);
  
  // Prefetch adjacent page images for smooth transitions
  useEffect(() => {
    if (!tournaments || tournaments.length === 0) return;
    
    const adjacentPages: SeasonTournament[] = [];
    
    // Prefetch previous page
    if (currentPage > 0) {
      adjacentPages.push(...getPageTournaments(currentPage - 1));
    }
    
    // Prefetch next page
    if (currentPage < totalPages - 1) {
      adjacentPages.push(...getPageTournaments(currentPage + 1));
    }
    
    // Prefetch images
    if (adjacentPages.length > 0) {
      adjacentPages.forEach(tournament => {
        const img = new Image();
        img.src = getCourseImage({ id: tournament.id });
      });
    }
  }, [currentPage, tournaments, totalPages, getPageTournaments]);
  
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalTournaments);
  
  const goToPrevPage = useCallback(() => {
    if (currentPage > 0) {
      setSwipeDirection('right');
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);
  
  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages - 1) {
      setSwipeDirection('left');
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);
  
  const handleTourChange = useCallback((tourKey: string) => {
    if (tourKey !== selectedTour) {
      setSelectedTour(tourKey);
      setCurrentPage(0); // Reset to first page, will be recalculated when data loads
    }
  }, [selectedTour]);
  
  // Swipe handlers for mobile
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => goToNextPage(),
    onSwipedRight: () => goToPrevPage(),
    preventScrollOnSwipe: true,
    trackMouse: false,
    trackTouch: true,
    delta: 50, // Minimum swipe distance
  });
  
  // Loading state
  const isLoading = toursLoading || (tournamentsLoading && !tournaments);
  
  if (isLoading) {
    return (
      <section className="pt-6 pb-4">
        <div className="px-4 mb-4">
          <p className="text-[11px] font-medium text-slate-400/50 uppercase tracking-[0.5px] mb-1">
            Season Schedule
          </p>
          <h2 className="text-[22px] font-semibold text-slate-900" style={{ letterSpacing: '-0.02em' }}>
            Tournament Schedule
          </h2>
        </div>
        {/* Tour pills skeleton with shimmer */}
        <div className="flex gap-2 px-4 mb-4 overflow-x-auto scrollbar-hide">
          {[1, 2, 3, 4].map(i => (
            <div 
              key={i} 
              className="h-8 w-24 rounded-full flex-shrink-0 overflow-hidden relative"
            >
              <div 
                className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200"
                style={{
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s linear infinite',
                }}
              />
            </div>
          ))}
        </div>
        {/* Cards skeleton with shimmer */}
        <div className="flex flex-wrap gap-3 px-4">
          <CardSkeleton compact />
          <CardSkeleton compact />
          <CardSkeleton compact />
          <CardSkeleton compact />
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
  
  // Animation variants based on swipe direction
  const getAnimationVariants = () => ({
    initial: { 
      opacity: 0, 
      x: swipeDirection === 'left' ? 50 : swipeDirection === 'right' ? -50 : 0 
    },
    animate: { opacity: 1, x: 0 },
    exit: { 
      opacity: 0, 
      x: swipeDirection === 'left' ? -50 : swipeDirection === 'right' ? 50 : 0 
    },
  });
  
  return (
    <section className="pt-6 pb-4">
      {/* Header - refined typography */}
      <div className="flex items-center justify-between px-4 mb-4">
        <div className="space-y-0.5">
          <p className="text-[11px] font-medium text-slate-400/50 uppercase tracking-[0.5px]">
            Season Schedule
          </p>
          <h2 className="text-[22px] font-semibold text-slate-900" style={{ letterSpacing: '-0.02em' }}>
            Tournament Schedule
          </h2>
        </div>
        <button 
          onClick={() => navigate('/tourhub?tab=schedule')}
          className="text-[15px] font-medium text-[#374151] flex items-center gap-0.5 opacity-60 hover:opacity-100 transition-opacity"
        >
          View All
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      
      {/* Tour Filter Pills - 16px gap from header */}
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
      {(!tournaments || tournaments.length === 0) && !isFetching && (
        <div className="text-center py-12 px-4">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No tournaments scheduled</p>
          <p className="text-sm text-slate-400 mt-1">
            No tournaments scheduled for {currentTourName} this season
          </p>
        </div>
      )}
      
      {/* Loading indicator for tour switch */}
      {isFetching && tournaments && (
        <div className="px-4 mb-2">
          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-slate-400 rounded-full animate-pulse" />
          </div>
        </div>
      )}
      
      {/* Tournament Carousel with Swipe & Scroll Snap */}
      {tournaments && tournaments.length > 0 && (
        <>
          <div 
            {...swipeHandlers} 
            className="touch-pan-y"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`${selectedTour}-${currentPage}`}
                className="px-4"
                variants={getAnimationVariants()}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                {/* 2x2 Grid for 4 cards - 12px gap */}
                <div className="flex flex-wrap gap-3">
                  {currentTournaments.map(tournament => (
                    <CarouselCard key={tournament.id} tournament={tournament} />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          
          
          {/* Pagination Footer */}
          {totalPages > 1 && (
            <>
              <div className="flex items-center justify-center gap-4 py-3 mt-1">
                <button 
                  onClick={goToPrevPage}
                  disabled={currentPage === 0}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150",
                    currentPage === 0 
                      ? "text-slate-200 cursor-not-allowed" 
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 active:bg-slate-200 active:scale-95"
                  )}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                {/* Page dots - active animates to pill shape */}
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
                    
                    const isActive = dotIndex === currentPage;
                    
                    return (
                      <button
                        key={dotIndex}
                        onClick={() => setCurrentPage(dotIndex)}
                        className={cn(
                          "h-1.5 rounded-full transition-all duration-200 ease-out",
                          isActive 
                            ? "w-5 bg-[#374151]" 
                            : "w-1.5 bg-slate-200 hover:bg-slate-300 active:bg-slate-400"
                        )}
                        aria-label={`Go to page ${dotIndex + 1}`}
                      />
                    );
                  })}
                </div>
                
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages - 1}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150",
                    currentPage === totalPages - 1 
                      ? "text-slate-200 cursor-not-allowed" 
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 active:bg-slate-200 active:scale-95"
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
      
      {/* Shimmer keyframe animation (defined in CSS, but adding inline for safety) */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </section>
  );
}
