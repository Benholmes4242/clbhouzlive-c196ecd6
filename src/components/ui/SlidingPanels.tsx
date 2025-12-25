import React, { useState, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SlidingPanelsContext } from './SlidingPanelsContext';

type Key = string;

export default function SlidingPanels<T extends Key = string>({
  activeKey,
  children,
}: {
  activeKey: T;
  order?: readonly T[];
  children: (key: T) => React.ReactNode;
}) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleAnimationStart = useCallback(() => {
    setIsAnimating(true);
  }, []);

  const handleAnimationComplete = useCallback(() => {
    setIsAnimating(false);
  }, []);

  const contextValue = useMemo(() => ({ isAnimating }), [isAnimating]);

  return (
    <SlidingPanelsContext.Provider value={contextValue}>
      <div style={{ position: 'relative', minHeight: '1px' }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={String(activeKey)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{ position: 'relative' }}
            onAnimationStart={handleAnimationStart}
            onAnimationComplete={handleAnimationComplete}
          >
            {children(activeKey)}
          </motion.div>
        </AnimatePresence>
      </div>
    </SlidingPanelsContext.Provider>
  );
}
