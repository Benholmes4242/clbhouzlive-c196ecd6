/**
 * PlayersCounter - Non-interactive row showing player count
 * Creator counts as 1
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="flex items-center justify-between py-1"
    >
      <span 
        className="text-[13px]"
        style={{ color: 'var(--hub-text-sub)' }}
      >
        Players
      </span>
      <div 
        className="flex items-center gap-1 px-3 py-1.5 rounded-full"
        style={{ background: 'rgba(0, 0, 0, 0.04)' }}
      >
        <span 
          className="text-[14px] font-semibold"
          style={{ color: 'var(--hub-text)' }}
        >
          {current}
        </span>
        <span 
          className="text-[14px]"
          style={{ color: 'var(--hub-text-dim)' }}
        >
          / {max}
        </span>
      </div>
    </motion.div>
  );
}
