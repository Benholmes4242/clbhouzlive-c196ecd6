/**
 * GameRsvpSummary - Reusable RSVP summary component
 * Shows user's status pill + joined/maybe counts
 * 
 * Used in:
 * - GameCard (hero + row)
 * - TripTimelineCard
 * - Hub games preview
 */

import React from 'react';
import { Users } from 'lucide-react';
import { RsvpPill } from './RsvpStrip';
import { formatRsvpCount } from '@/lib/rsvpLabels';
import type { RsvpStatus } from '../your-games-trips-v2/types';

interface GameRsvpSummaryProps {
  goingCount: number;
  maybeCount?: number;
  invitedCount?: number;
  userRsvp?: RsvpStatus | null;
  variant?: 'compact' | 'expanded';
}

export function GameRsvpSummary({
  goingCount,
  maybeCount = 0,
  invitedCount = 0,
  userRsvp,
  variant = 'compact',
}: GameRsvpSummaryProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* User status pill - only show if they have a status */}
      {userRsvp && (
        <RsvpPill status={userRsvp} size="sm" />
      )}

      {/* Attendance counts */}
      <span 
        className="flex items-center gap-1 text-[11px] font-medium"
        style={{ color: 'rgba(100, 116, 139, 0.65)' }}
      >
        <Users className="w-3.5 h-3.5" />
        {formatRsvpCount(goingCount, 'going')}
        {variant === 'expanded' && maybeCount > 0 && (
          <span className="opacity-85"> · {maybeCount} maybe</span>
        )}
      </span>
    </div>
  );
}
