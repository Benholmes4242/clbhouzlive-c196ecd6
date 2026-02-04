/**
 * WorldRankingsModule - Horizontally scrollable OWGR data table (Apple-grade)
 * 
 * Features:
 * - Display limited to 10 players with "View All" for full list
 * - Sticky left columns: Rank, Movement, Player
 * - Scrollable right columns: Avg Pts, Total Pts, Events, Week +/-
 * - Top 3 rank badges with metallic gradients
 * - Alternating row backgrounds
 * - Skeleton loading state with shimmer
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorldRankingsFull } from '../../hooks/useOverviewModules';
import CountryFlag from '@/components/ui/country-flag';
import { getPgaTourHeadshotUrl } from '../../utils/resolvePhotoUrl';

const PLAYERS_PER_PAGE = 10;

/**
 * Format country name: "UNITED STATES" → "United States"
 */
function formatCountryName(country: string | null): string {
  if (!country) return '';
  return country
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Truncate name with ellipsis if too long
 */
function truncateName(name: string, maxLength: number = 13): string {
  if (name.length <= maxLength) return name;
  return name.slice(0, maxLength) + '…';
}

/** Skeleton row with shimmer animation */
function SkeletonRow({ index }: { index: number }) {
  const isEven = index % 2 === 0;
  return (
    <div 
      className={cn(
        "flex items-center px-4 py-3 h-16",
        isEven && "bg-black/[0.015]"
      )}
    >
      {/* Rank */}
      <div className="w-9 flex-shrink-0 flex justify-center">
        <div 
          className="h-5 w-5 rounded"
          style={{
            background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite linear',
          }}
        />
      </div>
      {/* Movement */}
      <div className="w-11 flex-shrink-0 flex justify-center">
        <div 
          className="h-4 w-6 rounded"
          style={{
            background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite linear',
          }}
        />
      </div>
      {/* Avatar */}
      <div className="flex items-center gap-2 w-[160px] flex-shrink-0 pl-1">
        <div 
          className="w-10 h-10 rounded-full flex-shrink-0"
          style={{
            background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite linear',
          }}
        />
        <div className="flex-1 space-y-1.5">
          <div 
            className="h-4 w-24 rounded"
            style={{
              background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite linear',
            }}
          />
          <div 
            className="h-3 w-16 rounded"
            style={{
              background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite linear',
            }}
          />
        </div>
      </div>
      {/* Stats */}
      <div className="flex-1 flex justify-end gap-4 pr-2">
        {[1, 2, 3, 4].map(i => (
          <div 
            key={i}
            className="h-4 w-12 rounded"
            style={{
              background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite linear',
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function WorldRankingsModule() {
  const navigate = useNavigate();
  const { data: rankings, isLoading } = useWorldRankingsFull();
  const [currentPage, setCurrentPage] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const totalPlayers = rankings?.length || 0;
  const totalPages = Math.ceil(totalPlayers / PLAYERS_PER_PAGE);
  
  const startIndex = currentPage * PLAYERS_PER_PAGE;
  const endIndex = Math.min(startIndex + PLAYERS_PER_PAGE, totalPlayers);
  const currentPagePlayers = rankings?.slice(startIndex, endIndex) || [];
  
  // Track horizontal scroll for fade indicator
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      setIsScrolled(container.scrollLeft > 10);
    };
    
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);
  
  const goToPrevPage = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };
  
  const goToNextPage = () => {
    if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1);
  };
  
  if (isLoading) {
    return (
      <section className="pt-6 pb-4 border-t border-slate-100">
        <div className="flex items-center justify-between px-4 mb-4">
          <div>
            <p className="text-[11px] font-medium text-slate-400/50 uppercase tracking-[0.5px]">
              Official World Golf Ranking
            </p>
            <h2 className="text-[22px] font-semibold text-slate-900 mt-1">World Rankings</h2>
          </div>
        </div>
        <div className="px-0">
          {/* Header Row */}
          <div className="flex items-center px-4 py-3 text-[11px] uppercase tracking-[0.3px] text-slate-400/60 font-semibold border-b border-slate-200/60 bg-slate-50/50">
            <div className="w-9 text-center flex-shrink-0">#</div>
            <div className="w-11 text-center flex-shrink-0">+/-</div>
            <div className="w-[160px] flex-shrink-0 pl-1">Player</div>
            <div className="w-[65px] text-right flex-shrink-0">Avg Pts</div>
            <div className="w-[75px] text-right flex-shrink-0">Total Pts</div>
            <div className="w-[55px] text-right flex-shrink-0">Events</div>
            <div className="w-[100px] text-right flex-shrink-0 pr-2">Week +/-</div>
          </div>
          {/* 10 Skeleton Rows */}
          {[...Array(10)].map((_, i) => (
            <SkeletonRow key={i} index={i} />
          ))}
        </div>
      </section>
    );
  }
  
  if (!rankings?.length) {
    return null;
  }
  
  return (
    <section className="pt-6 pb-4 border-t border-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-4">
        <div>
          <p className="text-[11px] font-medium text-slate-400/50 uppercase tracking-[0.5px]">
            Official World Golf Ranking
          </p>
          <h2 className="text-[22px] font-semibold text-slate-900 mt-1">World Rankings</h2>
        </div>
        <button 
          onClick={() => navigate('/tourhub?tab=players')}
          className="text-[15px] font-medium text-slate-400 flex items-center gap-0.5 hover:text-slate-600 transition-colors"
        >
          View All
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      
      {/* Horizontally Scrollable Table Container */}
      <div className="relative">
        {/* Scrollable Area */}
        <div 
          ref={scrollContainerRef}
          className="overflow-x-auto scrollbar-hide"
          style={{
            WebkitOverflowScrolling: 'touch',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}
          role="table"
          aria-label="World Golf Rankings"
        >
          <div className="min-w-[580px]">
            {/* Header Row */}
            <div 
              className="flex items-center px-4 py-3 text-[11px] uppercase tracking-[0.3px] text-slate-400/60 font-semibold border-b border-slate-200/60 bg-slate-50/50"
              role="row"
            >
              {/* Sticky columns */}
              <div className="w-9 text-center flex-shrink-0" role="columnheader">#</div>
              <div className="w-11 text-center flex-shrink-0" role="columnheader">+/-</div>
              <div className="w-[160px] flex-shrink-0 pl-1" role="columnheader">Player</div>
              {/* Scrollable columns */}
              <div className="w-[65px] text-right flex-shrink-0" role="columnheader">Avg Pts</div>
              <div className="w-[75px] text-right flex-shrink-0" role="columnheader">Total Pts</div>
              <div className="w-[55px] text-right flex-shrink-0" role="columnheader">Events</div>
              <div className="w-[100px] text-right flex-shrink-0 pr-2" role="columnheader">Week +/-</div>
            </div>
            
            {/* Player Rows */}
            <div className="divide-y divide-slate-100/50">
              {currentPagePlayers.map((entry, index) => {
                const isEven = index % 2 === 0;
                const fullName = `${entry.player.first_name} ${entry.player.last_name}`;
                const displayName = truncateName(fullName);
                
                return (
                  <div 
                    key={entry.player.id}
                    className={cn(
                      "flex items-center px-4 py-3 cursor-pointer transition-colors active:bg-slate-100/80",
                      isEven && "bg-black/[0.015]"
                    )}
                    onClick={() => navigate(`/tourhub/player/${entry.player.id}`)}
                    role="row"
                    style={{ height: '64px' }}
                  >
                    {/* Sticky: Rank */}
                    <div className="w-9 text-center flex-shrink-0" role="cell">
                      <span className={cn(
                        "font-bold text-[15px]",
                        entry.rank === 1 && "text-amber-500",
                        entry.rank === 2 && "text-slate-400", 
                        entry.rank === 3 && "text-amber-600",
                        entry.rank > 3 && "text-blue-600"
                      )}>
                        {entry.rank}
                      </span>
                      {entry.tied && <span className="text-[8px] text-slate-400 ml-0.5">T</span>}
                    </div>

                    {/* Sticky: Movement */}
                    <div className={cn(
                      "w-11 text-center text-[13px] font-semibold flex-shrink-0",
                      entry.rank_change > 0 && "text-emerald-600",
                      entry.rank_change < 0 && "text-red-500",
                      entry.rank_change === 0 && "text-slate-300"
                    )} role="cell">
                      {entry.rank_change > 0 && `↑${entry.rank_change}`}
                      {entry.rank_change < 0 && `↓${Math.abs(entry.rank_change)}`}
                      {entry.rank_change === 0 && '—'}
                    </div>

                    {/* Sticky: Player */}
                    <div className="w-[160px] flex items-center gap-2.5 flex-shrink-0 pl-1 pr-3" role="cell">
                      <div className="relative flex-shrink-0">
                        <div 
                          className="w-10 h-10 overflow-hidden bg-slate-100"
                          style={{ 
                            borderRadius: '50%',
                            border: '2px solid white',
                            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
                          }}
                        >
                          {(() => {
                            const initials = `${entry.player.first_name?.[0] ?? ''}${entry.player.last_name?.[0] ?? ''}`
                              .toUpperCase() || '?';

                            const photoUrl = entry.player.pga_tour_id
                              ? getPgaTourHeadshotUrl(entry.player.pga_tour_id)
                              : null;

                            return (
                              <div className="relative w-full h-full">
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-200">
                                  <span className="text-[10px] font-bold text-slate-400">{initials}</span>
                                </div>

                                {photoUrl && (
                                  <img
                                    src={photoUrl}
                                    alt={fullName}
                                    className="relative z-10 w-full h-full object-cover"
                                    loading="eager"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                )}
                              </div>
                            );
                          })()}
                        </div>
                        
                        {/* Medal badge for top 3 */}
                        {entry.rank <= 3 && (
                          <div 
                            className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold"
                            style={{
                              background: entry.rank === 1 
                                ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
                                : entry.rank === 2 
                                ? 'linear-gradient(135deg, #E8E8E8 0%, #A8A8A8 100%)'
                                : 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)',
                              color: entry.rank === 1 ? '#92400e' : entry.rank === 2 ? '#374151' : 'white',
                              border: '2px solid white',
                            }}
                          >
                            {entry.rank}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div 
                          className="font-semibold text-slate-900 text-[15px] truncate leading-tight"
                          title={fullName}
                        >
                          {displayName}
                        </div>
                        <div className="text-[12px] text-slate-500/80 flex items-center gap-1 mt-0.5">
                          <div style={{ width: '14px', height: '10px', borderRadius: '1px' }}>
                            <CountryFlag country={entry.player.country} size="sm" />
                          </div>
                          <span className="truncate">{formatCountryName(entry.player.country)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Scrollable: Avg Points */}
                    <div className="w-[65px] text-right flex-shrink-0" role="cell">
                      <span className="font-semibold text-blue-600 text-[14px]">
                        {entry.avg_points?.toFixed(2) ?? '—'}
                      </span>
                    </div>

                    {/* Scrollable: Total Points */}
                    <div className="w-[75px] text-right flex-shrink-0" role="cell">
                      <span className="font-medium text-slate-700 text-[14px]">
                        {entry.total_points 
                          ? entry.total_points.toLocaleString(undefined, { maximumFractionDigits: 1 }) 
                          : '—'}
                      </span>
                    </div>

                    {/* Scrollable: Events */}
                    <div className="w-[55px] text-right flex-shrink-0" role="cell">
                      <span className="font-medium text-slate-600 text-[14px]">
                        {entry.events_played ?? '—'}
                      </span>
                    </div>

                    {/* Scrollable: Week Points +/- with middle dot separator */}
                    <div className="w-[100px] text-right flex-shrink-0 pr-2" role="cell">
                      <span className="text-[13px] whitespace-nowrap">
                        <span className="text-emerald-600 font-medium">
                          +{entry.points_gained?.toFixed(1) ?? '0'}
                        </span>
                        <span className="text-slate-300 mx-1">·</span>
                        <span className="text-red-500 font-medium">
                          -{entry.points_lost?.toFixed(1) ?? '0'}
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Right edge fade indicator */}
        <div 
          className="absolute right-0 top-0 bottom-0 w-10 pointer-events-none transition-opacity duration-200"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.9) 100%)',
            opacity: isScrolled ? 0 : 1,
          }}
        />
        
        {/* Fixed columns edge shadow (shows when scrolled) */}
        <div 
          className={cn(
            "absolute left-[220px] top-0 bottom-0 w-3 pointer-events-none transition-opacity duration-200",
            isScrolled ? "opacity-100" : "opacity-0"
          )}
          style={{
            background: 'linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)',
          }}
        />
        
        {/* Scroll hint - only show on first page */}
        {currentPage === 0 && (
          <div className="text-center text-[10px] text-slate-400/60 mt-2 flex items-center justify-center gap-1">
            <span>←</span>
            <span>Scroll for more stats</span>
            <span>→</span>
          </div>
        )}
      </div>
      
      {/* Pagination Footer */}
      {totalPages > 1 && (
        <>
          <div className="flex items-center justify-center gap-4 py-3 mt-2">
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
            
            {/* Page dots with animated pill for active */}
            <div className="flex items-center gap-1.5">
              {[...Array(Math.min(totalPages, 14))].map((_, i) => {
                // Show dots intelligently when there are many pages
                let dotIndex = i;
                if (totalPages > 14) {
                  if (currentPage < 7) {
                    dotIndex = i;
                  } else if (currentPage > totalPages - 8) {
                    dotIndex = totalPages - 14 + i;
                  } else {
                    dotIndex = currentPage - 6 + i;
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
                        ? "w-5 bg-slate-700" 
                        : "w-1.5 bg-slate-200 hover:bg-slate-300"
                    )}
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
            {startIndex + 1}–{endIndex} of {totalPlayers}
          </p>
        </>
      )}
    </section>
  );
}
