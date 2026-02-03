/**
 * WorldRankingsModule - Redesigned OWGR Rankings Table
 * 
 * Features:
 * - Clean header with "OFFICIAL WORLD GOLF RANKING" title
 * - Reordered columns: +/- | Avatar with Badge | Player | AVG PTS | TOTAL PTS | EVENTS
 * - Avatar overlays with rank badges (Gold/Silver/Bronze for top 3, Slate for 4+)
 * - Pagination with 10 players per page
 * - Removed # rank column and WEEK +/- column
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorldRankingsFull } from '../../hooks/useOverviewModules';
import CountryFlag from '@/components/ui/country-flag';
import { getPgaTourHeadshotUrl } from '../../utils/resolvePhotoUrl';

const PLAYERS_PER_PAGE = 10;
const SLATE_COLOR = '#374151';

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

/** Skeleton row for loading state with shimmer */
function SkeletonRow({ index }: { index: number }) {
  return (
    <div 
      className="flex items-center px-4 py-3"
      style={{ 
        borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
        backgroundColor: index % 2 === 1 ? 'rgba(0, 0, 0, 0.015)' : 'transparent',
      }}
    >
      {/* Movement skeleton */}
      <div className="w-10 flex-shrink-0 flex justify-center">
        <div 
          className="w-6 h-4 rounded"
          style={{ 
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: `tourhubShimmer 1.5s infinite`,
            animationDelay: `${index * 0.05}s`,
          }}
        />
      </div>
      {/* Avatar skeleton */}
      <div className="flex items-center gap-2.5 min-w-[180px] flex-shrink-0">
        <div 
          className="w-11 h-11 rounded-full flex-shrink-0"
          style={{ 
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: `tourhubShimmer 1.5s infinite`,
            animationDelay: `${index * 0.05 + 0.02}s`,
          }}
        />
        <div className="space-y-1.5">
          <div 
            className="w-24 h-4 rounded"
            style={{ 
              background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
              backgroundSize: '200% 100%',
              animation: `tourhubShimmer 1.5s infinite`,
              animationDelay: `${index * 0.05 + 0.04}s`,
            }}
          />
          <div 
            className="w-16 h-3 rounded"
            style={{ 
              background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
              backgroundSize: '200% 100%',
              animation: `tourhubShimmer 1.5s infinite`,
              animationDelay: `${index * 0.05 + 0.06}s`,
            }}
          />
        </div>
      </div>
      {/* Stats skeleton */}
      <div className="flex-1 flex justify-end gap-4 pr-2">
        {[70, 80, 50].map((w, i) => (
          <div 
            key={i}
            className="h-4 rounded"
            style={{ 
              width: `${w}px`,
              background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
              backgroundSize: '200% 100%',
              animation: `tourhubShimmer 1.5s infinite`,
              animationDelay: `${index * 0.05 + 0.08 + i * 0.02}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/** Rank badge overlay on avatar */
function RankBadge({ rank }: { rank: number }) {
  // Top 3 get metallic gradient badges
  const badgeStyles: Record<number, { background: string }> = {
    1: { background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' },
    2: { background: 'linear-gradient(135deg, #E8E8E8 0%, #A8A8A8 100%)' },
    3: { background: 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)' },
  };
  
  const style = badgeStyles[rank] || { background: '#475569' }; // Slate for 4+
  
  return (
    <div 
      className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold text-white z-10"
      style={{ 
        ...style,
        border: '2px solid white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }}
    >
      {rank}
    </div>
  );
}

export function WorldRankingsModule() {
  const navigate = useNavigate();
  const { data: rankings, isLoading } = useWorldRankingsFull();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(0);
  
  // Calculate pagination
  const totalPlayers = rankings?.length || 0;
  const totalPages = Math.ceil(totalPlayers / PLAYERS_PER_PAGE);
  const startIndex = currentPage * PLAYERS_PER_PAGE;
  const endIndex = Math.min(startIndex + PLAYERS_PER_PAGE, totalPlayers);
  const displayPlayers = rankings?.slice(startIndex, endIndex) || [];
  
  const canGoPrev = currentPage > 0;
  const canGoNext = currentPage < totalPages - 1;
  
  const goToPrev = () => {
    if (canGoPrev) setCurrentPage(prev => prev - 1);
  };
  
  const goToNext = () => {
    if (canGoNext) setCurrentPage(prev => prev + 1);
  };
  
  if (isLoading) {
    return (
      <section className="pt-6 pb-6 border-t border-slate-100">
        <div className="flex items-center justify-between px-4 mb-4">
          <h2 
            className="text-[13px] font-semibold tracking-[0.5px] uppercase"
            style={{ color: '#1a1a1a' }}
          >
            Official World Golf Ranking
          </h2>
          <div 
            className="h-4 w-16 rounded"
            style={{ 
              background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
              backgroundSize: '200% 100%',
              animation: 'tourhubShimmer 1.5s infinite',
            }}
          />
        </div>
        <div>
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
    <section className="pt-6 pb-6 border-t border-slate-100">
      {/* Header - Single line with title and View All */}
      <div className="flex items-center justify-between px-4 mb-4">
        <h2 
          className="text-[13px] font-semibold tracking-[0.5px] uppercase"
          style={{ color: '#1a1a1a' }}
        >
          Official World Golf Ranking
        </h2>
        <button 
          onClick={() => navigate('/tourhub?tab=players')}
          className="flex items-center gap-1 text-[14px] font-medium transition-colors"
          style={{ color: 'rgba(0, 0, 0, 0.4)' }}
        >
          View All
          <ChevronRight className="w-3 h-3 opacity-60" />
        </button>
      </div>
      
      {/* Table Container */}
      <div 
        className="relative"
        role="table"
        aria-label="Official World Golf Rankings"
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
          <div className="min-w-[480px]">
            {/* Header Row */}
            <div 
              className="flex items-center px-4 py-3"
              style={{ 
                borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                backgroundColor: 'rgba(248, 250, 252, 0.8)',
              }}
              role="row"
            >
              {/* Movement header */}
              <div 
                className="w-10 text-center flex-shrink-0 text-[11px] font-semibold uppercase"
                style={{ color: 'rgba(0, 0, 0, 0.4)', letterSpacing: '0.3px' }}
              >
                +/-
              </div>
              {/* Player header - includes avatar space */}
              <div 
                className="min-w-[180px] flex-shrink-0 text-[11px] font-semibold uppercase"
                style={{ color: 'rgba(0, 0, 0, 0.4)', letterSpacing: '0.3px', paddingLeft: '56px' }}
              >
                Player
              </div>
              {/* Stats headers - centered */}
              <div 
                className="w-[70px] text-center flex-shrink-0 text-[11px] font-semibold uppercase"
                style={{ color: 'rgba(0, 0, 0, 0.4)', letterSpacing: '0.3px' }}
              >
                Avg Pts
              </div>
              <div 
                className="w-[80px] text-center flex-shrink-0 text-[11px] font-semibold uppercase"
                style={{ color: 'rgba(0, 0, 0, 0.4)', letterSpacing: '0.3px' }}
              >
                Total Pts
              </div>
              <div 
                className="w-[60px] text-center flex-shrink-0 text-[11px] font-semibold uppercase"
                style={{ color: 'rgba(0, 0, 0, 0.4)', letterSpacing: '0.3px' }}
              >
                Events
              </div>
            </div>
            
            {/* Player Rows */}
            <div>
              {displayPlayers.map((entry, idx) => {
                const fullName = `${entry.player.first_name} ${entry.player.last_name}`;
                const displayName = fullName.length > 15 
                  ? `${fullName.slice(0, 15)}…` 
                  : fullName;
                
                return (
                  <div 
                    key={entry.player.id}
                    role="row"
                    aria-label={`Rank ${entry.rank}: ${fullName}, ${entry.player.country}, ${entry.avg_points?.toFixed(2) || 0} average points`}
                    className="flex items-center px-4 py-3 cursor-pointer transition-colors duration-150 active:bg-slate-50"
                    style={{ 
                      borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
                      backgroundColor: idx % 2 === 1 ? 'rgba(0, 0, 0, 0.015)' : 'transparent',
                    }}
                    onClick={() => navigate(`/tourhub/player/${entry.player.id}`)}
                  >
                    {/* Movement - First column */}
                    <div className="w-10 text-center flex-shrink-0">
                      <span 
                        className="text-[13px] font-semibold flex items-center justify-center"
                        style={{ 
                          color: entry.rank_change > 0 ? '#34C759' 
                            : entry.rank_change < 0 ? '#FF3B30' 
                            : 'rgba(0, 0, 0, 0.2)',
                        }}
                      >
                        {entry.rank_change > 0 && `↑${entry.rank_change}`}
                        {entry.rank_change < 0 && `↓${Math.abs(entry.rank_change)}`}
                        {entry.rank_change === 0 && <span className="text-[16px]">—</span>}
                      </span>
                    </div>

                    {/* Player Cell with Avatar + Rank Badge */}
                    <div className="min-w-[180px] flex items-center gap-2.5 flex-shrink-0 pr-3">
                      <div className="relative flex-shrink-0">
                        <div 
                          className="w-11 h-11 rounded-full overflow-hidden bg-slate-100"
                          style={{
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
                                  <span className="text-[11px] font-bold text-slate-400">{initials}</span>
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
                        {/* Rank Badge overlay */}
                        <RankBadge rank={entry.rank} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div 
                          className="text-[15px] font-semibold text-slate-900 truncate leading-tight"
                          style={{ maxWidth: '120px' }}
                        >
                          {displayName}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <CountryFlag country={entry.player.country} size="sm" className="w-3.5 h-2.5 rounded-sm" />
                          <span className="text-[12px] truncate" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>
                            {formatCountryName(entry.player.country)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Avg Points - Blue highlight, centered */}
                    <div className="w-[70px] text-center flex-shrink-0">
                      <span className="text-[14px] font-semibold" style={{ color: '#007AFF' }}>
                        {entry.avg_points?.toFixed(2) ?? '—'}
                      </span>
                    </div>

                    {/* Total Points - centered */}
                    <div className="w-[80px] text-center flex-shrink-0">
                      <span className="text-[14px] font-medium text-slate-900">
                        {entry.total_points 
                          ? entry.total_points.toLocaleString(undefined, { maximumFractionDigits: 1 }) 
                          : '—'}
                      </span>
                    </div>

                    {/* Events - centered */}
                    <div className="w-[60px] text-center flex-shrink-0">
                      <span className="text-[14px] font-medium text-slate-600">
                        {entry.events_played ?? '—'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center mt-4 gap-2">
          <div className="flex items-center justify-center gap-4">
            {/* Previous button */}
            <button
              onClick={goToPrev}
              disabled={!canGoPrev}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150",
                !canGoPrev
                  ? "opacity-30 cursor-not-allowed"
                  : "hover:bg-slate-100 active:bg-slate-200 active:scale-95"
              )}
              style={{ background: 'rgba(0, 0, 0, 0.04)' }}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" style={{ color: SLATE_COLOR }} />
            </button>
            
            {/* Pagination dots */}
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
                    className="rounded-full transition-all duration-200 ease-out"
                    style={{
                      width: isActive ? '20px' : '6px',
                      height: '6px',
                      backgroundColor: isActive ? SLATE_COLOR : 'rgba(0, 0, 0, 0.15)',
                    }}
                    aria-label={`Go to page ${dotIndex + 1}`}
                  />
                );
              })}
            </div>
            
            {/* Next button */}
            <button
              onClick={goToNext}
              disabled={!canGoNext}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150",
                !canGoNext
                  ? "opacity-30 cursor-not-allowed"
                  : "hover:bg-slate-100 active:bg-slate-200 active:scale-95"
              )}
              style={{ background: 'rgba(0, 0, 0, 0.04)' }}
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" style={{ color: SLATE_COLOR }} />
            </button>
          </div>
          
          {/* Page counter */}
          <p className="text-[13px]" style={{ color: 'rgba(0, 0, 0, 0.4)' }}>
            {startIndex + 1}–{endIndex} of {totalPlayers}
          </p>
        </div>
      )}
      
      {/* Shimmer keyframes */}
      <style>{`
        @keyframes rankingsShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </section>
  );
}
