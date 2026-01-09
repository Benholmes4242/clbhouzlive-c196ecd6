/**
 * TripCard - Card for displaying trip info
 */

import React from 'react';
import { format } from 'date-fns';
import { MoreHorizontal, CalendarDays, Flag } from 'lucide-react';
import type { UserTrip } from '../../hooks/useUserGamesTrips';

interface TripCardProps {
  trip: UserTrip;
  onTap: () => void;
  onKebabTap?: (e: React.MouseEvent) => void;
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${format(start, 'MMM d')} – ${format(end, 'd, yyyy')}`;
  }
  
  return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
}

export function TripCard({ trip, onTap, onKebabTap }: TripCardProps) {
  return (
    <button
      onClick={onTap}
      className="w-full flex items-center gap-3 px-3 py-3 rounded-[14px] text-left transition-all duration-150 active:scale-[0.99] active:opacity-90"
      style={{
        background: 'rgba(255, 255, 255, 0.75)',
        border: '1px solid rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Trip icon */}
      <div 
        className="flex-shrink-0 w-10 h-10 rounded-[12px] flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 197, 253, 0.08) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.1)',
        }}
      >
        <Flag className="w-4 h-4" style={{ color: 'rgba(37, 99, 235, 0.7)' }} />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <span 
          className="text-[14px] font-medium truncate block"
          style={{ color: '#1e293b' }}
        >
          {trip.name}
        </span>
        <div 
          className="text-[12px] mt-0.5 flex items-center gap-2"
          style={{ color: 'rgba(30, 41, 59, 0.55)' }}
        >
          <CalendarDays className="w-3 h-3" />
          <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
        </div>
      </div>

      {/* Progress chip */}
      <span 
        className="flex-shrink-0 px-2 py-1 text-[11px] font-medium rounded-full"
        style={{ 
          background: 'rgba(0, 0, 0, 0.04)', 
          color: 'rgba(30, 41, 59, 0.6)' 
        }}
      >
        {trip.gamesCount} game{trip.gamesCount !== 1 ? 's' : ''}
      </span>

      {/* Kebab menu */}
      {onKebabTap && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onKebabTap(e);
          }}
          className="flex-shrink-0 p-1 rounded-full hover:bg-black/5 transition-colors"
        >
          <MoreHorizontal 
            className="w-4 h-4"
            style={{ color: 'rgba(30, 41, 59, 0.4)' }}
          />
        </button>
      )}
    </button>
  );
}
