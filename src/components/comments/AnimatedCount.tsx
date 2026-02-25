/**
 * AnimatedCount — Odometer-style count animation using framer-motion.
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedCountProps {
  count: number;
  className?: string;
}

export const AnimatedCount: React.FC<AnimatedCountProps> = ({ count, className }) => {
  return (
    <span className={className} style={{ display: 'inline-flex', overflow: 'hidden', verticalAlign: 'bottom' }}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={count}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          {count}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};
