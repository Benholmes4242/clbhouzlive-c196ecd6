/**
 * TripCard - V2 Premium trip card
 * Now matches GameCard structure exactly:
 * - Row 1: Trip name + status chip
 * - Row 2: Date range
 * - Row 3: Participant count + games count meta line
 */

import React from 'react';
import { format } from 'date-fns';
import { Users, Flag } from 'lucide-react';
import { motion } from 'framer-motion';
import type { UserTrip } from '../../hooks/useUserGamesTrips';

interface TripCardProps {
  trip: UserTrip;
  variant: 'hero' | 'row';
  onTap: () => void;
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${format(start, 'MMM d')} – ${format(end, 'd, yyyy')}`;
  }
  
  if (start.getFullYear() === end.getFullYear()) {
    return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
  }
  
  return `${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`;
}

function getStatusChip(status: string): { label: string; bg: string; color: string } | null {
  switch (status) {
    case 'ongoing':
      return { label: 'Ongoing', bg: 'rgba(34, 197, 94, 0.1)', color: 'rgba(22, 163, 74, 0.85)' };
    case 'upcoming':
      return { label: 'Upcoming', bg: 'rgba(59, 130, 246, 0.08)', color: 'rgba(37, 99, 235, 0.75)' };
    case 'completed':
      return { label: 'Completed', bg: 'rgba(100, 116, 139, 0.08)', color: 'rgba(71, 85, 105, 0.75)' };
    default:
      return null;
  }
}

export function TripCard({ trip, variant, onTap }: TripCardProps) {
  const statusChip = getStatusChip(trip.status);

  if (variant === 'hero') {
    return (
      <motion.button
        onClick={onTap}
        className="w-full text-left rounded-[18px] p-4 transition-all duration-150 active:scale-[0.99]"
        style={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.03)',
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header row - Trip name + Status */}
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="flex-1 min-w-0">
            <h3 
              className="text-[15px] font-semibold truncate leading-tight"
              style={{ color: '#1e293b' }}
            >
              {trip.name}
            </h3>
          </div>
          
          {statusChip && (
            <span 
              className="flex-shrink-0 px-2.5 py-0.5 text-[10px] font-medium rounded-full"
              style={{ background: statusChip.bg, color: statusChip.color }}
            >
              {statusChip.label}
            </span>
          )}
        </div>

        {/* Date range row */}
        <p 
          className="text-[12px] flex items-center gap-1.5 mb-2"
          style={{ color: 'rgba(100, 116, 139, 0.8)' }}
        >
          <Flag className="w-3.5 h-3.5" />
          {formatDateRange(trip.startDate, trip.endDate)}
        </p>

        {/* Bottom row - Participant + games count meta */}
        <div 
          className="flex items-center gap-3 text-[12px] pt-1"
          style={{ color: 'rgba(100, 116, 139, 0.7)' }}
        >
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {trip.participantCount} going
          </span>
          <span>·</span>
          <span>{trip.gamesCount} round{trip.gamesCount !== 1 ? 's' : ''}</span>
        </div>
      </motion.button>
    );
  }

  // Row variant - matches GameCard row exactly
  return (
    <button
      onClick={onTap}
      className="w-full px-3.5 py-3 rounded-[16px] text-left transition-all duration-150 active:scale-[0.99]"
      style={{
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)',
      }}
    >
      {/* Row 1: Trip name + Status chip */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <span 
          className="text-[14px] font-semibold truncate flex-1"
          style={{ color: '#1e293b' }}
        >
          {trip.name}
        </span>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {statusChip && (
            <span 
              className="px-2 py-0.5 text-[10px] font-medium rounded-full"
              style={{ background: statusChip.bg, color: statusChip.color }}
            >
              {statusChip.label}
            </span>
          )}
        </div>
      </div>

      {/* Row 2: Date range */}
      <div 
        className="text-[12px] mb-2"
        style={{ color: 'rgba(100, 116, 139, 0.7)' }}
      >
        {formatDateRange(trip.startDate, trip.endDate)}
      </div>

      {/* Row 3: Participant + games meta */}
      <div 
        className="flex items-center gap-2 text-[11px]"
        style={{ color: 'rgba(100, 116, 139, 0.6)' }}
      >
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {trip.participantCount} going
        </span>
        <span>·</span>
        <span>{trip.gamesCount} round{trip.gamesCount !== 1 ? 's' : ''}</span>
      </div>
    </button>
  );
}
