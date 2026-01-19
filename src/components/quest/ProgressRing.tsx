/**
 * ProgressRing - Circular progress indicator for achievements
 * 
 * SVG-based circular progress ring with:
 * - Smooth stroke animation on mount
 * - Tier-colored fill from MILESTONE_THEMES
 * - Center text showing current/target
 * - Responsive sizing
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ProgressRingProps {
  /** Current progress value */
  current: number;
  /** Target value for completion */
  target: number;
  /** Display label (e.g., tier name) */
  label?: string;
  /** Accent color for the progress fill */
  color?: string;
  /** Ring diameter in pixels */
  size?: number;
  /** Stroke width in pixels */
  strokeWidth?: number;
  /** Enable mount animation */
  animated?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Show percentage instead of fraction */
  showPercentage?: boolean;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  current,
  target,
  label,
  color = '#6e9277',
  size = 120,
  strokeWidth = 8,
  animated = true,
  className,
  showPercentage = false,
}) => {
  // Calculate progress percentage (capped at 100%)
  const progress = useMemo(() => {
    if (target <= 0) return 0;
    return Math.min(100, (current / target) * 100);
  }, [current, target]);

  // SVG calculations
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Track and fill colors
  const trackColor = 'hsl(var(--muted))';
  const isComplete = current >= target;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        style={{ overflow: 'visible' }}
      >
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
          className="opacity-30"
        />
        
        {/* Progress fill */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: animated ? circumference : strokeDashoffset }}
          animate={{ strokeDashoffset }}
          transition={{ 
            duration: animated ? 0.8 : 0, 
            ease: 'easeOut',
            delay: animated ? 0.2 : 0,
          }}
          style={{
            filter: isComplete ? `drop-shadow(0 0 6px ${color}40)` : undefined,
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* Progress value */}
        <motion.div
          className="flex items-baseline gap-0.5"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: animated ? 0.4 : 0, duration: 0.3 }}
        >
          {showPercentage ? (
            <span 
              className="text-2xl font-bold"
              style={{ color }}
            >
              {Math.round(progress)}%
            </span>
          ) : (
            <>
              <span 
                className="text-2xl font-bold"
                style={{ color }}
              >
                {current}
              </span>
              <span className="text-sm text-muted-foreground font-medium">
                /{target}
              </span>
            </>
          )}
        </motion.div>

        {/* Label */}
        {label && (
          <motion.span
            className="text-xs text-muted-foreground font-medium mt-0.5 text-center px-2 truncate max-w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: animated ? 0.5 : 0, duration: 0.3 }}
          >
            {label}
          </motion.span>
        )}
      </div>
    </div>
  );
};

export default ProgressRing;
