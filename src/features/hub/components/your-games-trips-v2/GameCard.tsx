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

function getStatusChip(status: string): { label: string; bg: string; color: string } | null {
  switch (status) {
    case 'live':
      return { label: 'Live', bg: 'rgba(239, 68, 68, 0.1)', color: 'rgba(220, 38, 38, 0.85)' };
    case 'scheduled':
      return { label: 'Scheduled', bg: 'rgba(59, 130, 246, 0.08)', color: 'rgba(37, 99, 235, 0.75)' };
    case 'completed':
      return { label: 'Completed', bg: 'rgba(100, 116, 139, 0.08)', color: 'rgba(71, 85, 105, 0.75)' };
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
              className="flex-shrink-0 px-2.5 py-0.5 text-[10px] font-medium rounded-full"
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
      className="w-full px-3.5 py-3 rounded-[16px] text-left transition-all duration-150 active:scale-[0.99]"
      style={{
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)',
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
              className="px-2 py-0.5 text-[10px] font-medium rounded-full"
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
