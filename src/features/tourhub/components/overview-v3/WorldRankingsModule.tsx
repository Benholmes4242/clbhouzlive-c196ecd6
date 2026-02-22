/**
 * WorldRankingsModule - Redesigned OWGR data table
 * 
 * Features:
 * - Single-line header: "OFFICIAL WORLD GOLF RANKING" + "View All"
 * - Column order: +/- | Avatar with Badge | Player | AVG PTS | TOTAL PTS | EVENTS
 * - Removed: Separate # column, WEEK +/- column
 * - All ranks have badges on avatars (1-3: metallic, 4+: slate gray)
 * - 10 players per page with pagination
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorldRankingsFull } from '../../hooks/useOverviewModules';
import CountryFlag from '@/components/ui/country-flag';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';

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
      {/* Movement */}
      <div className="w-9 flex-shrink-0 flex justify-center">
        <div 
          className="h-4 w-6 rounded"
          style={{
            background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite linear',
          }}
        />
      </div>
      {/* Avatar - Squircle */}
      <div className="flex items-center gap-2 flex-1 min-w-0 pl-1">
        <div 
          className="w-11 flex-shrink-0"
          style={{
            aspectRatio: '1 / 1.05',
            borderRadius: '34%',
            background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite linear',
          }}
        />
        <div className="flex-1 min-w-0 space-y-1.5">
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
      <div className="flex gap-3">
        {[1, 2, 3].map(i => (
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

/** Rank badge component for avatar overlay */
function RankBadge({ rank }: { rank: number }) {
  const isTop3 = rank <= 3;
  
  const badgeStyles = {
    1: {
      background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
      color: 'white',
    },
    2: {
      background: 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)',
      color: '#374151',
    },
    3: {
      background: 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)',
      color: 'white',
    },
  };
  
  const defaultStyle = {
    background: '#475569',
    color: 'white',
  };
  
  const style = isTop3 ? badgeStyles[rank as 1 | 2 | 3] : defaultStyle;
  
  return (
    <div 
      className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold"
      style={{
        ...style,
        border: '2px solid white',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15)',
      }}
    >
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
          <h2 className="text-[13px] font-semibold text-slate-900 uppercase tracking-[0.5px]">
            Official World Golf Ranking
          </h2>
        </div>
        <div className="px-0">
          {/* Header Row */}
          <div className="flex items-center px-4 py-3 text-[11px] uppercase tracking-[0.3px] text-slate-400/60 font-semibold border-b border-slate-200/60 bg-slate-50/50">
            <div className="w-9 text-center flex-shrink-0">+/-</div>
            <div className="flex-1 pl-1">Player</div>
            <div className="w-[60px] text-center flex-shrink-0">Avg Pts</div>
            <div className="w-[70px] text-center flex-shrink-0">Total Pts</div>
            <div className="w-[50px] text-center flex-shrink-0">Events</div>
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
      {/* Header - Single line with uppercase title */}
      <div className="flex items-center justify-between px-4 mb-4">
        <h2 className="text-[13px] font-semibold text-slate-900 uppercase tracking-[0.5px]">
          Official World Golf Ranking
        </h2>
        <button 
          onClick={() => navigate('/tourhub?tab=players')}
          className="text-[14px] font-medium flex items-center gap-1 transition-colors"
          style={{ color: 'rgba(0, 0, 0, 0.4)' }}
        >
          View All
          <ChevronRight className="w-3 h-3 opacity-60" />
        </button>
      </div>
      
      {/* Scrollable Table Container */}
      <div className="relative">
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
          <div className="min-w-[420px]">
            {/* Header Row - New column order */}
            <div 
              className="flex items-center px-4 py-3 text-[11px] uppercase tracking-[0.3px] text-slate-400/60 font-semibold border-b border-slate-200/60 bg-slate-50/50"
              role="row"
            >
              <div className="w-9 text-center flex-shrink-0" role="columnheader">+/-</div>
              <div className="flex-1 pl-1" role="columnheader">Player</div>
              <div className="w-[60px] text-center flex-shrink-0" role="columnheader">Avg Pts</div>
              <div className="w-[70px] text-center flex-shrink-0" role="columnheader">Total Pts</div>
              <div className="w-[50px] text-center flex-shrink-0" role="columnheader">Events</div>
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
                    aria-label={`Rank ${entry.rank}: ${fullName}, ${entry.rank_change > 0 ? `up ${entry.rank_change}` : entry.rank_change < 0 ? `down ${Math.abs(entry.rank_change)}` : 'unchanged'}, ${entry.avg_points?.toFixed(2) ?? '—'} average points`}
                    style={{ height: '64px' }}
                  >
                    {/* Column 1: Movement (+/-) */}
                    <div className={cn(
                      "w-9 text-center text-[13px] font-semibold flex-shrink-0",
                      entry.rank_change > 0 && "text-emerald-600",
                      entry.rank_change < 0 && "text-red-500",
                      entry.rank_change === 0 && "text-slate-300"
                    )} role="cell">
                      {entry.rank_change > 0 && <><span style={{ fontSize: '10px' }}>▲</span>{entry.rank_change}</>}
                      {entry.rank_change < 0 && <><span style={{ fontSize: '10px' }}>▼</span>{Math.abs(entry.rank_change)}</>}
                      {entry.rank_change === 0 && '—'}
                    </div>

                    {/* Column 2: Avatar with Rank Badge + Player Info - Squircle */}
                    <div className="flex items-center gap-2.5 flex-1 min-w-0 pl-1 pr-2" role="cell">
                      <div className="relative flex-shrink-0">
                        <div 
                          className="w-11 overflow-hidden bg-slate-100"
                          style={{ 
                            aspectRatio: '1 / 1.05',
                            borderRadius: '34%',
                            border: '2px solid white',
                            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
                          }}
                        >
                          {(() => {
                            const initials = `${entry.player.first_name?.[0] ?? ''}${entry.player.last_name?.[0] ?? ''}`
                              .toUpperCase() || '?';

                            const photoUrl = getPlayerHeadshotUrl(fullName, entry.player.tour_codes?.[0] ?? 'pga');

                            return (
                              <div className="relative w-full h-full">
                                <div className="absolute inset-0 bg-slate-200" />

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
                        
                        {/* Rank badge for ALL ranks */}
                        <RankBadge rank={entry.rank} />
                      </div>
                      
                      {/* Player name and country */}
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

                    {/* Column 3: Avg Points (Blue highlight) */}
                    <div className="w-[60px] text-center flex-shrink-0" role="cell">
                      <span className="font-semibold text-blue-600 text-[14px]">
                        {entry.avg_points?.toFixed(2) ?? '—'}
                      </span>
                    </div>

                    {/* Column 4: Total Points */}
                    <div className="w-[70px] text-center flex-shrink-0" role="cell">
                      <span className="font-medium text-slate-700 text-[14px]">
                        {entry.total_points 
                          ? entry.total_points.toLocaleString(undefined, { maximumFractionDigits: 1 }) 
                          : '—'}
                      </span>
                    </div>

                    {/* Column 5: Events */}
                    <div className="w-[50px] text-center flex-shrink-0" role="cell">
                      <span className="font-medium text-slate-600 text-[14px]">
                        {entry.events_played ?? '—'}
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
      </div>
      
      {/* Pagination Footer */}
      {totalPages > 1 && (
        <>
          <div className="flex items-center justify-center gap-4 py-3 mt-2">
            <button 
              onClick={goToPrevPage}
              disabled={currentPage === 0}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150",
                currentPage === 0 
                  ? "text-slate-200 cursor-not-allowed" 
                  : "text-slate-500 bg-slate-50 hover:bg-slate-100 hover:text-slate-700 active:bg-slate-200 active:scale-95"
              )}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            {/* Page dots with animated pill for active */}
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
                        ? "w-5 bg-slate-700" 
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
                "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150",
                currentPage === totalPages - 1 
                  ? "text-slate-200 cursor-not-allowed" 
                  : "text-slate-500 bg-slate-50 hover:bg-slate-100 hover:text-slate-700 active:bg-slate-200 active:scale-95"
              )}
              aria-label="Next page"
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
