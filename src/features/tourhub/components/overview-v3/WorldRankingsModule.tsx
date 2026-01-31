/**
 * WorldRankingsModule - Full OWGR browsable list with pagination
 * Enhanced to show all available OWGR data: rank, movement, avg points, total points, events
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useWorldRankingsFull, type WorldRankingEntry } from '../../hooks/useOverviewModules';
import CountryFlag from '@/components/ui/country-flag';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
            <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
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
      
      {/* Column Headers */}
      <div className="flex items-center gap-2 px-4 py-2 text-[10px] uppercase tracking-wide text-slate-400 font-medium border-b border-slate-200 bg-slate-50/50 mx-4 rounded-t-lg">
        <div className="w-7 text-center">#</div>
        <div className="w-10 text-center">+/-</div>
        <div className="w-9" /> {/* Photo spacer */}
        <div className="flex-1 min-w-0">Player</div>
        <div className="w-14 text-right">Avg</div>
        <div className="w-16 text-right hidden sm:block">Total</div>
        <div className="w-10 text-right hidden sm:block">Evts</div>
        <div className="w-4" /> {/* Chevron spacer */}
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
              <div className="divide-y divide-slate-100">
                {rankings
                  .slice(pageIndex * PLAYERS_PER_PAGE, (pageIndex + 1) * PLAYERS_PER_PAGE)
                  .map((entry) => (
                    <PlayerRow 
                      key={entry.rank} 
                      entry={entry} 
                      onClick={() => navigate(`/tourhub/player/${entry.player.id}`)}
                    />
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

/**
 * Individual player row with tooltip for weekly points details
 */
interface PlayerRowProps {
  entry: WorldRankingEntry;
  onClick: () => void;
}

function PlayerRow({ entry, onClick }: PlayerRowProps) {
  const hasWeeklyStats = entry.points_gained !== null || entry.points_lost !== null;
  
  const rowContent = (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 py-3 px-3 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
    >
      {/* Rank */}
      <div className="w-7 text-center">
        <span className={cn(
          "text-sm font-bold",
          entry.rank === 1 ? "text-amber-500" :
          entry.rank === 2 ? "text-slate-400" :
          entry.rank === 3 ? "text-amber-600" :
          "text-slate-600"
        )}>
          {entry.rank}
        </span>
        {entry.tied && <span className="text-[9px] text-slate-400 ml-0.5">T</span>}
      </div>
      
      {/* Movement */}
      <div className={cn(
        "w-10 text-xs font-medium text-center flex items-center justify-center",
        entry.rank_change > 0 && "text-emerald-600",
        entry.rank_change < 0 && "text-red-500",
        entry.rank_change === 0 && "text-slate-300"
      )}>
        {entry.rank_change > 0 && (
          <span className="inline-flex items-center gap-0.5">
            <ChevronUp className="w-3 h-3" />
            {entry.rank_change}
          </span>
        )}
        {entry.rank_change < 0 && (
          <span className="inline-flex items-center gap-0.5">
            <ChevronDown className="w-3 h-3" />
            {Math.abs(entry.rank_change)}
          </span>
        )}
        {entry.rank_change === 0 && '—'}
      </div>
      
      {/* Photo with gold ring for #1 */}
      <div className="relative">
        <div className={cn(
          "w-9 h-9 rounded-full overflow-hidden bg-slate-100 flex-shrink-0",
          entry.rank === 1 && "ring-2 ring-amber-400 ring-offset-1"
        )}>
          {entry.player.photo_url ? (
            <img 
              src={entry.player.photo_url}
              alt={`${entry.player.first_name} ${entry.player.last_name}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-200">
              <span className="text-[10px] font-bold text-slate-400">
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
            entry.rank === 3 && "bg-amber-600 text-amber-100"
          )}>
            {entry.rank}
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
          <span className="text-[11px] text-slate-400 truncate">
            {formatCountryName(entry.player.country)}
          </span>
        </div>
      </div>
      
      {/* Avg Points - Primary stat (blue) */}
      <div className="w-14 text-right">
        <p className="text-sm font-semibold text-blue-600">
          {entry.avg_points?.toFixed(2) ?? '—'}
        </p>
        <p className="text-[9px] text-slate-400 uppercase">Avg</p>
      </div>
      
      {/* Total Points - Hidden on mobile */}
      <div className="w-16 text-right hidden sm:block">
        <p className="text-sm font-medium text-slate-700">
          {entry.total_points 
            ? entry.total_points.toLocaleString(undefined, { maximumFractionDigits: 1 })
            : '—'}
        </p>
        <p className="text-[9px] text-slate-400 uppercase">Total</p>
      </div>
      
      {/* Events Played - Hidden on mobile */}
      <div className="w-10 text-right hidden sm:block">
        <p className="text-sm font-medium text-slate-600">
          {entry.events_played ?? '—'}
        </p>
        <p className="text-[9px] text-slate-400 uppercase">Evts</p>
      </div>
      
      {/* Chevron */}
      <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
    </button>
  );
  
  // Wrap with tooltip if we have weekly stats
  if (hasWeeklyStats) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            {rowContent}
          </TooltipTrigger>
          <TooltipContent side="left" className="text-xs">
            <div className="space-y-1">
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">This week:</span>
                <span>
                  <span className="text-emerald-500">+{entry.points_gained?.toFixed(2) ?? '0'}</span>
                  {' / '}
                  <span className="text-red-400">-{entry.points_lost?.toFixed(2) ?? '0'}</span>
                </span>
              </div>
              {entry.prior_rank && (
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Prior rank:</span>
                  <span>#{entry.prior_rank}</span>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return rowContent;
}