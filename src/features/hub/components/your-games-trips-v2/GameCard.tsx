/**
 * GameCard - V2 Premium game card
 * 
 * V2 Design:
 * - Glass-style card with soft shadow
 * - Three-line structure: Course, Date, RSVP
 * - Subtle hover/tap feedback
 * - No harsh borders
 */

import React from 'react';
import { format, isToday, isTomorrow } from 'date-fns';
import { Bell, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import type { UserGame } from '../../hooks/useUserGamesTrips';
import { GameRsvpSummary } from '../rsvp/GameRsvpSummary';

interface GameCardProps {
  game: UserGame;
  variant: 'hero' | 'row';
  onTap: () => void;
}

function formatGameDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return `Today at ${format(date, 'h:mm a')}`;
  if (isTomorrow(date)) return `Tomorrow at ${format(date, 'h:mm a')}`;
  return format(date, 'EEE, MMM d · h:mm a');
}

function getStatusChip(status: string): { label: string; bg: string; color: string; pulse?: boolean } | null {
  switch (status) {
    case 'live':
      return { label: 'Live', bg: 'rgba(239, 68, 68, 0.12)', color: 'rgba(220, 38, 38, 0.9)', pulse: true };
    case 'scheduled':
      return { label: 'Scheduled', bg: 'rgba(100, 116, 139, 0.08)', color: 'rgba(71, 85, 105, 0.8)' };
    case 'completed':
      return { label: 'Completed', bg: 'rgba(100, 116, 139, 0.06)', color: 'rgba(100, 116, 139, 0.65)' };
    default:
      return null;
  }
}

export function GameCard({ game, variant, onTap }: GameCardProps) {
  const statusChip = getStatusChip(game.status);

  if (variant === 'hero') {
    return (
      <motion.button
        onClick={onTap}
        className="w-full text-left rounded-2xl p-4 transition-all duration-150 active:scale-[0.98]"
        style={{
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          borderLeft: '3px solid rgba(34, 197, 94, 0.5)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06), 0 8px 24px rgba(0, 0, 0, 0.04)',
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header row - Course + Status */}
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="flex-1 min-w-0">
            <h3 
              className="text-[15px] font-semibold truncate leading-tight"
              style={{ color: '#1e293b' }}
            >
              {game.courseName}
            </h3>
          </div>
          
          {statusChip && (
            <span 
              className={`flex-shrink-0 px-2.5 py-0.5 text-[10px] font-semibold rounded-full ${statusChip.pulse ? 'animate-pulse' : ''}`}
              style={{ background: statusChip.bg, color: statusChip.color }}
            >
              {statusChip.label}
            </span>
          )}
        </div>

        {/* Date/time row */}
        <p 
          className="text-[12px] flex items-center gap-1.5 mb-2"
          style={{ color: 'rgba(100, 116, 139, 0.8)' }}
        >
          <Clock className="w-3.5 h-3.5" />
          {formatGameDate(game.startsAt)}
        </p>

        {/* Bottom row - RSVP summary */}
        <div className="flex items-center justify-between pt-1">
          <GameRsvpSummary
            goingCount={game.goingCount}
            maybeCount={game.maybeCount}
            userRsvp={game.currentUserRsvp}
            variant="expanded"
          />

          {/* Reminder bell */}
          {game.remindersEnabled && (
            <Bell 
              className="w-4 h-4"
              style={{ color: 'rgba(234, 179, 8, 0.6)' }}
            />
          )}
        </div>
      </motion.button>
    );
  }

  // Row variant - three-line layout
  return (
    <button
      onClick={onTap}
      className="w-full px-4 py-3.5 rounded-2xl text-left transition-all duration-150 active:scale-[0.98]"
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFBFC 100%)',
        border: '1px solid rgba(0, 0, 0, 0.04)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.02)',
      }}
    >
      {/* Row 1: Course name + Status chip */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <span 
          className="text-[14px] font-semibold truncate flex-1"
          style={{ color: '#1e293b' }}
        >
          {game.courseName}
        </span>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {statusChip && (
            <span 
              className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${statusChip.pulse ? 'animate-pulse' : ''}`}
              style={{ background: statusChip.bg, color: statusChip.color }}
            >
              {statusChip.label}
            </span>
          )}
          
          {/* Reminder icon */}
          {game.remindersEnabled && (
            <Bell 
              className="w-3.5 h-3.5"
              style={{ color: 'rgba(234, 179, 8, 0.5)' }}
            />
          )}
        </div>
      </div>

      {/* Row 2: Date/time */}
      <div 
        className="text-[12px] mb-2"
        style={{ color: 'rgba(100, 116, 139, 0.7)' }}
      >
        {formatGameDate(game.startsAt)}
      </div>

      {/* Row 3: RSVP summary */}
      <GameRsvpSummary
        goingCount={game.goingCount}
        maybeCount={game.maybeCount}
        userRsvp={game.currentUserRsvp}
        variant="compact"
      />
    </button>
  );
}
