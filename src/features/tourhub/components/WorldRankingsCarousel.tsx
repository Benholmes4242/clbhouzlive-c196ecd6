/**
 * WorldRankingsCarousel - Horizontal carousel showing top 5 world ranked players
 * PGA-style header module for the Tour Hub nav overlay
 */

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Trophy } from 'lucide-react';
import { useTourSeason, useTourPlayerStatistics } from '../hooks/useTourHubData';

interface WorldRankingsCarouselProps {
  onViewAll?: () => void;
}

// Format country name to title case
function toTitleCase(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Get initials from name
function getInitials(name: string): string {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export function WorldRankingsCarousel({ onViewAll }: WorldRankingsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: season } = useTourSeason();
  const { data: playerStats, isLoading } = useTourPlayerStatistics(season?.id);

  // Get top 5 players by world rank
  const topPlayers = React.useMemo(() => {
    if (!playerStats) return [];
    
    return playerStats
      .filter(stat => {
        const worldRank = (stat as any).raw_data?.statistics?.world_rank;
        return worldRank && worldRank > 0;
      })
      .sort((a, b) => {
        const aRank = (a as any).raw_data?.statistics?.world_rank || 9999;
        const bRank = (b as any).raw_data?.statistics?.world_rank || 9999;
        return aRank - bRank;
      })
      .slice(0, 5);
  }, [playerStats]);

  if (isLoading) {
    return (
      <div className="px-5 py-4">
        <div className="animate-pulse">
          <div className="h-4 w-32 bg-slate-200 rounded mb-4" />
          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex-shrink-0 w-56 h-20 bg-slate-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (topPlayers.length === 0) {
    return null;
  }

  return (
    <div className="py-4">
      {/* Header */}
      <div className="flex items-center justify-between px-5 mb-3">
        <div className="flex items-center gap-2">
          {/* Official pill */}
          <span 
            className="px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded-full"
            style={{
              border: '1px solid rgba(100, 116, 139, 0.3)',
              color: '#64748B',
            }}
          >
            Official
          </span>
          
          <div>
            <h3 
              className="text-base font-semibold"
              style={{ color: '#1e293b' }}
            >
              World Rankings
            </h3>
          </div>
        </div>
        
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-70"
            style={{ color: '#64748B' }}
          >
            View all
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto px-5 pb-2 snap-x snap-mandatory scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {topPlayers.map((stat, index) => {
          const player = stat.player;
          const worldRank = (stat as any).raw_data?.statistics?.world_rank;
          const playerName = player?.full_name || 'Unknown';
          const country = toTitleCase(player?.country);
          
          return (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex-shrink-0 w-56 snap-start rounded-xl p-3.5 transition-all active:scale-[0.98]"
              style={{
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div className="flex items-center gap-3">
                {/* Rank badge */}
                <div 
                  className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{
                    background: index === 0 
                      ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                      : index === 1
                      ? 'linear-gradient(135deg, #94A3B8 0%, #64748B 100%)'
                      : index === 2
                      ? 'linear-gradient(135deg, #D97706 0%, #B45309 100%)'
                      : 'rgba(100, 116, 139, 0.1)',
                    boxShadow: index < 3 
                      ? '0 2px 6px rgba(0, 0, 0, 0.15)'
                      : 'none',
                  }}
                >
                  <span 
                    className="text-lg font-bold"
                    style={{ 
                      color: index < 3 ? '#FFFFFF' : '#64748B',
                    }}
                  >
                    #{worldRank}
                  </span>
                </div>
                
                {/* Player info */}
                <div className="flex-1 min-w-0">
                  <p 
                    className="text-sm font-semibold truncate"
                    style={{ color: '#1e293b' }}
                  >
                    {playerName}
                  </p>
                  <p 
                    className="text-xs truncate"
                    style={{ color: '#94a3b8' }}
                  >
                    {country || 'Unknown'}
                  </p>
                </div>
                
                {/* Player avatar placeholder */}
                <div 
                  className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
                  style={{
                    background: 'rgba(100, 116, 139, 0.1)',
                  }}
                >
                  {player?.photo_url ? (
                    <img 
                      src={player.photo_url} 
                      alt={playerName}
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <span 
                    className={`text-xs font-semibold ${player?.photo_url ? 'hidden' : ''}`}
                    style={{ color: '#64748B' }}
                  >
                    {getInitials(playerName)}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
