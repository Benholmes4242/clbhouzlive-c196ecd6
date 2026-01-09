/**
 * VisibilityChips - Soft chips for visibility selection
 * Selected has subtle elevation, unselected border-only
 */

import React from 'react';
import { motion } from 'framer-motion';
import { haptic } from '@/utils/haptics';
import type { SheetMode, Visibility, GameVisibility, TripVisibility } from './types';

const GAME_OPTIONS: { value: GameVisibility; label: string }[] = [
  { value: 'public', label: 'Public' },
  { value: 'friends', label: 'Friends' },
  { value: 'club', label: 'Club Only' },
  { value: 'private', label: 'Private' },
];

const TRIP_OPTIONS: { value: TripVisibility; label: string }[] = [
  { value: 'invite', label: 'Invite Only' },
  { value: 'friends', label: 'Friends' },
  { value: 'club', label: 'Club Only' },
];

interface VisibilityChipsProps {
  mode: SheetMode;
  visibility: Visibility;
  onVisibilityChange: (visibility: Visibility) => void;
}

export function VisibilityChips({ mode, visibility, onVisibilityChange }: VisibilityChipsProps) {
  const options = mode === 'game' ? GAME_OPTIONS : TRIP_OPTIONS;
  const helperText = mode === 'game' ? 'Who can see this game' : 'Who can see this trip';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      <span 
        className="text-[12px] font-medium mb-2.5 block tracking-wide uppercase"
        style={{ color: '#94a3b8' }}
      >
        Visibility
      </span>
      <div className="flex flex-wrap gap-2">
        {options.map(option => {
          const isSelected = visibility === option.value;
          return (
            <motion.button
              key={option.value}
              onClick={() => {
                haptic('light');
                onVisibilityChange(option.value);
              }}
              whileTap={{ scale: 0.96 }}
              className="px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all"
              style={{
                background: isSelected 
                  ? '#FFFFFF' 
                  : 'transparent',
                border: isSelected
                  ? '1px solid rgba(0, 0, 0, 0.08)'
                  : '1px solid rgba(0, 0, 0, 0.08)',
                color: isSelected 
                  ? '#1e293b' 
                  : '#64748b',
                boxShadow: isSelected
                  ? '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)'
                  : 'none',
              }}
            >
              {option.label}
            </motion.button>
          );
        })}
      </div>
      <p 
        className="text-[11px] mt-2"
        style={{ color: '#94a3b8' }}
      >
        {helperText}
      </p>
    </motion.div>
  );
}
