/**
 * HubGamesTripsCard - Promoted entry point to Games & Trips sheet
 * Full-width card with icon, title, subtitle, and chevron
 */

import React from 'react';
import { Calendar, ChevronRight } from 'lucide-react';

interface HubGamesTripsCardProps {
  gamesCount: number;
  tripsCount: number;
  onClick?: () => void;
}

export function HubGamesTripsCard({ gamesCount, tripsCount, onClick }: HubGamesTripsCardProps) {
  // Build subtitle text
  const parts: string[] = [];
  if (gamesCount > 0) {
    parts.push(`${gamesCount} game${gamesCount !== 1 ? 's' : ''}`);
  }
  if (tripsCount > 0) {
    parts.push(`${tripsCount} trip${tripsCount !== 1 ? 's' : ''}`);
  }
  
  const subtitle = parts.length > 0 
    ? `${parts.join(' · ')} upcoming`
    : 'Plan your next round';

  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border p-4 flex items-center gap-4 shadow-sm transition-colors active:bg-slate-50"
      style={{
        background: 'white',
        borderColor: 'hsl(220 13% 91%)',
      }}
    >
      {/* Icon container */}
      <div 
        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(34, 197, 94, 0.1)' }}
      >
        <Calendar className="w-6 h-6" style={{ color: '#22c55e' }} />
      </div>
      
      {/* Text content */}
      <div className="flex-1 text-left min-w-0">
        <span className="font-semibold text-[15px]" style={{ color: '#1e293b' }}>
          Games & Trips
        </span>
        <p className="text-sm truncate" style={{ color: '#64748b' }}>
          {subtitle}
        </p>
      </div>
      
      {/* Chevron */}
      <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: '#94a3b8' }} />
    </button>
  );
}
