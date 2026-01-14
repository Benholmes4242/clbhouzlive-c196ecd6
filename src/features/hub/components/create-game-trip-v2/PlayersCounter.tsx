/**
 * PlayersCounter - Refined non-interactive row showing player count
 * Subtle badge styling, clear hierarchy
 */

import React from 'react';
import { motion } from 'framer-motion';

interface PlayersCounterProps {
  current: number; // Including creator
  max: number;
}

export function PlayersCounter({ current, max }: PlayersCounterProps) {
  const isFull = current >= max;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex items-center justify-end py-0.5"
    >
      <div 
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
        style={{ 
          background: isFull ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0, 0, 0, 0.03)',
        }}
      >
        <span 
          className="text-[11px] font-medium"
          style={{ color: '#94a3b8' }}
        >
          Players
        </span>
        <span 
          className="text-[13px] font-bold tabular-nums"
          style={{ color: isFull ? '#059669' : '#64748b' }}
        >
          {current}
        </span>
        <span 
          className="text-[12px]"
          style={{ color: '#94a3b8' }}
        >
          / {max}
        </span>
      </div>
    </motion.div>
  );
}
