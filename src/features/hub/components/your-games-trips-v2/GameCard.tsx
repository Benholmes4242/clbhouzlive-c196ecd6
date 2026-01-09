/**
 * GameCard - Card for displaying game info
 * Used for both "Next Up" hero card and list rows
 */

import React from 'react';
import { format, isToday, isTomorrow } from 'date-fns';
import { Bell, MoreHorizontal, Users, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import type { UserGame } from '../../hooks/useUserGamesTrips';
import type { RsvpStatus } from './types';

interface GameCardProps {
  game: UserGame;
  variant: 'hero' | 'row';
  onTap: () => void;
  onKebabTap?: (e: React.MouseEvent) => void;
}

function formatGameDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return `Today at ${format(date, 'h:mm a')}`;
  if (isTomorrow(date)) return `Tomorrow at ${format(date, 'h:mm a')}`;
  return format(date, 'EEE, MMM d · h:mm a');
}

function getRsvpLabel(rsvp: RsvpStatus | null): string {
  switch (rsvp) {
    case 'going': return 'Going';
    case 'maybe': return 'Maybe';
    case 'declined': return 'Declined';
    case 'invited': return 'Invited';
    default: return '';
  }
}

function getRsvpColor(rsvp: RsvpStatus | null): string {
  switch (rsvp) {
    case 'going': return 'rgba(34, 197, 94, 0.85)';
    case 'maybe': return 'rgba(234, 179, 8, 0.85)';
    case 'declined': return 'rgba(239, 68, 68, 0.7)';
    case 'invited': return 'rgba(59, 130, 246, 0.75)';
    default: return 'rgba(100, 116, 139, 0.6)';
  }
}

function getStatusChip(status: string): { label: string; bg: string; color: string } | null {
  switch (status) {
    case 'live':
      return { label: 'Live', bg: 'rgba(239, 68, 68, 0.12)', color: 'rgba(220, 38, 38, 0.9)' };
    case 'scheduled':
      return { label: 'Scheduled', bg: 'rgba(59, 130, 246, 0.1)', color: 'rgba(37, 99, 235, 0.8)' };
    default:
      return null;
  }
}

export function GameCard({ game, variant, onTap, onKebabTap }: GameCardProps) {
  const statusChip = getStatusChip(game.status);
  const rsvpLabel = getRsvpLabel(game.currentUserRsvp);

  if (variant === 'hero') {
    return (
      <motion.button
        onClick={onTap}
        className="w-full text-left rounded-[20px] p-4 transition-all duration-150 active:scale-[0.99]"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 
              className="text-[16px] font-semibold truncate leading-tight"
              style={{ color: '#1e293b' }}
            >
              {game.courseName}
            </h3>
            <p 
              className="text-[13px] mt-0.5 flex items-center gap-1.5"
              style={{ color: 'rgba(30, 41, 59, 0.6)' }}
            >
              <Clock className="w-3.5 h-3.5" />
              {formatGameDate(game.startsAt)}
            </p>
          </div>
          
          {statusChip && (
            <span 
              className="flex-shrink-0 px-2.5 py-1 text-[11px] font-medium rounded-full"
              style={{ background: statusChip.bg, color: statusChip.color }}
            >
              {statusChip.label}
            </span>
          )}
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* RSVP status */}
            {rsvpLabel && (
              <span 
                className="text-[12px] font-medium"
                style={{ color: getRsvpColor(game.currentUserRsvp) }}
              >
                You: {rsvpLabel}
              </span>
            )}
            
            {/* Attendance summary */}
            <span 
              className="flex items-center gap-1 text-[12px]"
              style={{ color: 'rgba(30, 41, 59, 0.5)' }}
            >
              <Users className="w-3.5 h-3.5" />
              {game.goingCount} going
              {game.maybeCount > 0 && ` · ${game.maybeCount} maybe`}
            </span>
          </div>

          {/* Reminder bell */}
          {game.remindersEnabled && (
            <Bell 
              className="w-4 h-4"
              style={{ color: 'rgba(234, 179, 8, 0.7)' }}
            />
          )}
        </div>
      </motion.button>
    );
  }

  // Row variant
  return (
    <button
      onClick={onTap}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[14px] text-left transition-all duration-150 active:scale-[0.99] active:opacity-90"
      style={{
        background: 'rgba(255, 255, 255, 0.75)',
        border: '1px solid rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span 
            className="text-[14px] font-medium truncate"
            style={{ color: '#1e293b' }}
          >
            {game.courseName}
          </span>
          {statusChip && (
            <span 
              className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded-full"
              style={{ background: statusChip.bg, color: statusChip.color }}
            >
              {statusChip.label}
            </span>
          )}
        </div>
        <div 
          className="text-[12px] mt-0.5 flex items-center gap-2"
          style={{ color: 'rgba(30, 41, 59, 0.55)' }}
        >
          <span>{formatGameDate(game.startsAt)}</span>
          {rsvpLabel && (
            <>
              <span>·</span>
              <span style={{ color: getRsvpColor(game.currentUserRsvp) }}>{rsvpLabel}</span>
            </>
          )}
        </div>
      </div>

      {/* Reminder icon */}
      {game.remindersEnabled && (
        <Bell 
          className="flex-shrink-0 w-3.5 h-3.5"
          style={{ color: 'rgba(234, 179, 8, 0.6)' }}
        />
      )}

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
