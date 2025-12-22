import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SlidingPanelsContext } from './SlidingPanelsContext';

type Key = string;

// Max time to wait for animation to complete before forcing isAnimating=false
const MAX_ANIMATION_DURATION_MS = 800;

export interface SlidingPanelsProps<T extends Key = string> {
  activeKey: T;
  order?: readonly T[];
  children: (key: T) => React.ReactNode;
  onTransitionStart?: () => void;
  onTransitionEnd?: () => void;
}

export default function SlidingPanels<T extends Key = string>({
  activeKey,
  children,
  onTransitionStart,
  onTransitionEnd,
}: SlidingPanelsProps<T>) {
  const [isAnimating, setIsAnimating] = useState(false);
  const prevKeyRef = useRef<T>(activeKey);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect key change and start transition
  useEffect(() => {
    if (activeKey !== prevKeyRef.current) {
      // Key changed - start transition
      setIsAnimating(true);
      onTransitionStart?.();
      
      // Safety timeout: force isAnimating=false if onAnimationComplete doesn't fire
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setIsAnimating(false);
        onTransitionEnd?.();
        if (import.meta.env.DEV) {
          console.log('[SlidingPanels] Safety timeout forced isAnimating=false');
        }
      }, MAX_ANIMATION_DURATION_MS);
      
      prevKeyRef.current = activeKey;
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [activeKey, onTransitionStart, onTransitionEnd]);

  const handleAnimationComplete = useCallback(() => {
    setIsAnimating(false);
    onTransitionEnd?.();
    
    // Clear safety timeout since animation completed normally
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [onTransitionEnd]);

  const contextValue = useMemo(() => ({ isAnimating }), [isAnimating]);

  return (
    <SlidingPanelsContext.Provider value={contextValue}>
      <div style={{ position: 'relative', minHeight: '1px' }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={String(activeKey)}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
            style={{ position: 'relative' }}
            onAnimationComplete={handleAnimationComplete}
          >
            {children(activeKey)}
          </motion.div>
        </AnimatePresence>
      </div>
    </SlidingPanelsContext.Provider>
  );
}
