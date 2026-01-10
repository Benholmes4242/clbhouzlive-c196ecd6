/**
 * TripCard - V2 Premium trip card
 * Glass-style with soft shadow, consistent with GameCard
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
      className="w-full flex items-center gap-3 px-3.5 py-3 rounded-[16px] text-left transition-all duration-150 active:scale-[0.99]"
      style={{
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)',
      }}
    >
      {/* Trip icon */}
      <div 
        className="flex-shrink-0 w-10 h-10 rounded-[12px] flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(147, 197, 253, 0.06) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.08)',
        }}
      >
        <Flag className="w-4 h-4" style={{ color: 'rgba(59, 130, 246, 0.7)' }} />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <span 
          className="text-[14px] font-semibold truncate block"
          style={{ color: '#1e293b' }}
        >
          {trip.name}
        </span>
        <div 
          className="text-[12px] mt-0.5 flex items-center gap-1.5"
          style={{ color: 'rgba(100, 116, 139, 0.7)' }}
        >
          <CalendarDays className="w-3 h-3" />
          <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
        </div>
      </div>

      {/* Progress chip */}
      <span 
        className="flex-shrink-0 px-2 py-1 text-[11px] font-medium rounded-full"
        style={{ 
          background: 'rgba(0, 0, 0, 0.03)', 
          color: 'rgba(100, 116, 139, 0.7)' 
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
            style={{ color: 'rgba(100, 116, 139, 0.5)' }}
          />
        </button>
      )}
    </button>
  );
}
