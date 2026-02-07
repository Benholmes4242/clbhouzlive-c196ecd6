/**
 * UnifiedWorldRankings v3 - Premium OWGR Table + Movers Strip
 * 
 * Design Philosophy: Clean white card container on #f8fafc background.
 * Movers strip with magnitude-based color tiers. Proper gold/silver/bronze
 * position badges. Alternating row backgrounds with subtle rhythm.
 * 
 * Features:
 * - White card container with refined border/shadow
 * - Section header: "Official World Golf Ranking" (title case) + "View All"
 * - Movers strip with dynamic fire icon and magnitude-scaled badges
 * - Full OWGR table with improved column widths for names
 * - Tap-to-scroll: Clicking a mover card scrolls to their row
 * - Simplified pagination (max 6 dots)
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
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

/** Get movement badge gradient based on magnitude */
function getMovementBadgeStyle(change: number) {
  const absChange = Math.abs(change);
  
  if (absChange >= 100) {
    return { background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)' }; // Deep green
  } else if (absChange >= 50) {
    return { background: 'linear-gradient(135deg, #16A34A 0%, #22C55E 100%)' }; // Strong green
  } else if (absChange >= 20) {
    return { background: '#22C55E' }; // Standard green
  } else {
    return { background: '#6EE7B7', color: '#065F46' }; // Muted green for small changes
  }
}

// ============================================================================
// SKELETON COMPONENTS
// ============================================================================

function CompactMoverSkeletonCard() {
  return (
    <div className="flex-shrink-0 flex flex-col items-center" style={{ width: '80px' }}>
      <div 
        className="mb-2.5"
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '14px',
          background: 'linear-gradient(90deg, #F1F3F5 25%, #E5E7EB 50%, #F1F3F5 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite linear',
        }}
      />
      <div 
        className="h-3 w-12 rounded-full mb-1"
        style={{
          background: 'linear-gradient(90deg, #F1F3F5 25%, #E5E7EB 50%, #F1F3F5 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite linear',
        }}
      />
      <div 
        className="h-2.5 w-6 rounded-full"
        style={{
          background: 'linear-gradient(90deg, #F1F3F5 25%, #E5E7EB 50%, #F1F3F5 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite linear',
        }}
      />
    </div>
  );
}

function TableSkeletonRow({ index }: { index: number }) {
  const isOdd = index % 2 === 1;
  return (
    <div 
      className="flex items-center"
      style={{
        padding: '12px 16px',
        minHeight: '64px',
        background: isOdd ? '#FAFBFC' : '#FFFFFF',
        borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
      }}
    >
      <div style={{ width: '36px', flexShrink: 0 }} className="flex justify-center">
        <div 
          className="h-4 w-6 rounded"
          style={{
            background: 'linear-gradient(90deg, #F1F3F5 25%, #E5E7EB 50%, #F1F3F5 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite linear',
          }}
        />
      </div>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div 
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            flexShrink: 0,
            background: 'linear-gradient(90deg, #F1F3F5 25%, #E5E7EB 50%, #F1F3F5 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite linear',
          }}
        />
        <div className="flex-1 min-w-0 space-y-1.5">
          <div 
            className="h-4 w-28 rounded"
            style={{
              background: 'linear-gradient(90deg, #F1F3F5 25%, #E5E7EB 50%, #F1F3F5 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite linear',
            }}
          />
          <div 
            className="h-3 w-16 rounded"
            style={{
              background: 'linear-gradient(90deg, #F1F3F5 25%, #E5E7EB 50%, #F1F3F5 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite linear',
            }}
          />
        </div>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3].map(i => (
          <div 
            key={i}
            className="h-4 rounded"
            style={{
              width: i === 3 ? '48px' : '64px',
              background: 'linear-gradient(90deg, #F1F3F5 25%, #E5E7EB 50%, #F1F3F5 75%)',
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
// RANK BADGE COMPONENT - Gold/Silver/Bronze system
// ============================================================================

function RankBadge({ rank }: { rank: number }) {
  const getStyle = () => {
    if (rank === 1) {
      return { background: 'linear-gradient(135deg, #FFB800 0%, #FF8C00 100%)', color: 'white' };
    } else if (rank === 2) {
      return { background: 'linear-gradient(135deg, #C0C0C0 0%, #9A9A9A 100%)', color: 'white' };
    } else if (rank === 3) {
      return { background: 'linear-gradient(135deg, #CD7F32 0%, #A0622E 100%)', color: 'white' };
    } else {
      return { background: '#E5E7EB', color: 'rgba(0, 0, 0, 0.5)' };
    }
  };
  
  const style = getStyle();
  
  return (
    <div 
      className="absolute -top-1 -right-1 flex items-center justify-center"
      style={{
        width: '20px',
        height: '20px',
        borderRadius: '7px',
        fontSize: '10px',
        fontWeight: 700,
        border: '1.5px solid #FFFFFF',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
        ...style,
      }}
    >
      {rank}
    </div>
  );
}

// ============================================================================
// COMPACT MOVER CARD - With magnitude-based styling
// ============================================================================

interface CompactMoverCardProps {
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

function CompactMoverCard({ entry, index, onTap }: CompactMoverCardProps) {
  const isUp = entry.rankChange > 0;
  const badgeStyle = getMovementBadgeStyle(entry.rankChange);
  const initials = `${entry.firstName[0]}${entry.lastName[0]}`;

  return (
    <motion.button
      onClick={() => onTap(entry.playerId, entry.rank)}
      className="flex-shrink-0 flex flex-col items-center overflow-visible"
      style={{
        width: '80px',
        scrollSnapAlign: 'start',
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.95 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Photo with Movement Badge */}
      <div className="relative mb-2.5">
        <div 
          className="overflow-hidden"
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            border: '2px solid rgba(34, 197, 94, 0.2)',
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
              <div 
                className="w-full h-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
                }}
              >
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#2E7D32' }}>
                  {initials}
                </span>
              </div>
            );
          })()}
        </div>

        {/* Movement Badge - Magnitude-based color */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 flex items-center gap-0.5"
          style={{
            bottom: '-8px',
            padding: '2px 8px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 700,
            color: badgeStyle.color || 'white',
            border: '2px solid #FFFFFF',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.12)',
            ...badgeStyle,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            delay: 0.1 + index * 0.08,
            duration: 0.3,
            ease: [0.34, 1.56, 0.64, 1],
          }}
        >
          <span style={{ fontSize: '9px' }}>{isUp ? '↑' : '↓'}</span>
          {Math.abs(entry.rankChange)}
        </motion.div>
      </div>

      {/* Name - Extra top margin to clear badge */}
      <p 
        className="text-center truncate leading-tight"
        style={{ 
          fontSize: '12px', 
          fontWeight: 600, 
          color: '#111827',
          marginTop: '10px',
          maxWidth: '78px',
        }}
      >
        {entry.lastName}
      </p>

      {/* Current Rank */}
      <span 
        style={{ 
          fontSize: '11px', 
          fontWeight: 400, 
          color: 'rgba(0, 0, 0, 0.35)',
          marginTop: '1px',
        }}
      >
        #{entry.rank}
      </span>
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
  const [highlightedPlayerId, setHighlightedPlayerId] = useState<string | null>(null);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  
  const isLoading = moversLoading || rankingsLoading;
  
  const totalPlayers = rankings?.length || 0;
  const totalPages = Math.ceil(totalPlayers / PLAYERS_PER_PAGE);
  
  const startIndex = currentPage * PLAYERS_PER_PAGE;
  const endIndex = Math.min(startIndex + PLAYERS_PER_PAGE, totalPlayers);
  const currentPagePlayers = rankings?.slice(startIndex, endIndex) || [];
  
  const moverPlayerIds = useMemo(() => {
    return new Set(movers?.map(m => m.playerId) || []);
  }, [movers]);
  
  const moversCount = movers?.length || 0;
  
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
  
  // Handle tap on mover card
  const handleMoverTap = useCallback((playerId: string, rank: number) => {
    const playerPage = Math.floor((rank - 1) / PLAYERS_PER_PAGE);
    setCurrentPage(playerPage);
    
    setTimeout(() => {
      setHighlightedPlayerId(playerId);
      const rowElement = rowRefs.current.get(playerId);
      if (rowElement) {
        rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }, []);
  
  const setRowRef = useCallback((playerId: string, element: HTMLDivElement | null) => {
    if (element) {
      rowRefs.current.set(playerId, element);
    } else {
      rowRefs.current.delete(playerId);
    }
  }, []);
  
  // Calculate visible dots (max 6 with sliding window)
  const maxVisibleDots = 6;
  const getVisibleDotRange = () => {
    if (totalPages <= maxVisibleDots) {
      return { start: 0, end: totalPages };
    }
    
    const halfWindow = Math.floor(maxVisibleDots / 2);
    let start = currentPage - halfWindow;
    let end = currentPage + halfWindow;
    
    if (start < 0) {
      start = 0;
      end = maxVisibleDots;
    } else if (end >= totalPages) {
      end = totalPages;
      start = totalPages - maxVisibleDots;
    }
    
    return { start, end };
  };
  
  const dotRange = getVisibleDotRange();
  
  // Loading state
  if (isLoading) {
    return (
      <motion.section 
        style={{ marginTop: '32px', padding: '0 16px' }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <div 
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            borderRadius: '16px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden',
            padding: '20px 0',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between" style={{ padding: '0 16px', marginBottom: '16px' }}>
            <div className="h-5 w-48 bg-slate-100 rounded animate-pulse" />
          </div>
          
          {/* Movers skeleton */}
          <div className="flex items-center justify-between" style={{ padding: '0 16px', marginBottom: '12px' }}>
            <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide" style={{ padding: '0 16px' }}>
            {[1, 2, 3, 4].map(i => <CompactMoverSkeletonCard key={i} />)}
          </div>
          
          {/* Divider */}
          <div style={{ borderTop: '1px solid rgba(0, 0, 0, 0.06)', margin: '20px 16px 0 16px' }} />
          
          {/* Table skeleton */}
          <div style={{ paddingTop: '16px' }}>
            {[...Array(10)].map((_, i) => <TableSkeletonRow key={i} index={i} />)}
          </div>
        </div>
      </motion.section>
    );
  }
  
  // No data state
  if (!rankings?.length) {
    return null;
  }
  
  const hasMovers = movers && movers.length > 0;
  
  return (
    <motion.section 
      style={{ marginTop: '32px', padding: '0 16px' }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* White Card Container */}
      <div 
        style={{
          background: '#FFFFFF',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          padding: '20px 0',
        }}
      >
        {/* Section Header */}
        <motion.div 
          className="flex items-center justify-between"
          style={{ padding: '0 16px', marginBottom: '16px' }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 
            style={{ 
              fontSize: '18px', 
              fontWeight: 700, 
              color: '#111827',
              letterSpacing: '-0.3px',
            }}
          >
            Official World Golf Ranking
          </h2>
          <button 
            onClick={() => navigate('/tourhub?tab=players')}
            className="flex items-center gap-1 group transition-all duration-300 active:scale-[0.97]"
            style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(0, 0, 0, 0.35)' }}
          >
            <span className="group-hover:text-primary transition-colors">View All</span>
            <ChevronRight 
              className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-[3px] transition-all" 
            />
          </button>
        </motion.div>
        
        {/* Movers Strip */}
        {hasMovers ? (
          <>
            {/* Movers subheader with fire icon */}
            <motion.div 
              className="flex items-center justify-between"
              style={{ padding: '0 16px', marginBottom: '12px' }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center gap-1.5">
                <div 
                  className="flex items-center justify-center"
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '6px',
                    background: 'rgba(34, 197, 94, 0.08)',
                  }}
                >
                  <TrendingUp style={{ width: '12px', height: '12px', color: '#16A34A' }} />
                </div>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                  Movers This Week
                </span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(0, 0, 0, 0.3)' }}>
                1–{Math.min(4, moversCount)} of {moversCount}
              </span>
            </motion.div>
            
            {/* Horizontal scroll with edge fades */}
            <div className="relative">
              {/* Scroll container */}
              <div 
                className="flex gap-3 overflow-x-auto scrollbar-hide"
                style={{
                  padding: '0 16px 8px 16px',
                  WebkitOverflowScrolling: 'touch',
                  scrollSnapType: 'x mandatory',
                }}
              >
                {movers.map((entry, idx) => (
                  <CompactMoverCard 
                    key={entry.playerId} 
                    entry={entry} 
                    index={idx}
                    onTap={handleMoverTap}
                  />
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-4" style={{ padding: '0 16px' }}>
            <p style={{ fontSize: '13px', color: 'rgba(0, 0, 0, 0.35)' }}>
              No significant ranking changes this week
            </p>
          </div>
        )}
        
        {/* Divider between movers and table */}
        <div style={{ borderTop: '1px solid rgba(0, 0, 0, 0.06)', margin: '20px 16px 0 16px' }} />
        
        {/* Table */}
        <div ref={scrollContainerRef} style={{ paddingTop: '16px' }}>
          {/* Table Header */}
          <div 
            className="flex items-center"
            style={{
              padding: '0 16px 10px 16px',
              borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
            }}
          >
            <div 
              style={{ 
                width: '36px', 
                flexShrink: 0, 
                fontSize: '10px', 
                fontWeight: 600, 
                letterSpacing: '0.8px', 
                textTransform: 'uppercase', 
                color: 'rgba(0, 0, 0, 0.3)',
                textAlign: 'center',
              }}
            >
              +/-
            </div>
            <div 
              style={{ 
                flex: 1, 
                minWidth: 0,
                fontSize: '10px', 
                fontWeight: 600, 
                letterSpacing: '0.8px', 
                textTransform: 'uppercase', 
                color: 'rgba(0, 0, 0, 0.3)',
              }}
            >
              Player
            </div>
            <div 
              style={{ 
                width: '64px', 
                flexShrink: 0, 
                textAlign: 'right',
                fontSize: '10px', 
                fontWeight: 600, 
                letterSpacing: '0.8px', 
                textTransform: 'uppercase', 
                color: 'rgba(0, 0, 0, 0.3)',
              }}
            >
              Avg Pts
            </div>
            <div 
              style={{ 
                width: '70px', 
                flexShrink: 0, 
                textAlign: 'right',
                fontSize: '10px', 
                fontWeight: 600, 
                letterSpacing: '0.8px', 
                textTransform: 'uppercase', 
                color: 'rgba(0, 0, 0, 0.3)',
              }}
            >
              Total Pts
            </div>
            <div 
              style={{ 
                width: '48px', 
                flexShrink: 0, 
                textAlign: 'right',
                fontSize: '10px', 
                fontWeight: 600, 
                letterSpacing: '0.8px', 
                textTransform: 'uppercase', 
                color: 'rgba(0, 0, 0, 0.3)',
              }}
            >
              Events
            </div>
          </div>
          
          {/* Player Rows */}
          <div>
            {currentPagePlayers.map((entry, index) => {
              const isOdd = index % 2 === 1;
              const fullName = `${entry.player.first_name} ${entry.player.last_name}`;
              const isBigMover = moverPlayerIds.has(entry.player.id);
              const isHighlighted = highlightedPlayerId === entry.player.id;
              const isWorldNo1 = entry.rank === 1;
              
              // Row background
              let rowBg = isOdd ? '#FAFBFC' : '#FFFFFF';
              if (isWorldNo1) rowBg = '#FFFDF5'; // Warm cream for #1
              if (isHighlighted) rowBg = 'rgba(52, 120, 246, 0.03)';
              
              // AVG PTS color based on rank
              let avgPtsColor = '#3478F6';
              if (entry.rank === 1) avgPtsColor = '#B8860B'; // Gold for #1
              else if (entry.rank <= 3) avgPtsColor = '#3478F6';
              else avgPtsColor = 'rgba(52, 120, 246, 0.8)';
              
              return (
                <motion.div 
                  key={entry.player.id}
                  ref={(el) => setRowRef(entry.player.id, el)}
                  className="flex items-center cursor-pointer transition-all duration-200"
                  onClick={() => navigate(`/tourhub/player/${entry.player.id}`)}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  style={{ 
                    padding: '12px 16px',
                    minHeight: '64px',
                    background: rowBg,
                    borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
                    borderLeft: isBigMover ? '3px solid #16A34A' : 'none',
                  }}
                  whileHover={{ background: 'rgba(52, 120, 246, 0.03)' }}
                >
                  {/* Column 1: Movement (+/-) */}
                  <div 
                    className="flex items-center justify-center"
                    style={{ width: '36px', flexShrink: 0 }}
                  >
                    {entry.rank_change > 0 ? (
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#16A34A' }}>
                        ▲{entry.rank_change}
                      </span>
                    ) : entry.rank_change < 0 ? (
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#DC2626' }}>
                        ▼{Math.abs(entry.rank_change)}
                      </span>
                    ) : (
                      <div 
                        style={{ 
                          width: '10px', 
                          height: '2px', 
                          background: 'rgba(0, 0, 0, 0.12)', 
                          borderRadius: '1px',
                        }} 
                      />
                    )}
                  </div>

                  {/* Column 2: Avatar with Rank Badge + Player Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="relative flex-shrink-0">
                      <div 
                        className="overflow-hidden"
                        style={{ 
                          width: '40px',
                          height: '40px',
                          borderRadius: '12px',
                          border: '1px solid rgba(0, 0, 0, 0.06)',
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
                              <div 
                                className="absolute inset-0 flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)' }}
                              >
                                <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(0, 0, 0, 0.35)' }}>
                                  {initials}
                                </span>
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
                      
                      {/* Rank badge - Gold/Silver/Bronze system */}
                      <RankBadge rank={entry.rank} />
                    </div>
                    
                    {/* Player name and country */}
                    <div className="min-w-0 flex-1">
                      <div 
                        className="truncate"
                        style={{ 
                          fontSize: '15px', 
                          fontWeight: 600, 
                          color: '#111827',
                          lineHeight: 1.3,
                        }}
                        title={fullName}
                      >
                        {fullName}
                      </div>
                      <div 
                        className="flex items-center gap-1"
                        style={{ marginTop: '2px' }}
                      >
                        <div style={{ width: '14px', height: '10px', borderRadius: '1px' }}>
                          <CountryFlag country={entry.player.country} size="sm" />
                        </div>
                        <span 
                          className="truncate"
                          style={{ fontSize: '11px', fontWeight: 400, color: 'rgba(0, 0, 0, 0.4)' }}
                        >
                          {formatCountryName(entry.player.country)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Avg Points */}
                  <div style={{ width: '64px', flexShrink: 0, textAlign: 'right' }}>
                    <span 
                      style={{ 
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '14px', 
                        fontWeight: 700,
                        color: avgPtsColor,
                      }}
                    >
                      {entry.avg_points?.toFixed(2) ?? '—'}
                    </span>
                  </div>

                  {/* Column 4: Total Points */}
                  <div style={{ width: '70px', flexShrink: 0, textAlign: 'right' }}>
                    <span 
                      style={{ 
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '13px', 
                        fontWeight: 500,
                        color: 'rgba(0, 0, 0, 0.5)',
                      }}
                    >
                      {entry.total_points 
                        ? entry.total_points.toLocaleString(undefined, { maximumFractionDigits: 1 }) 
                        : '—'}
                    </span>
                  </div>

                  {/* Column 5: Events */}
                  <div style={{ width: '48px', flexShrink: 0, textAlign: 'right' }}>
                    <span 
                      style={{ 
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '13px', 
                        fontWeight: 500,
                        color: 'rgba(0, 0, 0, 0.35)',
                      }}
                    >
                      {entry.events_played ?? '—'}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
        
        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div style={{ padding: '12px 16px 0 16px' }}>
            <div className="flex items-center justify-center gap-4 py-3">
              {/* Left Arrow */}
              <button 
                onClick={goToPrevPage}
                disabled={currentPage === 0}
                className="flex items-center justify-center transition-all duration-200"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: '#FFFFFF',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  boxShadow: currentPage === 0 ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.04)',
                  opacity: currentPage === 0 ? 0.3 : 1,
                  pointerEvents: currentPage === 0 ? 'none' : 'auto',
                }}
              >
                <ChevronLeft 
                  className="w-3.5 h-3.5" 
                  style={{ color: currentPage === 0 ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.4)' }} 
                />
              </button>
              
              {/* Page dots (max 6 visible) */}
              <div className="flex items-center gap-1.5">
                {Array.from({ length: dotRange.end - dotRange.start }).map((_, i) => {
                  const dotIndex = dotRange.start + i;
                  const isActive = dotIndex === currentPage;
                  
                  return (
                    <button
                      key={dotIndex}
                      onClick={() => setCurrentPage(dotIndex)}
                      className="transition-all duration-300"
                      style={{
                        height: '6px',
                        width: isActive ? '20px' : '6px',
                        borderRadius: '3px',
                        background: isActive ? '#111827' : 'rgba(0, 0, 0, 0.12)',
                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    />
                  );
                })}
              </div>
              
              {/* Right Arrow */}
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages - 1}
                className="flex items-center justify-center transition-all duration-200"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: '#FFFFFF',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  boxShadow: currentPage === totalPages - 1 ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.04)',
                  opacity: currentPage === totalPages - 1 ? 0.3 : 1,
                  pointerEvents: currentPage === totalPages - 1 ? 'none' : 'auto',
                }}
              >
                <ChevronRight 
                  className="w-3.5 h-3.5" 
                  style={{ color: currentPage === totalPages - 1 ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.4)' }} 
                />
              </button>
            </div>
            
            {/* Page count label */}
            <p 
              className="text-center"
              style={{
                fontSize: '11px',
                fontWeight: 500,
                color: 'rgba(0, 0, 0, 0.3)',
                marginTop: '6px',
              }}
            >
              {startIndex + 1}–{endIndex} of {totalPlayers}
            </p>
          </div>
        )}
      </div>
    </motion.section>
  );
}
