/**
 * UnifiedWorldRankings - Combined OWGR Table + Movers Spotlight
 * 
 * Merges the previously separate "Movers This Week" and "Official World Golf Ranking"
 * sections into a single unified component with:
 * - Section header: "OFFICIAL WORLD GOLF RANKING" + "View All"
 * - Sub-header: "Movers This Week" with horizontal scrollable player cards
 * - Divider
 * - Full OWGR table with inline movement indicators
 * - Tap-to-scroll: Clicking a mover card scrolls to their row in the table
 * - Big mover highlighting: Left border accent on players who appear in the spotlight
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRankingMovers, useWorldRankingsFull } from '../../hooks/useOverviewModules';
import CountryFlag from '@/components/ui/country-flag';
import { resolvePhotoUrl, getPgaTourHeadshotUrl } from '../../utils/resolvePhotoUrl';

const PLAYERS_PER_PAGE = 10;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatCountryName(country: string | null): string {
  if (!country) return '';
  return country
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function truncateName(name: string, maxLength: number = 13): string {
  if (name.length <= maxLength) return name;
  return name.slice(0, maxLength) + '…';
}

// ============================================================================
// SKELETON COMPONENTS
// ============================================================================

function MoverSkeletonCard() {
  return (
    <div className="flex-shrink-0 w-[100px] flex flex-col items-center p-3">
      <div 
        className="w-[68px] mb-2"
        style={{
          aspectRatio: '1 / 1.05',
          borderRadius: '34%',
          background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite linear',
        }}
      />
      <div 
        className="h-4 w-16 rounded-full mb-1"
        style={{
          background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite linear',
        }}
      />
      <div 
        className="h-3 w-12 rounded-full"
        style={{
          background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite linear',
        }}
      />
    </div>
  );
}

function TableSkeletonRow({ index }: { index: number }) {
  const isEven = index % 2 === 0;
  return (
    <div 
      className={cn(
        "flex items-center px-4 py-3 h-16",
        isEven && "bg-black/[0.015]"
      )}
    >
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

// ============================================================================
// RANK BADGE COMPONENT
// ============================================================================

function RankBadge({ rank }: { rank: number }) {
  const isTop3 = rank <= 3;
  
  const badgeStyles = {
    1: { background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', color: 'white' },
    2: { background: 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)', color: '#374151' },
    3: { background: 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)', color: 'white' },
  };
  
  const defaultStyle = { background: '#475569', color: 'white' };
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

// ============================================================================
// MOVERS SPOTLIGHT CARD
// ============================================================================

interface MoverCardProps {
  entry: {
    playerId: string;
    firstName: string;
    lastName: string;
    country: string;
    photoUrl: string | null;
    pgaTourId: string | null;
    rank: number;
    priorRank: number | null;
    rankChange: number;
  };
  index: number;
  onTap: (playerId: string, rank: number) => void;
}

function MoverCard({ entry, index, onTap }: MoverCardProps) {
  const isUp = entry.rankChange > 0;
  const previousRank = entry.priorRank || (entry.rank + (isUp ? entry.rankChange : -entry.rankChange));

  return (
    <motion.button
      onClick={() => onTap(entry.playerId, entry.rank)}
      className="flex-shrink-0 flex flex-col items-center p-3 pb-[14px] rounded-2xl border transition-colors overflow-visible"
      style={{
        minWidth: '100px',
        background: 'rgba(255, 255, 255, 0.6)',
        borderColor: 'rgba(0, 0, 0, 0.04)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        scrollSnapAlign: 'start',
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      role="listitem"
      aria-label={`${entry.firstName} ${entry.lastName}, moved ${isUp ? 'up' : 'down'} ${Math.abs(entry.rankChange)} positions, from rank ${previousRank} to rank ${entry.rank}`}
    >
      {/* Photo with Badge - Squircle shape */}
      <div className="relative mb-2">
        <div 
          className="w-[68px] overflow-hidden bg-slate-100"
          style={{
            aspectRatio: '1 / 1.05',
            borderRadius: '34%',
            border: '3px solid white',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          {(() => {
            const photoUrl = resolvePhotoUrl(entry.photoUrl, entry.pgaTourId);
            return photoUrl ? (
              <img
                src={photoUrl}
                alt={`${entry.firstName} ${entry.lastName}`}
                className="w-full h-full object-cover object-top"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-200">
                <span className="text-lg font-bold text-slate-400">
                  {entry.firstName[0]}{entry.lastName[0]}
                </span>
              </div>
            );
          })()}
        </div>

        {/* Movement Badge - Bottom right with gradient */}
        <motion.div
          className="absolute -bottom-1 -right-1 flex items-center gap-0.5 px-2 py-1 rounded-xl text-[12px] font-bold text-white"
          style={{
            background: isUp 
              ? 'linear-gradient(135deg, #34C759 0%, #30B350 100%)'
              : 'linear-gradient(135deg, #FF3B30 0%, #E6352B 100%)',
            border: '2.5px solid white',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            delay: 0.1 + index * 0.05,
            duration: 0.3,
            ease: [0.34, 1.56, 0.64, 1],
          }}
        >
          <span className="text-[10px]">{isUp ? '↑' : '↓'}</span>
          {Math.abs(entry.rankChange)}
        </motion.div>
      </div>

      {/* Name */}
      <p 
        className="text-[15px] font-semibold text-slate-900 text-center truncate mb-1"
        style={{ maxWidth: '90px' }}
      >
        {entry.lastName}
      </p>

      {/* Was → Now Format */}
      <div className="flex items-center gap-1 text-[13px] font-medium text-slate-500 mb-1.5">
        <span className="opacity-50">#{previousRank}</span>
        <span className="text-[10px] opacity-40">→</span>
        <span className="font-semibold text-slate-900">#{entry.rank}</span>
      </div>

      {/* Flag */}
      {entry.country && (
        <div className="flex items-center justify-center mt-1.5">
          <CountryFlag country={entry.country} size="sm" />
        </div>
      )}
    </motion.button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function UnifiedWorldRankings() {
  const navigate = useNavigate();
  const { data: movers, isLoading: moversLoading } = useRankingMovers();
  const { data: rankings, isLoading: rankingsLoading } = useWorldRankingsFull();
  
  const [currentPage, setCurrentPage] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [highlightedPlayerId, setHighlightedPlayerId] = useState<string | null>(null);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  
  const isLoading = moversLoading || rankingsLoading;
  
  const totalPlayers = rankings?.length || 0;
  const totalPages = Math.ceil(totalPlayers / PLAYERS_PER_PAGE);
  
  const startIndex = currentPage * PLAYERS_PER_PAGE;
  const endIndex = Math.min(startIndex + PLAYERS_PER_PAGE, totalPlayers);
  const currentPagePlayers = rankings?.slice(startIndex, endIndex) || [];
  
  // Set of player IDs who are "big movers" (appear in the spotlight)
  const moverPlayerIds = useMemo(() => {
    return new Set(movers?.map(m => m.playerId) || []);
  }, [movers]);
  
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
  
  // Clear highlight after animation
  useEffect(() => {
    if (highlightedPlayerId) {
      const timer = setTimeout(() => setHighlightedPlayerId(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [highlightedPlayerId]);
  
  const goToPrevPage = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };
  
  const goToNextPage = () => {
    if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1);
  };
  
  // Handle tap on mover card - scroll to player's row in table
  const handleMoverTap = useCallback((playerId: string, rank: number) => {
    // Calculate which page this player is on
    const playerPage = Math.floor((rank - 1) / PLAYERS_PER_PAGE);
    
    // Navigate to that page first
    setCurrentPage(playerPage);
    
    // Highlight the player after a short delay to allow page render
    setTimeout(() => {
      setHighlightedPlayerId(playerId);
      
      // Scroll to the row
      const rowElement = rowRefs.current.get(playerId);
      if (rowElement) {
        rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }, []);
  
  // Register row ref
  const setRowRef = useCallback((playerId: string, element: HTMLDivElement | null) => {
    if (element) {
      rowRefs.current.set(playerId, element);
    } else {
      rowRefs.current.delete(playerId);
    }
  }, []);
  
  // Loading state
  if (isLoading) {
    return (
      <section className="pt-6 pb-4 border-t border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-4 mb-4">
          <h2 className="text-[13px] font-semibold text-slate-900 uppercase tracking-[0.5px]">
            Official World Golf Ranking
          </h2>
        </div>
        
        {/* Movers Subtitle */}
        <div className="px-4 mb-3">
          <h3 className="text-[18px] font-semibold text-slate-800">Movers This Week</h3>
        </div>
        
        {/* Mover Cards Skeleton */}
        <div 
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-4 px-4"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {[1, 2, 3, 4].map(i => <MoverSkeletonCard key={i} />)}
        </div>
        
        {/* Divider */}
        <div className="mx-4 my-4 h-px bg-slate-200/60" />
        
        {/* Table Header */}
        <div className="flex items-center px-4 py-3 text-[11px] uppercase tracking-[0.3px] text-slate-400/60 font-semibold border-b border-slate-200/60 bg-slate-50/50">
          <div className="w-9 text-center flex-shrink-0">+/-</div>
          <div className="flex-1 pl-1">Player</div>
          <div className="w-[60px] text-center flex-shrink-0">Avg Pts</div>
          <div className="w-[70px] text-center flex-shrink-0">Total Pts</div>
          <div className="w-[50px] text-center flex-shrink-0">Events</div>
        </div>
        
        {/* Table Rows Skeleton */}
        {[...Array(10)].map((_, i) => <TableSkeletonRow key={i} index={i} />)}
      </section>
    );
  }
  
  // No data state
  if (!rankings?.length) {
    return null;
  }
  
  const hasMovers = movers && movers.length > 0;
  
  return (
    <section className="pt-6 pb-4 border-t border-slate-100">
      {/* Section Header - Single line with uppercase title */}
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
      
      {/* Movers This Week Sub-Section */}
      <div className="px-4 mb-3">
        <h3 className="text-[18px] font-semibold text-slate-800">Movers This Week</h3>
      </div>
      
      {hasMovers ? (
        <>
          {/* Horizontal Scroll Mover Cards */}
          <div 
            className="flex gap-3 overflow-x-auto scrollbar-hide pb-4 px-4"
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollSnapType: 'x mandatory',
            }}
            role="list"
            aria-label="Golf players with biggest ranking improvements this week"
          >
            {movers.map((entry, idx) => (
              <MoverCard 
                key={entry.playerId} 
                entry={entry} 
                index={idx}
                onTap={handleMoverTap}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-6 px-4">
          <TrendingDown className="w-6 h-6 text-slate-300/60 mx-auto mb-2" />
          <p className="text-[15px] text-slate-400/50">No significant ranking changes this week</p>
        </div>
      )}
      
      {/* Divider */}
      <div className="mx-4 my-4 h-px bg-slate-200/60" />
      
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
            {/* Header Row */}
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
                const isBigMover = moverPlayerIds.has(entry.player.id);
                const isHighlighted = highlightedPlayerId === entry.player.id;
                
                return (
                  <div 
                    key={entry.player.id}
                    ref={(el) => setRowRef(entry.player.id, el)}
                    className={cn(
                      "flex items-center px-4 py-3 cursor-pointer transition-all duration-300 active:bg-slate-100/80",
                      isEven && "bg-black/[0.015]",
                      isHighlighted && "bg-emerald-50/60"
                    )}
                    onClick={() => navigate(`/tourhub/player/${entry.player.id}`)}
                    role="row"
                    aria-label={`Rank ${entry.rank}: ${fullName}, ${entry.rank_change > 0 ? `up ${entry.rank_change}` : entry.rank_change < 0 ? `down ${Math.abs(entry.rank_change)}` : 'unchanged'}`}
                    style={{ 
                      height: '64px',
                      borderLeft: isBigMover ? '3px solid #16A34A' : 'none',
                    }}
                  >
                    {/* Column 1: Movement (+/-) - Green/Red indicators */}
                    <div className={cn(
                      "w-9 text-center text-[13px] font-semibold flex-shrink-0",
                      entry.rank_change > 0 && "text-emerald-600",
                      entry.rank_change < 0 && "text-red-500",
                      entry.rank_change === 0 && "text-slate-300"
                    )} role="cell">
                      {entry.rank_change > 0 && `▲${entry.rank_change}`}
                      {entry.rank_change < 0 && `▼${Math.abs(entry.rank_change)}`}
                      {entry.rank_change === 0 && '—'}
                    </div>

                    {/* Column 2: Avatar with Rank Badge + Player Info */}
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
                        
                        {/* Rank badge */}
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
