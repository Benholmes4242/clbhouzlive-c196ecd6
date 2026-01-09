/**
 * RsvpStrip - RSVP status strip for game headers
 * 
 * Shows current user's RSVP status with action buttons
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Check, HelpCircle, X, Users } from 'lucide-react';
import { haptic } from '@/utils/haptics';
import type { RsvpStatus, RsvpCounts } from '../../hooks/useGameRsvp';

interface RsvpStripProps {
  currentStatus: RsvpStatus | null;
  counts: RsvpCounts;
  isHost: boolean;
  isUpdating: boolean;
  onStatusChange: (status: RsvpStatus) => void;
}

const RSVP_OPTIONS: { status: RsvpStatus; label: string; icon: React.ReactNode; activeColor: string; activeBg: string }[] = [
  { 
    status: 'going', 
    label: 'Going', 
    icon: <Check className="w-4 h-4" />,
    activeColor: 'rgba(34, 197, 94, 0.9)',
    activeBg: 'rgba(34, 197, 94, 0.12)',
  },
  { 
    status: 'maybe', 
    label: 'Maybe', 
    icon: <HelpCircle className="w-4 h-4" />,
    activeColor: 'rgba(234, 179, 8, 0.9)',
    activeBg: 'rgba(234, 179, 8, 0.12)',
  },
  { 
    status: 'declined', 
    label: "Can't go", 
    icon: <X className="w-4 h-4" />,
    activeColor: 'rgba(239, 68, 68, 0.8)',
    activeBg: 'rgba(239, 68, 68, 0.1)',
  },
];

export function RsvpStrip({ currentStatus, counts, isHost, isUpdating, onStatusChange }: RsvpStripProps) {
  const handleTap = (status: RsvpStatus) => {
    if (isUpdating) return;
    haptic('light');
    onStatusChange(status);
  };

  return (
    <div className="space-y-3">
      {/* Counts summary */}
      <div 
        className="flex items-center gap-2 text-[12px]"
        style={{ color: 'rgba(30, 41, 59, 0.6)' }}
      >
        <Users className="w-3.5 h-3.5" />
        <span>
          {counts.going} going
          {counts.maybe > 0 && ` · ${counts.maybe} maybe`}
          {counts.invited > 0 && ` · ${counts.invited} invited`}
        </span>
      </div>

      {/* RSVP buttons */}
      <div className="flex gap-2">
        {RSVP_OPTIONS.map(option => {
          const isActive = currentStatus === option.status || (isHost && option.status === 'going');
          const isDisabled = isHost && option.status !== 'going'; // Host can't change from going
          
          return (
            <motion.button
              key={option.status}
              onClick={() => !isDisabled && handleTap(option.status)}
              disabled={isUpdating || isDisabled}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-[10px] text-[13px] font-medium transition-all duration-150 disabled:opacity-50"
              style={{
                background: isActive ? option.activeBg : 'rgba(0, 0, 0, 0.04)',
                color: isActive ? option.activeColor : 'rgba(30, 41, 59, 0.55)',
                border: `1px solid ${isActive ? option.activeColor.replace('0.9', '0.2').replace('0.8', '0.15') : 'rgba(0, 0, 0, 0.06)'}`,
              }}
              whileTap={!isDisabled ? { scale: 0.97 } : undefined}
            >
              {option.icon}
              {option.label}
            </motion.button>
          );
        })}
      </div>

      {/* Host indicator */}
      {isHost && (
        <p 
          className="text-[11px] text-center"
          style={{ color: 'rgba(30, 41, 59, 0.45)' }}
        >
          You're hosting this game
        </p>
      )}
    </div>
  );
}

/**
 * RsvpPill - Compact RSVP pill for cards
 */
interface RsvpPillProps {
  status: RsvpStatus | null;
  size?: 'sm' | 'md';
}

export function RsvpPill({ status, size = 'sm' }: RsvpPillProps) {
  if (!status) return null;

  const config: Record<RsvpStatus, { label: string; bg: string; color: string }> = {
    going: { 
      label: 'Going', 
      bg: 'rgba(34, 197, 94, 0.12)', 
      color: 'rgba(34, 197, 94, 0.9)' 
    },
    maybe: { 
      label: 'Maybe', 
      bg: 'rgba(234, 179, 8, 0.12)', 
      color: 'rgba(180, 140, 8, 0.9)' 
    },
    declined: { 
      label: "Can't go", 
      bg: 'rgba(239, 68, 68, 0.1)', 
      color: 'rgba(220, 60, 60, 0.85)' 
    },
    invited: { 
      label: 'Invited', 
      bg: 'rgba(59, 130, 246, 0.1)', 
      color: 'rgba(37, 99, 235, 0.8)' 
    },
  };

  const { label, bg, color } = config[status];
  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-[11px] px-2 py-1';

  return (
    <span 
      className={`inline-flex items-center font-medium rounded-full ${sizeClasses}`}
      style={{ background: bg, color }}
    >
      {label}
    </span>
  );
}
