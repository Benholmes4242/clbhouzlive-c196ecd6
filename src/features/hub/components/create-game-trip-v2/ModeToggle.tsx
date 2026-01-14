/**
 * ModeToggle - Premium segmented pill toggle for Game/Trip mode
 * Glass container, raised selected state, spring-animated sliding pill
 */

import React from 'react';
import { motion } from 'framer-motion';
import { haptic } from '@/utils/haptics';
import type { SheetMode } from './types';

interface ModeToggleProps {
  mode: SheetMode;
  onModeChange: (mode: SheetMode) => void;
}

export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  const handleChange = (newMode: SheetMode) => {
    if (newMode === mode) return;
    haptic('light');
    onModeChange(newMode);
  };

  return (
    <div
      className="inline-flex rounded-[14px] p-[3px] w-full relative"
      style={{
        background: '#e2e8f0',
      }}
    >
      {/* Sliding indicator with refined shadow */}
      <motion.div
        className="absolute rounded-[11px]"
        style={{
          top: '3px',
          bottom: '3px',
          width: 'calc(50% - 3px)',
          background: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04), inset 0 0.5px 0 rgba(255, 255, 255, 1)',
        }}
        animate={{
          left: mode === 'game' ? '3px' : 'calc(50%)',
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
      />
      
      {(['game', 'trip'] as SheetMode[]).map((m) => (
        <button
          key={m}
          onClick={() => handleChange(m)}
          className="relative z-10 flex-1 px-4 py-2.5 rounded-[11px] text-[14px] font-semibold transition-colors duration-200 capitalize"
          style={{
            color: mode === m ? '#1e293b' : '#64748b',
          }}
        >
          {m}
        </button>
      ))}
    </div>
  );
}
