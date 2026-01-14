/**
 * VisibilityChips - Premium soft chips for visibility selection
 * Selected chip has subtle elevation, refined transitions
 */

import React from 'react';
import { motion } from 'framer-motion';
import { haptic } from '@/utils/haptics';
import type { SheetMode, Visibility, GameVisibility, TripVisibility } from './types';

const GAME_OPTIONS: { value: GameVisibility; label: string; icon: string }[] = [
  { value: 'public', label: 'Public', icon: '🌍' },
  { value: 'friends', label: 'Friends', icon: '👥' },
  { value: 'club', label: 'Club Only', icon: '🏌️' },
  { value: 'private', label: 'Private', icon: '🔒' },
];

const TRIP_OPTIONS: { value: TripVisibility; label: string; icon: string }[] = [
  { value: 'invite', label: 'Invite Only', icon: '✉️' },
  { value: 'friends', label: 'Friends', icon: '👥' },
  { value: 'club', label: 'Club Only', icon: '🏌️' },
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
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <span 
        className="text-[11px] font-semibold mb-2.5 block tracking-[0.05em] uppercase"
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
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150"
              style={{
                background: isSelected 
                  ? '#FFFFFF' 
                  : 'transparent',
                border: isSelected
                  ? '1px solid rgba(0, 0, 0, 0.06)'
                  : '1px solid rgba(0, 0, 0, 0.08)',
                color: isSelected 
                  ? '#1e293b' 
                  : '#64748b',
                boxShadow: isSelected
                  ? '0 1px 3px rgba(0, 0, 0, 0.04), 0 2px 8px rgba(0, 0, 0, 0.02)'
                  : 'none',
              }}
            >
              {option.label}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
