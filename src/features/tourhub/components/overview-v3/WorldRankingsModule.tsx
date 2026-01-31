/**
 * WorldRankingsModule - Full OWGR browsable list with pagination
 * Shows 15 players at a time with smooth slide navigation
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useWorldRankingsFull } from '../../hooks/useOverviewModules';
import CountryFlag from '@/components/ui/country-flag';

const PLAYERS_PER_PAGE = 15;

export function WorldRankingsModule() {
  const navigate = useNavigate();
  const { data: rankings, isLoading } = useWorldRankingsFull();
  const [currentPage, setCurrentPage] = useState(0);
  
  // Touch swipe support
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;
  
  const totalPages = Math.ceil((rankings?.length || 0) / PLAYERS_PER_PAGE);
  
  const goToPage = (page: number) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  };
  
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) goToPage(currentPage + 1);
    if (isRightSwipe) goToPage(currentPage - 1);
  };
  
  const getRankChangeDisplay = (change: number | null) => {
    if (change === null || change === 0) {
      return <span className="text-slate-400 text-xs">—</span>;
    }
    if (change < 0) {
      // Negative change = moved UP (improved)
      return (
        <span className="text-emerald-500 text-xs font-semibold flex items-center gap-0.5">
          ↑{Math.abs(change)}
        </span>
      );
    }
    // Positive change = moved DOWN
    return (
      <span className="text-red-500 text-xs font-semibold flex items-center gap-0.5">
        ↓{change}
      </span>
    );
  };
  
  if (isLoading) {
    return (
      <section className="py-6 border-t border-slate-100">
        <div className="px-4 mb-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Official World Golf Ranking
          </p>
          <h2 className="text-lg font-bold text-slate-900">World Rankings</h2>
        </div>
        <div className="px-4 space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </section>
    );
  }
  
  if (!rankings?.length) {
    return null;
  }
  
  return (
    <section className="py-6 border-t border-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-4">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Official World Golf Ranking
          </p>
          <h2 className="text-lg font-bold text-slate-900">World Rankings</h2>
        </div>
        <button 
          onClick={() => navigate('/tourhub?tab=players')}
          className="text-sm font-semibold text-emerald-600 flex items-center gap-1"
        >
          View All
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      {/* Rankings List with Swipe */}
      <div 
        className="relative overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <motion.div 
          className="flex"
          animate={{ x: `-${currentPage * 100}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {[...Array(totalPages)].map((_, pageIndex) => (
            <div 
              key={pageIndex}
              className="w-full flex-shrink-0 px-4"
            >
              <div className="space-y-1">
                {rankings
                  .slice(pageIndex * PLAYERS_PER_PAGE, (pageIndex + 1) * PLAYERS_PER_PAGE)
                  .map((entry) => (
                    <button
                      key={entry.rank}
                      onClick={() => navigate(`/tourhub/player/${entry.player.id}`)}
                      className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors"
                    >
                      {/* Rank */}
                      <div className="w-8 text-center">
                        <span className={cn(
                          "text-sm font-bold",
                          entry.rank === 1 ? "text-amber-500" :
                          entry.rank === 2 ? "text-slate-400" :
                          entry.rank === 3 ? "text-amber-600" :
                          "text-slate-500"
                        )}>
                          {entry.rank}
                        </span>
                      </div>
                      
                      {/* Photo */}
                      <div className={cn(
                        "w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex-shrink-0",
                        entry.rank === 1 && "ring-2 ring-amber-400 ring-offset-1"
                      )}>
                        {entry.player.photo_url ? (
                          <img 
                            src={entry.player.photo_url}
                            alt={entry.player.last_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-200">
                            <span className="text-xs font-bold text-slate-400">
                              {entry.player.first_name?.[0]}{entry.player.last_name?.[0]}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Name & Country */}
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {entry.player.first_name} {entry.player.last_name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <CountryFlag country={entry.player.country} size="sm" />
                          <span className="text-xs text-slate-400 truncate">
                            {entry.player.country}
                          </span>
                        </div>
                      </div>
                      
                      {/* Points */}
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-700">
                          {entry.avg_points?.toFixed(2) || '—'}
                        </p>
                        <p className="text-[10px] text-slate-400 uppercase">
                          Avg Pts
                        </p>
                      </div>
                      
                      {/* Rank Change */}
                      <div className="w-10 text-right">
                        {getRankChangeDisplay(entry.rank_change)}
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
      
      {/* Navigation */}
      <div className="flex items-center justify-center gap-4 mt-4 px-4">
        {/* Left Chevron */}
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 0}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
            currentPage === 0 
              ? "text-slate-200 cursor-not-allowed"
              : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          )}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        {/* Pagination Dots */}
        <div className="flex items-center gap-1.5">
          {[...Array(Math.min(totalPages, 10))].map((_, i) => {
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
                onClick={() => goToPage(dotIndex)}
                className={cn(
                  "rounded-full transition-all",
                  dotIndex === currentPage 
                    ? "w-6 h-2 bg-emerald-500" 
                    : "w-2 h-2 bg-slate-200 hover:bg-slate-300"
                )}
              />
            );
          })}
        </div>
        
        {/* Right Chevron */}
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages - 1}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
            currentPage === totalPages - 1
              ? "text-slate-200 cursor-not-allowed"
              : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          )}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      
      {/* Page Indicator */}
      <p className="text-center text-xs text-slate-400 mt-2">
        {currentPage * PLAYERS_PER_PAGE + 1}–{Math.min((currentPage + 1) * PLAYERS_PER_PAGE, rankings?.length || 0)} of {rankings?.length || 0}
      </p>
    </section>
  );
}
