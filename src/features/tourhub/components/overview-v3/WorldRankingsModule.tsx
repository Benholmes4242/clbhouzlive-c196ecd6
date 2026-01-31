/**
 * WorldRankingsModule - Horizontally scrollable OWGR data table
 * - Sticky left columns: Rank, Movement, Player
 * - Scrollable right columns: Avg Pts, Total Pts, Events, Week +/-
 * - Pagination via bottom arrows only (no swipe to change pages)
 */

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorldRankingsFull } from '../../hooks/useOverviewModules';
import CountryFlag from '@/components/ui/country-flag';
import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';

const PLAYERS_PER_PAGE = 15;

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

export function WorldRankingsModule() {
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
      <div className="flex items-center justify-between px-4 mb-3">
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
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
        >
          <div className="min-w-[580px]">
            {/* Header Row */}
            <div className="flex items-center px-4 py-2 text-[10px] uppercase tracking-wide text-slate-400 font-medium border-b border-slate-200 bg-slate-50/80">
              {/* Sticky columns */}
              <div className="w-9 text-center flex-shrink-0">#</div>
              <div className="w-11 text-center flex-shrink-0">+/-</div>
              <div className="w-[160px] flex-shrink-0 pl-1">Player</div>
              {/* Scrollable columns */}
              <div className="w-[65px] text-right flex-shrink-0">Avg Pts</div>
              <div className="w-[75px] text-right flex-shrink-0">Total Pts</div>
              <div className="w-[55px] text-right flex-shrink-0">Events</div>
              <div className="w-[90px] text-right flex-shrink-0 pr-2">Week +/-</div>
            </div>
            
            {/* Player Rows */}
            <div className="divide-y divide-slate-100">
              {currentPagePlayers.map((entry) => (
                (() => {
                  const photoUrl = resolvePhotoUrl(entry.player.photo_url);
                  const fullName = `${entry.player.first_name} ${entry.player.last_name}`.trim();

                  return (
                <div 
                  key={entry.player.id}
                  className="flex items-center px-4 py-2.5 hover:bg-slate-50 active:bg-slate-100 cursor-pointer transition-colors"
                  onClick={() => navigate(`/tourhub/player/${entry.player.id}`)}
                >
                  {/* Sticky: Rank */}
                  <div className="w-9 text-center flex-shrink-0">
                    <span className={cn(
                      "font-bold text-sm",
                      entry.rank === 1 && "text-amber-500",
                      entry.rank === 2 && "text-slate-400", 
                      entry.rank === 3 && "text-amber-600",
                      entry.rank > 3 && "text-slate-600"
                    )}>
                      {entry.rank}
                    </span>
                    {entry.tied && <span className="text-[8px] text-slate-400 ml-0.5">T</span>}
                  </div>

                  {/* Sticky: Movement */}
                  <div className={cn(
                    "w-11 text-center text-xs font-medium flex-shrink-0",
                    entry.rank_change > 0 && "text-emerald-600",
                    entry.rank_change < 0 && "text-red-500",
                    entry.rank_change === 0 && "text-slate-300"
                  )}>
                    {entry.rank_change > 0 && `↑${entry.rank_change}`}
                    {entry.rank_change < 0 && `↓${Math.abs(entry.rank_change)}`}
                    {entry.rank_change === 0 && '—'}
                  </div>

                  {/* Sticky: Player */}
                  <div className="w-[160px] flex items-center gap-2 flex-shrink-0 pl-1">
                    <div className="relative flex-shrink-0">
                      <div className={cn(
                        "w-8 h-8 rounded-full overflow-hidden bg-slate-100",
                        entry.rank === 1 && "ring-2 ring-amber-400 ring-offset-1"
                      )}>
                        {photoUrl ? (
                          <img 
                            src={photoUrl}
                            alt={fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-200">
                            <span className="text-[9px] font-bold text-slate-400">
                              {entry.player.first_name?.[0]}{entry.player.last_name?.[0]}
                            </span>
                          </div>
                        )}
                      </div>
                      {/* Medal badge for top 3 */}
                      {entry.rank <= 3 && (
                        <div className={cn(
                          "absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold",
                          entry.rank === 1 && "bg-amber-400 text-amber-900",
                          entry.rank === 2 && "bg-slate-300 text-slate-700",
                          entry.rank === 3 && "bg-amber-600 text-white"
                        )}>
                          {entry.rank}
                        </div>
                      )}
                    </div>
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

                  {/* Scrollable: Avg Points */}
                  <div className="w-[65px] text-right flex-shrink-0">
                    <span className="font-semibold text-blue-600 text-sm">
                      {entry.avg_points?.toFixed(2) ?? '—'}
                    </span>
                  </div>

                  {/* Scrollable: Total Points */}
                  <div className="w-[75px] text-right flex-shrink-0">
                    <span className="font-medium text-slate-700 text-sm">
                      {entry.total_points 
                        ? entry.total_points.toLocaleString(undefined, { maximumFractionDigits: 1 }) 
                        : '—'}
                    </span>
                  </div>

                  {/* Scrollable: Events */}
                  <div className="w-[55px] text-right flex-shrink-0">
                    <span className="font-medium text-slate-600 text-sm">
                      {entry.events_played ?? '—'}
                    </span>
                  </div>

                  {/* Scrollable: Week Points +/- */}
                  <div className="w-[90px] text-right flex-shrink-0 pr-2">
                    <span className="text-xs whitespace-nowrap">
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
                })()
              ))}
            </div>
          </div>
        </div>
        
        {/* Right edge fade indicator */}
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white to-transparent pointer-events-none" />
        
        {/* Scroll hint - only show on first page */}
        {currentPage === 0 && (
          <div className="text-center text-[10px] text-slate-400 mt-2 flex items-center justify-center gap-1">
            <span>←</span>
            <span>Scroll for more stats</span>
            <span>→</span>
          </div>
        )}
      </div>
      
      {/* Pagination Footer */}
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
        
        {/* Page dots */}
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
        {startIndex + 1}–{endIndex} of {totalPlayers}
      </p>
    </section>
  );
}