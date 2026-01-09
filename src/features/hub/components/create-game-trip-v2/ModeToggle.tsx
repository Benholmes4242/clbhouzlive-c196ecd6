/**
 * ModeToggle - Segmented pill toggle for Game/Trip mode
 * Glass container, raised selected state, animated sliding pill
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
      className="inline-flex rounded-2xl p-1 w-full relative"
      style={{
        background: 'rgba(0, 0, 0, 0.05)',
      }}
    >
      {/* Sliding indicator */}
      <motion.div
        className="absolute top-1 bottom-1 rounded-xl"
        style={{
          width: 'calc(50% - 4px)',
          background: '#FFFFFF',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
        }}
        animate={{
          left: mode === 'game' ? '4px' : 'calc(50% + 0px)',
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />
      
      {(['game', 'trip'] as SheetMode[]).map((m) => (
        <button
          key={m}
          onClick={() => handleChange(m)}
          className="relative z-10 flex-1 px-4 py-2.5 rounded-xl text-[14px] font-semibold transition-all duration-200 capitalize"
          style={{
            color: mode === m ? '#1e293b' : 'rgba(100, 116, 139, 0.6)',
          }}
        >
          <motion.span
            animate={{ opacity: mode === m ? 1 : 0.6 }}
            transition={{ duration: 0.15 }}
          >
            {m}
          </motion.span>
        </button>
      ))}
    </div>
  );
}
