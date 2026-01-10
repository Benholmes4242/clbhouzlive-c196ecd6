/**
 * WorldRankingsCarousel - Horizontal carousel showing top 5 world ranked players
 * Uses unified useWorldRankings hook for consistent data across all surfaces
 */

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useTopWorldRanked, toTitleCase, getInitials } from '../hooks/useWorldRankings';

interface WorldRankingsCarouselProps {
  onViewAll?: () => void;
}

export function WorldRankingsCarousel({ onViewAll }: WorldRankingsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: topPlayers, isLoading } = useTopWorldRanked(5);

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
        {topPlayers.map((rankedPlayer, index) => {
          const playerName = rankedPlayer.playerName;
          const country = toTitleCase(rankedPlayer.country);
          const worldRank = rankedPlayer.worldRank;
          const photoUrl = rankedPlayer.photoUrl;
          
          return (
            <motion.div
              key={rankedPlayer.playerId}
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
                  {photoUrl ? (
                    <img 
                      src={photoUrl} 
                      alt={playerName}
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <span 
                    className={`text-xs font-semibold ${photoUrl ? 'hidden' : ''}`}
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
