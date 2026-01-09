/**
 * VisibilityChips - Soft chips for visibility selection
 * Hub style, selected has subtle elevation
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <span 
        className="text-[12px] font-medium mb-2.5 block tracking-wide"
        style={{ color: 'var(--hub-text-dim)' }}
      >
        Visibility
      </span>
      <div className="flex flex-wrap gap-2">
        {options.map(option => {
          const isSelected = visibility === option.value;
          return (
            <button
              key={option.value}
              onClick={() => {
                haptic('light');
                onVisibilityChange(option.value);
              }}
              className="px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all active:scale-[0.96]"
              style={{
                background: isSelected 
                  ? 'rgba(255, 255, 255, 0.98)' 
                  : 'rgba(255, 255, 255, 0.7)',
                border: isSelected
                  ? '1px solid rgba(0, 0, 0, 0.08)'
                  : '1px solid rgba(0, 0, 0, 0.04)',
                color: isSelected 
                  ? 'var(--hub-text)' 
                  : 'var(--hub-text-muted)',
                boxShadow: isSelected
                  ? '0 2px 8px rgba(0, 0, 0, 0.05)'
                  : 'none',
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
