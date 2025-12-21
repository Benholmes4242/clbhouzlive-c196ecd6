import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type Key = string;

/**
 * SlidingPanels - Tab panel switcher with fade animation
 * 
 * IMPORTANT: Uses fade-only animation (no x/y transforms) to ensure
 * IntersectionObserver works reliably in iOS WKWebView/Capacitor.
 * Transform-based animations can break IO visibility calculations.
 */
export default function SlidingPanels<T extends Key = string>({
  activeKey,
  children,
}: {
  activeKey: T;
  order?: readonly T[];
  children: (key: T) => React.ReactNode;
}) {
  return (
    <div style={{ position: 'relative', minHeight: '1px' }}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={String(activeKey)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          style={{ position: 'relative' }}
        >
          {children(activeKey)}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
