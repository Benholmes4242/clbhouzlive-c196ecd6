/**
 * StickyTodayPill - Floating "Today · Day N" indicator
 * Shows when user scrolls away from today's section
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StickyTodayPillProps {
  visible: boolean;
  dayNumber?: number;
  onClick?: () => void;
}

export function StickyTodayPill({ visible, dayNumber, onClick }: StickyTodayPillProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClick}
          className="fixed bottom-24 right-4 z-50 px-3 py-1.5 rounded-full text-[12px] font-medium text-foreground shadow-lg"
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
          }}
        >
          Today{dayNumber ? ` · Day ${dayNumber}` : ''}
        </motion.button>
      )}
    </AnimatePresence>
  );
}
