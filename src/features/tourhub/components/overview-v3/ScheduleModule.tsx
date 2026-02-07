/**
 * ScheduleModule - Tournament Schedule Carousel with Tour Pills
 * 
 * Features:
 * - Tour filter pills (PGA, LIV, DP World, etc.)
 * - Horizontal 4-card carousel per page
 * - Smart initial page (auto-scroll to current/upcoming)
 * - Swipe gesture support for mobile
 * - Pagination with animated pill indicator
 * - Winner display for completed tournaments
 * - Prefetches adjacent page images for smooth transitions
 */

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { ChevronRight, ChevronLeft, Calendar, Trophy } from 'lucide-react';
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

/** Tour Filter Pill - Refined light mode design */
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
        "flex-shrink-0 whitespace-nowrap transition-all duration-250",
        "active:scale-95"
      )}
      style={{
        padding: '8px 16px',
        borderRadius: '10px',
        fontSize: '13px',
        fontWeight: isActive ? 600 : 500,
        background: isActive ? 'hsl(var(--foreground))' : 'hsl(var(--card))',
        color: isActive ? 'hsl(var(--card))' : 'hsl(var(--muted-foreground))',
        border: isActive ? '1px solid hsl(var(--foreground))' : '1px solid hsl(var(--border))',
        boxShadow: isActive ? '0 2px 6px rgba(0, 0, 0, 0.1)' : 'none',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {tour.tourName}
    </button>
  );
}

/** Compact Tournament Card for Carousel */
function CarouselCard({ tournament, delay = 0 }: { tournament: SeasonTournament; delay?: number }) {
  return (
    <motion.div 
      className="w-[calc(50%-6px)] flex-shrink-0"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay,
        ease: [0.16, 1, 0.3, 1] 
      }}
    >
      <ScheduleTournamentCard 
        tournament={tournament} 
        compact 
      />
    </motion.div>
  );
}

/** Skeleton card with shimmer animation */
function SkeletonCard() {
  return (
    <div 
      className="w-[calc(50%-6px)] flex-shrink-0 rounded-[14px] overflow-hidden relative"
      style={{ 
        aspectRatio: '4/3',
        background: 'linear-gradient(90deg, #F1F3F5 25%, #E5E7EB 50%, #F1F3F5 75%)', 
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite linear',
      }}
    />
  );
}

export function ScheduleModule() {
  const navigate = useNavigate();
  const { data: availableTours, isLoading: toursLoading } = useAvailableTours();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  
  // Default to PGA, fall back to first available tour
  const [selectedTour, setSelectedTour] = useState<string>('pga');
  const [currentPage, setCurrentPage] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  
  // Fetch tournaments for selected tour
  const { data: tournaments, isLoading: tournamentsLoading, isFetching } = useSeasonTournaments(selectedTour);
  
  // Calculate pagination
  const totalTournaments = tournaments?.length || 0;
  const totalPages = Math.ceil(totalTournaments / ITEMS_PER_PAGE);
  
  // Handle scroll for left fade visibility
  const handlePillScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      setShowLeftFade(scrollContainerRef.current.scrollLeft > 10);
    }
  }, []);
  
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
      <section style={{ paddingTop: '32px', paddingBottom: '16px' }}>
        {/* Header skeleton */}
        <div className="flex items-center justify-between px-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-slate-100 animate-pulse" />
            <div className="h-6 w-40 bg-slate-100 rounded-lg animate-pulse" />
          </div>
        </div>
        {/* Tour pills skeleton */}
        <div className="flex gap-2 px-4 mb-4 overflow-x-auto scrollbar-hide">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-9 w-24 bg-white border border-black/8 rounded-[10px] animate-pulse flex-shrink-0" />
          ))}
        </div>
        {/* Cards skeleton with shimmer */}
        <div className="flex flex-wrap gap-3 px-4">
          {[1, 2, 3, 4].map(i => (
            <SkeletonCard key={i} />
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
  
  // Calculate visible dots (max 6 with sliding window)
  const maxVisibleDots = 6;
  const getVisibleDotRange = () => {
    if (totalPages <= maxVisibleDots) {
      return { start: 0, end: totalPages };
    }
    
    const halfWindow = Math.floor(maxVisibleDots / 2);
    let start = currentPage - halfWindow;
    let end = currentPage + halfWindow;
    
    if (start < 0) {
      start = 0;
      end = maxVisibleDots;
    } else if (end >= totalPages) {
      end = totalPages;
      start = totalPages - maxVisibleDots;
    }
    
    return { start, end };
  };
  
  const dotRange = getVisibleDotRange();
  
  return (
    <motion.section 
      style={{ paddingTop: '32px', paddingBottom: '16px' }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header - Icon + Title + View All */}
      <motion.div 
        className="flex items-center justify-between px-4 mb-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 
          className="text-foreground"
          style={{ 
            fontSize: '20px', 
            fontWeight: 700, 
            letterSpacing: '-0.3px',
          }}
        >
          Tournament Schedule
        </h2>
        
        <button 
          onClick={() => navigate('/tourhub?tab=schedule')}
          className="flex items-center gap-1 group transition-all duration-300 active:scale-95 text-muted-foreground"
          style={{ 
            fontSize: '13px', 
            fontWeight: 600,
          }}
        >
          <span className="group-hover:text-primary transition-colors">View All</span>
          <ChevronRight 
            className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-[3px] transition-all" 
            style={{ color: 'inherit' }}
          />
        </button>
      </motion.div>
      
      {/* Tour Filter Pills with edge fades */}
      <motion.div 
        className="relative mb-3.5"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Left fade (when scrolled) */}
        {showLeftFade && (
          <div 
            className="absolute left-0 top-0 bottom-0 z-10 pointer-events-none"
            style={{
              width: '32px',
              background: 'linear-gradient(to right, #f8fafc 0%, transparent 100%)',
            }}
          />
        )}
        
        <div 
          ref={scrollContainerRef}
          onScroll={handlePillScroll}
          className="flex gap-2 px-4 overflow-x-auto scrollbar-hide pb-1"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {availableTours.map(tour => (
            <TourPill
              key={tour.tourKey}
              tour={tour}
              isActive={selectedTour === tour.tourKey}
              onClick={() => handleTourChange(tour.tourKey)}
            />
          ))}
        </div>
        
        {/* Right fade */}
        <div 
          className="absolute right-0 top-0 bottom-0 z-10 pointer-events-none"
          style={{
            width: '32px',
            background: 'linear-gradient(to left, #f8fafc 0%, transparent 100%)',
          }}
        />
      </motion.div>
      
      {/* Empty State */}
      {(!tournaments || tournaments.length === 0) && !isFetching && (
        <div className="text-center py-12 px-4">
          <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(0, 0, 0, 0.15)' }} />
          <p className="text-foreground" style={{ fontWeight: 600 }}>No tournaments scheduled</p>
          <p className="text-sm mt-1 text-muted-foreground/60">
            No tournaments scheduled for {currentTourName} this season
          </p>
        </div>
      )}
      
      {/* Loading indicator for tour switch */}
      {isFetching && tournaments && (
        <div className="px-4 mb-2">
          <div 
            className="h-1 w-full rounded-full overflow-hidden"
            style={{ background: 'rgba(0, 0, 0, 0.06)' }}
          >
            <div className="h-full w-1/3 bg-slate-400 rounded-full animate-pulse" />
          </div>
        </div>
      )}
      
      {/* Tournament Carousel with Swipe */}
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
                initial={{ opacity: 0, x: swipeDirection === 'left' ? 50 : swipeDirection === 'right' ? -50 : 0 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: swipeDirection === 'left' ? -50 : swipeDirection === 'right' ? 50 : 0 }}
                transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                {/* 2x2 Grid for 4 cards with staggered entrance */}
                <div className="flex flex-wrap" style={{ gap: '12px' }}>
                  {currentTournaments.map((tournament, index) => {
                    // Stagger: top-left 0.2s, top-right 0.25s, bottom-left 0.3s, bottom-right 0.35s
                    const delays = [0.2, 0.25, 0.3, 0.35];
                    return (
                      <CarouselCard 
                        key={tournament.id} 
                        tournament={tournament}
                        delay={delays[index] || 0}
                      />
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          
          
          {/* Pagination Footer */}
          {totalPages > 1 && (
            <>
              <div className="flex items-center justify-center gap-4 py-3 mt-4">
                {/* Left Arrow */}
                <button 
                  onClick={goToPrevPage}
                  disabled={currentPage === 0}
                  className="flex items-center justify-center transition-all duration-200 active:scale-[0.92]"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    boxShadow: currentPage === 0 ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.04)',
                    opacity: currentPage === 0 ? 0.3 : 1,
                    pointerEvents: currentPage === 0 ? 'none' : 'auto',
                  }}
                >
                <ChevronLeft 
                    className="w-3.5 h-3.5 text-muted-foreground" 
                    style={{ opacity: currentPage === 0 ? 0.4 : 1 }} 
                  />
                </button>
                
                {/* Page dots with animated pill for active (max 6 visible) */}
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: dotRange.end - dotRange.start }).map((_, i) => {
                    const dotIndex = dotRange.start + i;
                    const isActive = dotIndex === currentPage;
                    
                    return (
                      <button
                        key={dotIndex}
                        onClick={() => setCurrentPage(dotIndex)}
                        className="transition-all duration-300"
                        style={{
                          height: '6px',
                          width: isActive ? '20px' : '6px',
                          borderRadius: '3px',
                          background: isActive ? '#111827' : 'rgba(0, 0, 0, 0.15)',
                          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                      />
                    );
                  })}
                </div>
                
                {/* Right Arrow */}
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages - 1}
                  className="flex items-center justify-center transition-all duration-200 active:scale-[0.92]"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    boxShadow: currentPage === totalPages - 1 ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.04)',
                    opacity: currentPage === totalPages - 1 ? 0.3 : 1,
                    pointerEvents: currentPage === totalPages - 1 ? 'none' : 'auto',
                  }}
                >
                <ChevronRight 
                    className="w-3.5 h-3.5 text-muted-foreground" 
                    style={{ opacity: currentPage === totalPages - 1 ? 0.4 : 1 }} 
                  />
                </button>
              </div>
              
              {/* Page count label */}
              <p 
                className="text-center text-muted-foreground/60"
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  marginTop: '6px',
                }}
              >
                {startIndex + 1}–{endIndex} of {totalTournaments}
              </p>
            </>
          )}
        </>
      )}
    </motion.section>
  );
}
