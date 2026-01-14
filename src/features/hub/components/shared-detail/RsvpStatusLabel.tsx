/**
 * RsvpStatusLabel - Consistent RSVP status badges
 * Used in player lists for both games and trips
 */

import React from 'react';

export type RsvpStatusType = 'going' | 'maybe' | 'declined' | 'invited' | 'requested';

interface RsvpStatusLabelProps {
  status: RsvpStatusType | string | null;
  variant?: 'text' | 'pill';
}

const STATUS_CONFIG: Record<RsvpStatusType, { label: string; color: string; bg: string }> = {
  going: { label: 'Joined', color: '#059669', bg: 'rgba(5, 150, 105, 0.1)' },
  maybe: { label: 'Maybe', color: '#D97706', bg: 'rgba(217, 119, 6, 0.1)' },
  declined: { label: "Can't go", color: '#DC2626', bg: 'rgba(220, 38, 38, 0.1)' },
  invited: { label: 'Invited', color: '#6366F1', bg: 'rgba(99, 102, 241, 0.1)' },
  requested: { label: 'Requested', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
};

export function RsvpStatusLabel({ status, variant = 'text' }: RsvpStatusLabelProps) {
  if (!status) return null;
  
  const config = STATUS_CONFIG[status as RsvpStatusType];
  if (!config) return null;
  
  if (variant === 'pill') {
    return (
      <span
        className="px-2.5 py-1 rounded-full text-[12px] font-semibold"
        style={{ color: config.color, background: config.bg }}
      >
        {config.label}
      </span>
    );
  }
  
  return (
    <span 
      className="text-xs font-medium"
      style={{ color: config.color }}
    >
      {config.label}
    </span>
  );
}
