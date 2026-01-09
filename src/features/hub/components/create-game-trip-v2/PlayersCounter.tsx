/**
 * PlayersCounter - Non-interactive row showing player count
 * Creator counts as 1, right-aligned, smaller font, muted
 */

import React from 'react';
import { motion } from 'framer-motion';

interface PlayersCounterProps {
  current: number; // Including creator
  max: number;
}

export function PlayersCounter({ current, max }: PlayersCounterProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="flex items-center justify-end py-1"
    >
      <div 
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
        style={{ background: 'rgba(0, 0, 0, 0.03)' }}
      >
        <span 
          className="text-[12px]"
          style={{ color: '#94a3b8' }}
        >
          Players
        </span>
        <span 
          className="text-[13px] font-semibold"
          style={{ color: '#64748b' }}
        >
          {current}
        </span>
        <span 
          className="text-[13px]"
          style={{ color: '#94a3b8' }}
        >
          / {max}
        </span>
      </div>
    </motion.div>
  );
}
