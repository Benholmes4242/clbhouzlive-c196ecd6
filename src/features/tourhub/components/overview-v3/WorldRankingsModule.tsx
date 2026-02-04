/**
 * WorldRankingsModule - Official World Golf Ranking Table (Apple-grade polish)
 * 
 * Features:
 * - Exactly 10 players displayed (not 15)
 * - Sticky left columns: Movement, Player (with rank badge on avatar)
 * - Scrollable right columns: Avg Pts, Total Pts, Events, Week +/-
 * - Shimmer skeleton loading (10 rows)
 * - Top 3 metallic rank badges (Gold/Silver/Bronze)
 * - Alternating row backgrounds
 * - Week +/- format with middle dot separator
 * - Refined typography and spacing
 * - Accessibility labels
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

/** Shimmer skeleton row */
function SkeletonRow({ index }: { index: number }) {
  return (
    <div 
      className={cn(
        "flex items-center px-4 py-3 gap-3",
        index % 2 === 1 && "bg-black/[0.015]"
      )}
    >
      {/* Movement skeleton */}
      <div className="w-9 flex justify-center">
        <div 
          className="w-6 h-4 rounded overflow-hidden relative"
        >
          <div 
            className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200"
            style={{ backgroundSize: '200% 100%', animation: 'shimmer 1.5s linear infinite' }}
          />
        </div>
      </div>
      
      {/* Avatar skeleton */}
      <div className="w-10 h-10 rounded-full overflow-hidden relative flex-shrink-0">
        <div 
          className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200"
          style={{ backgroundSize: '200% 100%', animation: 'shimmer 1.5s linear infinite' }}
        />
      </div>
      
      {/* Name skeleton */}
      <div className="flex-1 min-w-0">
        <div className="h-4 w-24 rounded overflow-hidden relative mb-1">
          <div 
            className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200"
            style={{ backgroundSize: '200% 100%', animation: 'shimmer 1.5s linear infinite' }}
          />
        </div>
        <div className="h-3 w-16 rounded overflow-hidden relative">
          <div 
            className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200"
            style={{ backgroundSize: '200% 100%', animation: 'shimmer 1.5s linear infinite' }}
          />
        </div>
      </div>
      
      {/* Stats skeleton */}
      <div className="h-4 w-12 rounded overflow-hidden relative">
        <div 
          className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200"
          style={{ backgroundSize: '200% 100%', animation: 'shimmer 1.5s linear infinite' }}
        />
      </div>
    </div>
  );
}

/** Rank badge for top 3 */
function RankBadge({ rank }: { rank: number }) {
  if (rank > 3) {
    return (
      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-[#475569] text-white border-2 border-white shadow-sm">
        {rank}
      </div>
    );
  }
  
  const colors = {
    1: 'bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-white',
    2: 'bg-gradient-to-br from-[#E8E8E8] to-[#A8A8A8] text-[#666]',
    3: 'bg-gradient-to-br from-[#CD7F32] to-[#8B4513] text-white',
  } as const;
  
  return (
    <div className={cn(
      "absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm",
      colors[rank as 1 | 2 | 3]
    )}>
      {rank}
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
  
  const goToPrevPage = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };
  
  const goToNextPage = () => {
    if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1);
  };
  
  // Track horizontal scroll for fade indicator
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      setIsScrolled(container.scrollLeft > 10);
    };
    
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);
  
  if (isLoading) {
    return (
      <section className="pt-6 pb-4">
        <div className="flex items-center justify-between px-4 mb-4">
          <div className="space-y-0.5">
            <p className="text-[11px] font-medium text-slate-400/50 uppercase tracking-[0.5px]">
              Official World Golf Ranking
            </p>
            <h2 className="text-[22px] font-semibold text-slate-900" style={{ letterSpacing: '-0.02em' }}>
              World Rankings
            </h2>
          </div>
        </div>
        <div>
          {[...Array(10)].map((_, i) => (
            <SkeletonRow key={i} index={i} />
          ))}
        </div>
        <style>{`
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </section>
    );
  }
  
  if (!rankings?.length) {
    return null;
  }
  
  return (
    <section className="pt-6 pb-4">
      {/* Header - refined typography */}
      <div className="flex items-center justify-between px-4 mb-4">
        <div className="space-y-0.5">
          <p className="text-[11px] font-medium text-slate-400/50 uppercase tracking-[0.5px]">
            Official World Golf Ranking
          </p>
          <h2 className="text-[22px] font-semibold text-slate-900" style={{ letterSpacing: '-0.02em' }}>
            World Rankings
          </h2>
        </div>
        <button 
          onClick={() => navigate('/tourhub?tab=players')}
          className="text-[15px] font-medium text-[#374151] flex items-center gap-0.5 opacity-60 hover:opacity-100 transition-opacity"
        >
          View All
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      
      {/* Horizontally Scrollable Table Container */}
      <div 
        className="relative"
        role="table"
        aria-label="Official World Golf Rankings, showing top 10"
      >
        {/* Scrollable Area */}
        <div 
          ref={scrollContainerRef}
          className="overflow-x-auto scrollbar-hide"
          style={{
            WebkitOverflowScrolling: 'touch',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}
        >
          <div className="min-w-[540px]">
            {/* Header Row */}
            <div className="flex items-center px-4 py-3 text-[11px] uppercase tracking-[0.3px] text-slate-400/60 font-semibold border-b border-black/[0.06]">
              {/* Fixed columns */}
              <div className="w-9 text-center flex-shrink-0">+/-</div>
              <div className="w-[170px] flex-shrink-0 pl-1">Player</div>
              {/* Scrollable columns */}
              <div className="w-[72px] text-right flex-shrink-0">Avg Pts</div>
              <div className="w-[80px] text-right flex-shrink-0">Total Pts</div>
              <div className="w-[56px] text-center flex-shrink-0">Events</div>
              <div className="w-[100px] text-right flex-shrink-0 pr-2">Week +/-</div>
            </div>
            
            {/* Player Rows */}
            <div>
              {currentPagePlayers.map((entry, index) => {
                const ariaLabel = `Rank ${entry.rank}: ${entry.player.first_name} ${entry.player.last_name}, ${formatCountryName(entry.player.country)}, ${entry.avg_points?.toFixed(2)} average points`;
                
                return (
                  <div 
                    key={entry.player.id}
                    className={cn(
                      "flex items-center px-4 py-3 cursor-pointer transition-colors duration-150",
                      "active:bg-black/[0.02]",
                      index % 2 === 1 && "bg-black/[0.015]"
                    )}
                    onClick={() => navigate(`/tourhub/player/${entry.player.id}`)}
                    role="row"
                    aria-label={ariaLabel}
                  >
                    {/* Movement */}
                    <div className={cn(
                      "w-9 text-center text-[13px] font-semibold flex-shrink-0",
                      entry.rank_change > 0 && "text-[#34C759]",
                      entry.rank_change < 0 && "text-[#FF3B30]",
                      entry.rank_change === 0 && "text-black/25"
                    )}>
                      {entry.rank_change > 0 && `↑${entry.rank_change}`}
                      {entry.rank_change < 0 && `↓${Math.abs(entry.rank_change)}`}
                      {entry.rank_change === 0 && '—'}
                    </div>

                    {/* Player Cell with Avatar + Rank Badge */}
                    <div className="w-[170px] flex items-center gap-2.5 flex-shrink-0 pl-1">
                      <div className="relative flex-shrink-0">
                        <div 
                          className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border-2 border-white shadow-[0_1px_4px_rgba(0,0,0,0.1)]"
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
                                  <span className="text-[11px] font-bold text-slate-400">{initials}</span>
                                </div>

                                {photoUrl && (
                                  <img
                                    src={photoUrl}
                                    alt={`${entry.player.first_name} ${entry.player.last_name}`}
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
                        
                        {/* Rank badge overlay */}
                        <RankBadge rank={entry.rank} />
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-[#1a1a1a] text-[15px] truncate max-w-[110px] leading-tight">
                          {entry.player.first_name} {entry.player.last_name}
                        </div>
                        <div className="text-[12px] text-black/50 flex items-center gap-1 mt-0.5">
                          <CountryFlag country={entry.player.country} size="sm" />
                          <span className="truncate">{formatCountryName(entry.player.country)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Avg Points - Blue highlight */}
                    <div className="w-[72px] text-right flex-shrink-0">
                      <span className="font-semibold text-[#007AFF] text-[14px]">
                        {entry.avg_points?.toFixed(2) ?? '—'}
                      </span>
                    </div>

                    {/* Total Points */}
                    <div className="w-[80px] text-right flex-shrink-0">
                      <span className="font-medium text-[#1a1a1a] text-[14px]">
                        {entry.total_points 
                          ? entry.total_points.toLocaleString(undefined, { maximumFractionDigits: 1 }) 
                          : '—'}
                      </span>
                    </div>

                    {/* Events */}
                    <div className="w-[56px] text-center flex-shrink-0">
                      <span className="font-medium text-slate-600 text-[14px]">
                        {entry.events_played ?? '—'}
                      </span>
                    </div>

                    {/* Week Points +/- with middle dot */}
                    <div className="w-[100px] text-right flex-shrink-0 pr-2">
                      <span className="text-[13px] whitespace-nowrap">
                        <span className="text-[#34C759] font-medium">
                          +{entry.points_gained?.toFixed(1) ?? '0'}
                        </span>
                        <span className="text-black/20 mx-1">·</span>
                        <span className="text-[#FF3B30] font-medium">
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
        
        {/* Fixed column edge fade (shows when scrolled) */}
        <div 
          className={cn(
            "absolute left-[220px] top-0 bottom-0 w-3 bg-gradient-to-r from-white to-transparent pointer-events-none transition-opacity duration-200",
            isScrolled ? "opacity-100" : "opacity-0"
          )}
        />
        
        {/* Right edge fade indicator */}
        <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-white to-transparent pointer-events-none" />
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
            
            {/* Page dots - active animates to pill */}
            <div className="flex items-center gap-1.5">
              {[...Array(Math.min(totalPages, 14))].map((_, i) => {
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
                        ? "w-5 bg-[#374151]" 
                        : "w-1.5 bg-slate-200 hover:bg-slate-300"
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
            {startIndex + 1}–{endIndex} of {totalPlayers}
          </p>
        </>
      )}
    </section>
  );
}
