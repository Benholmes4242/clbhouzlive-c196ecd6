/**
 * PauseOverlay - Shows play icon and duration when video is paused
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PauseOverlayProps {
  isPaused: boolean;
  duration?: number; // in seconds
  onClick?: () => void;
  className?: string;
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const PauseOverlay: React.FC<PauseOverlayProps> = ({
  isPaused,
  duration,
  onClick,
  className,
}) => {
  return (
    <AnimatePresence>
      {isPaused && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={cn(
            'absolute inset-0 z-20',
            'flex flex-col items-center justify-center',
            'cursor-pointer',
            className
          )}
          onClick={onClick}
        >
          {/* Semi-transparent overlay */}
          <div className="absolute inset-0 bg-black/20" />
          
          {/* Play button */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="relative z-10 w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            <Play className="w-8 h-8 text-white ml-1" fill="white" />
          </motion.div>
          
          {/* Duration indicator */}
          {duration && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ delay: 0.1, duration: 0.15 }}
              className="relative z-10 mt-4 px-3 py-1.5 rounded-full"
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span className="text-sm font-medium text-white">
                {formatDuration(duration)}
              </span>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PauseOverlay;
