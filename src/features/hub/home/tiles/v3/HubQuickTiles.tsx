/**
 * HubQuickTiles - Prominent tiles for Games & Trips / Discover Games
 */

import React from 'react';
import { Calendar, Search, ChevronRight } from 'lucide-react';
import { haptic } from '@/utils/haptics';

interface HubQuickTilesProps {
  gamesCount: number;
  tripsCount: number;
  onOpenGamesTrips: () => void;
  onOpenDiscover: () => void;
}

export function HubQuickTiles({ 
  gamesCount, 
  tripsCount, 
  onOpenGamesTrips, 
  onOpenDiscover 
}: HubQuickTilesProps) {
  // Build dynamic subtitle
  const getSubtitle = () => {
    const parts: string[] = [];
    if (gamesCount > 0) {
      parts.push(`${gamesCount} game${gamesCount !== 1 ? 's' : ''}`);
    }
    if (tripsCount > 0) {
      parts.push(`${tripsCount} trip${tripsCount !== 1 ? 's' : ''}`);
    }
    if (parts.length === 0) {
      return 'View your upcoming events';
    }
    return parts.join(' · ') + ' upcoming';
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Your Games & Trips */}
      <button
        onClick={() => {
          haptic('light');
          onOpenGamesTrips();
        }}
        className="flex items-center gap-4 w-full text-left transition-all active:scale-[0.99]"
        style={{
          padding: '18px 16px',
          background: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)',
        }}
      >
        {/* Icon container */}
        <div 
          className="flex-shrink-0 flex items-center justify-center"
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(59, 130, 246, 0.15)',
          }}
        >
          <Calendar className="w-6 h-6" style={{ color: '#3B82F6' }} />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div 
            className="font-semibold text-[15px]"
            style={{ color: '#1e293b' }}
          >
            Your Games & Trips
          </div>
          <div 
            className="text-[13px] mt-0.5"
            style={{ color: '#64748b' }}
          >
            {getSubtitle()}
          </div>
        </div>
        
        {/* Chevron */}
        <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: '#94a3b8' }} />
      </button>

      {/* Discover Games */}
      <button
        onClick={() => {
          haptic('light');
          onOpenDiscover();
        }}
        className="flex items-center gap-4 w-full text-left transition-all active:scale-[0.99]"
        style={{
          padding: '18px 16px',
          background: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)',
        }}
      >
        {/* Icon container */}
        <div 
          className="flex-shrink-0 flex items-center justify-center"
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(34, 197, 94, 0.15)',
          }}
        >
          <Search className="w-6 h-6" style={{ color: '#22C55E' }} />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div 
            className="font-semibold text-[15px]"
            style={{ color: '#1e293b' }}
          >
            Discover Games
          </div>
          <div 
            className="text-[13px] mt-0.5"
            style={{ color: '#64748b' }}
          >
            Find games near you to join
          </div>
        </div>
        
        {/* Chevron */}
        <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: '#94a3b8' }} />
      </button>
    </div>
  );
}
