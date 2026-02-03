/**
 * WorldRankingsModule - Apple-grade OWGR data table
 * 
 * Features:
 * - Fixed left columns (Rank, Movement, Player) with sticky positioning
 * - Horizontally scrollable stat columns (Avg Pts, Total Pts, Events, Week +/-)
 * - Display limited to 10 players with "View All"
 * - Top 3 rank badges (Gold/Silver/Bronze)
 * - Shimmer loading skeletons
 * - Refined typography and spacing
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorldRankingsFull } from '../../hooks/useOverviewModules';
import CountryFlag from '@/components/ui/country-flag';
import { getPgaTourHeadshotUrl } from '../../utils/resolvePhotoUrl';

const PLAYERS_TO_SHOW = 10;

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
      {/* Rank skeleton */}
      <div className="w-9 flex-shrink-0 flex justify-center">
        <div 
          className="w-5 h-5 rounded"
          style={{ 
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: `tourhubShimmer 1.5s infinite`,
            animationDelay: `${index * 0.05}s`,
          }}
        />
      </div>
      {/* Movement skeleton */}
      <div className="w-9 flex-shrink-0 flex justify-center">
        <div 
          className="w-6 h-4 rounded"
          style={{ 
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: `tourhubShimmer 1.5s infinite`,
            animationDelay: `${index * 0.05 + 0.02}s`,
          }}
        />
      </div>
      {/* Avatar skeleton */}
      <div className="flex items-center gap-2.5 min-w-[160px] flex-shrink-0">
        <div 
          className="w-10 h-10 rounded-full"
          style={{ 
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: `tourhubShimmer 1.5s infinite`,
            animationDelay: `${index * 0.05 + 0.04}s`,
          }}
        />
        <div className="space-y-1.5">
          <div 
            className="w-20 h-4 rounded"
            style={{ 
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: `tourhubShimmer 1.5s infinite`,
            animationDelay: `${index * 0.05 + 0.06}s`,
            }}
          />
          <div 
            className="w-14 h-3 rounded"
            style={{ 
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: `tourhubShimmer 1.5s infinite`,
            animationDelay: `${index * 0.05 + 0.08}s`,
            }}
          />
        </div>
      </div>
      {/* Stats skeleton */}
      <div className="flex-1 flex justify-end gap-4 pr-2">
        {[60, 70, 45, 80].map((w, i) => (
          <div 
            key={i}
            className="h-4 rounded"
            style={{ 
              width: `${w}px`,
              background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
              backgroundSize: '200% 100%',
              animation: `tourhubShimmer 1.5s infinite`,
              animationDelay: `${index * 0.05 + 0.1 + i * 0.02}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/** Rank badge for top 3 players */
function RankBadge({ rank }: { rank: number }) {
  if (rank > 3) return null;
  
  const styles = {
    1: { background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' },
    2: { background: 'linear-gradient(135deg, #E8E8E8 0%, #A8A8A8 100%)' },
    3: { background: 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)' },
  };
  
  return (
    <div 
      className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-white z-10"
      style={{ 
        ...styles[rank as 1 | 2 | 3],
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
  const [isScrolled, setIsScrolled] = useState(false);
  
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
  
  // Only show first 10 players
  const displayPlayers = rankings?.slice(0, PLAYERS_TO_SHOW) || [];
  
  if (isLoading) {
    return (
      <section className="pt-6 pb-6 border-t border-slate-100">
        <div className="px-4 mb-4 space-y-1">
          <p 
            className="text-[11px] font-medium uppercase"
            style={{ color: 'rgba(100, 116, 139, 0.5)', letterSpacing: '0.5px' }}
          >
            Official World Golf Ranking
          </p>
          <h2 
            className="text-[22px] font-semibold text-slate-900"
            style={{ letterSpacing: '-0.02em' }}
          >
            World Rankings
          </h2>
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
      {/* Header - Apple-grade typography */}
      <div className="flex items-center justify-between px-4 mb-4">
        <div className="space-y-1">
          <p 
            className="text-[11px] font-medium uppercase"
            style={{ color: 'rgba(100, 116, 139, 0.5)', letterSpacing: '0.5px' }}
          >
            Official World Golf Ranking
          </p>
          <h2 
            className="text-[22px] font-semibold text-slate-900"
            style={{ letterSpacing: '-0.02em' }}
          >
            World Rankings
          </h2>
        </div>
        <button 
          onClick={() => navigate('/tourhub?tab=players')}
          className="text-[15px] font-medium text-emerald-600 flex items-center gap-0.5 hover:text-emerald-700 transition-colors"
        >
          View All
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      
      {/* Table Container with Fixed + Scrollable Columns */}
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
          <div className="min-w-[560px]">
            {/* Header Row */}
            <div 
              className="flex items-center px-4 py-3"
              style={{ 
                borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                backgroundColor: 'rgba(248, 250, 252, 0.8)',
              }}
              role="row"
            >
              {/* Fixed columns header */}
              <div 
                className="w-9 text-center flex-shrink-0 text-[11px] font-semibold uppercase"
                style={{ color: 'rgba(0, 0, 0, 0.4)', letterSpacing: '0.3px' }}
              >
                #
              </div>
              <div 
                className="w-9 text-center flex-shrink-0 text-[11px] font-semibold uppercase"
                style={{ color: 'rgba(0, 0, 0, 0.4)', letterSpacing: '0.3px' }}
              >
                +/-
              </div>
              <div 
                className="min-w-[160px] flex-shrink-0 pl-1 text-[11px] font-semibold uppercase"
                style={{ color: 'rgba(0, 0, 0, 0.4)', letterSpacing: '0.3px' }}
              >
                Player
              </div>
              {/* Scrollable columns header */}
              <div 
                className="w-[72px] text-right flex-shrink-0 text-[11px] font-semibold uppercase"
                style={{ color: 'rgba(0, 0, 0, 0.4)', letterSpacing: '0.3px' }}
              >
                Avg Pts
              </div>
              <div 
                className="w-[80px] text-right flex-shrink-0 text-[11px] font-semibold uppercase"
                style={{ color: 'rgba(0, 0, 0, 0.4)', letterSpacing: '0.3px' }}
              >
                Total Pts
              </div>
              <div 
                className="w-[56px] text-center flex-shrink-0 text-[11px] font-semibold uppercase"
                style={{ color: 'rgba(0, 0, 0, 0.4)', letterSpacing: '0.3px' }}
              >
                Events
              </div>
              <div 
                className="w-[100px] text-right flex-shrink-0 pr-2 text-[11px] font-semibold uppercase"
                style={{ color: 'rgba(0, 0, 0, 0.4)', letterSpacing: '0.3px' }}
              >
                Week +/-
              </div>
            </div>
            
            {/* Player Rows */}
            <div>
              {displayPlayers.map((entry, idx) => {
                const fullName = `${entry.player.first_name} ${entry.player.last_name}`;
                const displayName = fullName.length > 13 
                  ? `${fullName.slice(0, 13)}…` 
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
                    {/* Rank */}
                    <div className="w-9 text-center flex-shrink-0">
                      <span 
                        className="text-[15px] font-semibold"
                        style={{ 
                          color: entry.rank === 1 ? '#FFD700' 
                            : entry.rank === 2 ? '#C0C0C0' 
                            : entry.rank === 3 ? '#CD7F32' 
                            : '#007AFF',
                        }}
                      >
                        {entry.rank}
                      </span>
                      {entry.tied && <span className="text-[8px] text-slate-400 ml-0.5">T</span>}
                    </div>

                    {/* Movement */}
                    <div className="w-9 text-center flex-shrink-0">
                      <span 
                        className="text-[13px] font-semibold flex items-center justify-center"
                        style={{ 
                          color: entry.rank_change > 0 ? '#34C759' 
                            : entry.rank_change < 0 ? '#FF3B30' 
                            : 'rgba(0, 0, 0, 0.25)',
                        }}
                      >
                        {entry.rank_change > 0 && `↑${entry.rank_change}`}
                        {entry.rank_change < 0 && `↓${Math.abs(entry.rank_change)}`}
                        {entry.rank_change === 0 && <span className="text-[16px]">—</span>}
                      </span>
                    </div>

                    {/* Player Cell */}
                    <div className="min-w-[160px] flex items-center gap-2.5 flex-shrink-0 pl-1 pr-3">
                      <div className="relative flex-shrink-0">
                        <div 
                          className="w-10 h-10 rounded-full overflow-hidden bg-slate-100"
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
                        <RankBadge rank={entry.rank} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div 
                          className="text-[15px] font-semibold text-slate-900 truncate leading-tight"
                          style={{ maxWidth: '110px' }}
                        >
                          {displayName}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <div 
                            className="overflow-hidden"
                            style={{
                              width: '14px',
                              height: '10px',
                              borderRadius: '1px',
                            }}
                          >
                            <CountryFlag country={entry.player.country} size="sm" />
                          </div>
                          <span className="text-[12px] truncate" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>
                            {formatCountryName(entry.player.country)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Avg Points - Blue highlight */}
                    <div className="w-[72px] text-right flex-shrink-0">
                      <span className="text-[14px] font-semibold" style={{ color: '#007AFF' }}>
                        {entry.avg_points?.toFixed(2) ?? '—'}
                      </span>
                    </div>

                    {/* Total Points */}
                    <div className="w-[80px] text-right flex-shrink-0">
                      <span className="text-[14px] font-medium text-slate-900">
                        {entry.total_points 
                          ? entry.total_points.toLocaleString(undefined, { maximumFractionDigits: 1 }) 
                          : '—'}
                      </span>
                    </div>

                    {/* Events */}
                    <div className="w-[56px] text-center flex-shrink-0">
                      <span className="text-[14px] font-medium text-slate-600">
                        {entry.events_played ?? '—'}
                      </span>
                    </div>

                    {/* Week +/- with middle dot separator */}
                    <div className="w-[100px] text-right flex-shrink-0 pr-2">
                      <span className="text-[13px] whitespace-nowrap">
                        <span className="font-medium" style={{ color: '#34C759' }}>
                          +{entry.points_gained?.toFixed(1) ?? '0'}
                        </span>
                        <span style={{ color: 'rgba(0, 0, 0, 0.2)', margin: '0 4px' }}>·</span>
                        <span className="font-medium" style={{ color: '#FF3B30' }}>
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
        
        {/* Fixed columns fade edge */}
        {isScrolled && (
          <div 
            className="absolute left-[220px] top-0 bottom-0 w-3 pointer-events-none"
            style={{ 
              background: 'linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)',
            }}
          />
        )}
      </div>
      
      {/* Footer text */}
      <p 
        className="text-center text-[12px] mt-3"
        style={{ color: 'rgba(0, 0, 0, 0.4)' }}
      >
        Showing top 10
      </p>
      
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
