/**
 * WorldRankings - Editorial Table Layout
 * 
 * Design: Flat table with sticky headers, no card wrapper
 * Per redesign brief: Data-dense, horizontally scrollable
 */

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorldRankingsFull } from '../../hooks/useOverviewModules';
import CountryFlag from '@/components/ui/country-flag';
import { getPgaTourHeadshotUrl } from '../../utils/resolvePhotoUrl';

const PLAYERS_PER_PAGE = 15;

/** Format country name */
function formatCountryName(country: string | null): string {
  if (!country) return '';
  return country
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Loading skeleton */
const WorldRankingsSkeleton = () => (
  <section className="py-8">
    <div className="px-4 mb-4">
      <div className="h-6 w-40 bg-slate-100 rounded animate-pulse mb-1" />
      <div className="h-4 w-56 bg-slate-100 rounded animate-pulse" />
    </div>
    <div className="px-4 space-y-0">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="h-12 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-4 bg-slate-100 rounded animate-pulse" />
          <div className="w-8 h-4 bg-slate-100 rounded animate-pulse" />
          <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse" />
          <div className="flex-1 h-4 bg-slate-100 rounded animate-pulse" />
        </div>
      ))}
    </div>
  </section>
);

export function WorldRankings() {
  const navigate = useNavigate();
  const { data: rankings, isLoading } = useWorldRankingsFull();
  const [currentPage, setCurrentPage] = useState(0);
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
  
  if (isLoading) {
    return <WorldRankingsSkeleton />;
  }
  
  if (!rankings?.length) {
    return null;
  }
  
  return (
    <section className="py-8">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">World Rankings</h2>
          <p className="text-[13px] text-slate-500 mt-0.5">Official World Golf Ranking</p>
        </div>
        <button 
          onClick={() => navigate('/tourhub?tab=players')}
          className="text-sm font-semibold text-slate-600 flex items-center gap-1 hover:text-slate-900 transition-colors"
        >
          View All
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      {/* Horizontally Scrollable Table */}
      <div className="relative">
        <div 
          ref={scrollContainerRef}
          className="overflow-x-auto scrollbar-hide"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="min-w-[580px]">
            {/* Header Row - Sticky with blur */}
            <div className="flex items-center px-4 py-2 text-[11px] uppercase tracking-wide text-slate-400 font-semibold border-b border-slate-200 bg-slate-50/90 backdrop-blur-sm sticky top-0 z-10">
              <div className="w-9 text-center flex-shrink-0">Rank</div>
              <div className="w-11 text-center flex-shrink-0">+/-</div>
              <div className="w-[160px] flex-shrink-0 pl-1">Player</div>
              <div className="w-[65px] text-right flex-shrink-0">Avg Pts</div>
              <div className="w-[75px] text-right flex-shrink-0">Total</div>
              <div className="w-[55px] text-right flex-shrink-0">Events</div>
              <div className="w-[90px] text-right flex-shrink-0 pr-2">Week +/-</div>
            </div>
            
            {/* Player Rows */}
            <div className="divide-y divide-slate-100">
              {currentPagePlayers.map((entry) => {
                const isTop10 = entry.rank <= 10;
                const initials = `${entry.player.first_name?.[0] ?? ''}${entry.player.last_name?.[0] ?? ''}`.toUpperCase() || '?';
                const photoUrl = entry.player.pga_tour_id ? getPgaTourHeadshotUrl(entry.player.pga_tour_id) : null;
                
                return (
                  <div 
                    key={entry.player.id}
                    className="flex items-center px-4 py-2.5 hover:bg-slate-50 active:bg-slate-100 cursor-pointer transition-colors"
                    onClick={() => navigate(`/tourhub/player/${entry.player.id}`)}
                  >
                    {/* Rank */}
                    <div className="w-9 text-center flex-shrink-0">
                      <span className={cn(
                        "font-bold text-sm font-mono",
                        entry.rank === 1 && "text-amber-500",
                        entry.rank === 2 && "text-slate-400", 
                        entry.rank === 3 && "text-amber-600",
                        entry.rank > 3 && "text-slate-600"
                      )}>
                        {entry.rank}
                      </span>
                    </div>

                    {/* Movement */}
                    <div className={cn(
                      "w-11 text-center text-xs font-medium flex-shrink-0 font-mono",
                      entry.rank_change > 0 && "text-emerald-600",
                      entry.rank_change < 0 && "text-red-500",
                      entry.rank_change === 0 && "text-slate-300"
                    )}>
                      {entry.rank_change > 0 && `↑${entry.rank_change}`}
                      {entry.rank_change < 0 && `↓${Math.abs(entry.rank_change)}`}
                      {entry.rank_change === 0 && '—'}
                    </div>

                    {/* Player - Avatar optional for top 10 only per brief */}
                    <div className="w-[160px] flex items-center gap-2 flex-shrink-0 pl-1">
                      {isTop10 && (
                        <div className="relative flex-shrink-0">
                          <div 
                            className={cn(
                              "w-8 overflow-hidden bg-slate-100",
                              entry.rank === 1 && "ring-2 ring-amber-400 ring-offset-1"
                            )}
                            style={{ borderRadius: '34%', aspectRatio: '1 / 1.05' }}
                          >
                            <div className="relative w-full h-full">
                              <div className="absolute inset-0 flex items-center justify-center bg-slate-200">
                                <span className="text-[9px] font-bold text-slate-400">{initials}</span>
                              </div>
                              {photoUrl && (
                                <img
                                  src={photoUrl}
                                  alt={`${entry.player.first_name} ${entry.player.last_name}`}
                                  className="relative z-10 w-full h-full object-cover"
                                  loading="lazy"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-slate-900 text-sm truncate leading-tight">
                          {entry.player.first_name} {entry.player.last_name}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <CountryFlag country={entry.player.country} size="sm" />
                          <span className="truncate">{formatCountryName(entry.player.country)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Avg Points */}
                    <div className="w-[65px] text-right flex-shrink-0">
                      <span className="font-semibold text-slate-700 text-sm font-mono">
                        {entry.avg_points?.toFixed(2) ?? '—'}
                      </span>
                    </div>

                    {/* Total Points */}
                    <div className="w-[75px] text-right flex-shrink-0">
                      <span className="font-medium text-slate-600 text-sm font-mono">
                        {entry.total_points 
                          ? entry.total_points.toLocaleString(undefined, { maximumFractionDigits: 1 }) 
                          : '—'}
                      </span>
                    </div>

                    {/* Events */}
                    <div className="w-[55px] text-right flex-shrink-0">
                      <span className="font-medium text-slate-600 text-sm font-mono">
                        {entry.events_played ?? '—'}
                      </span>
                    </div>

                    {/* Week +/- */}
                    <div className="w-[90px] text-right flex-shrink-0 pr-2">
                      <span className="text-xs whitespace-nowrap font-mono">
                        <span className="text-emerald-600 font-medium">
                          +{entry.points_gained?.toFixed(1) ?? '0'}
                        </span>
                        <span className="text-slate-300 mx-1">/</span>
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
        
        {/* Right edge fade */}
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white to-transparent pointer-events-none" />
      </div>
      
      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 py-3 mt-2">
          <button 
            onClick={goToPrevPage}
            disabled={currentPage === 0}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
              currentPage === 0 
                ? "text-slate-200 cursor-not-allowed" 
                : "text-slate-500 hover:bg-slate-100"
            )}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          {/* Page dots */}
          <div className="flex items-center gap-1.5">
            {[...Array(Math.min(totalPages, 10))].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={cn(
                  "rounded-full transition-all",
                  i === currentPage 
                    ? "w-6 h-2 bg-slate-800" 
                    : "w-2 h-2 bg-slate-200 hover:bg-slate-300"
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
                : "text-slate-500 hover:bg-slate-100"
            )}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
      
      {/* Page count */}
      <p className="text-center text-xs text-slate-400">
        {startIndex + 1}–{endIndex} of {totalPlayers}
      </p>
      
      {/* Bottom divider */}
      <div className="h-px bg-slate-100 mt-4" />
    </section>
  );
}

export default WorldRankings;
