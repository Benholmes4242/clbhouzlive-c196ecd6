/**
 * DurationIndicator - Shows video duration, fades after 2 seconds
 * Reappears on pause
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DurationIndicatorProps {
  duration: number; // in seconds
  isPaused?: boolean;
  className?: string;
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  if (mins >= 10) {
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const DurationIndicator: React.FC<DurationIndicatorProps> = ({
  duration,
  isPaused = false,
  className,
}) => {
  const [showOnLoad, setShowOnLoad] = useState(true);

  // Hide after 2 seconds on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowOnLoad(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Reset showOnLoad when duration changes (new video)
  useEffect(() => {
    setShowOnLoad(true);
    const timer = setTimeout(() => {
      setShowOnLoad(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [duration]);

  const isVisible = showOnLoad || isPaused;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.15 }}
          className={cn(
            'absolute top-4 left-4 z-30',
            'px-2 py-1 rounded-md',
            'text-xs font-medium text-white',
            'pointer-events-none',
            className
          )}
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {formatDuration(duration)}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DurationIndicator;
