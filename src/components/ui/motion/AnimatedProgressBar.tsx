/**
 * AnimatedProgressBar - Premium progress bar with smooth fill animation
 * 
 * Features:
 * - Starts at previous width (or 80% of final)
 * - Fills smoothly to final width
 * - Number updates in sync
 * - Only animates once per mount (no re-animation on re-renders)
 * 
 * Motion spec:
 * - Duration: 700-900ms
 * - Easing: cubic-bezier(0.2, 0.8, 0.2, 1)
 * - Delay: 100ms after container mounts
 */
import { useEffect, useRef, useState, memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedProgressBarProps {
  /** Progress percentage (0-100) */
  percentage: number;
  /** Is data still loading */
  isLoading?: boolean;
  /** Height class (e.g., 'h-1.5', 'h-2') */
  height?: string;
  /** Background color class */
  bgColor?: string;
  /** Fill color class */
  fillColor?: string;
  /** Additional container classes */
  className?: string;
  /** Animation delay in seconds */
  delay?: number;
  /** Show percentage label */
  showLabel?: boolean;
  /** Label position */
  labelPosition?: 'right' | 'inside';
}

export const AnimatedProgressBar = memo<AnimatedProgressBarProps>(({
  percentage,
  isLoading = false,
  height = 'h-1.5',
  bgColor = 'bg-slate-200/70',
  fillColor = 'bg-slate-500',
  className = '',
  delay = 0.1,
  showLabel = false,
  labelPosition = 'right',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [hasAnimated, setHasAnimated] = useState(false);
  const prevPercentageRef = useRef<number>(0);

  // Clamp percentage to valid range
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  useEffect(() => {
    if (!isLoading && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [isLoading, hasAnimated]);

  // Calculate start width for animation
  const getStartWidth = () => {
    if (prefersReducedMotion) return clampedPercentage;
    if (prevPercentageRef.current > 0) {
      return prevPercentageRef.current;
    }
    // Start from 80% of final value (not 0)
    return clampedPercentage > 0 ? Math.max(0, clampedPercentage * 0.8) : 0;
  };

  // Update previous value after animation
  useEffect(() => {
    if (hasAnimated) {
      prevPercentageRef.current = clampedPercentage;
    }
  }, [clampedPercentage, hasAnimated]);

  const targetWidth = hasAnimated ? clampedPercentage : 0;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex-1 rounded-full overflow-hidden', height, bgColor)}>
        <motion.div
          className={cn('h-full rounded-full', fillColor)}
          initial={{ width: `${getStartWidth()}%` }}
          animate={{ width: `${targetWidth}%` }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.8,
            ease: [0.2, 0.8, 0.2, 1],
            delay: prefersReducedMotion ? 0 : delay,
          }}
        />
      </div>
      {showLabel && labelPosition === 'right' && (
        <motion.span
          className="text-xs font-medium tabular-nums min-w-[3ch] text-right text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: delay + 0.2 }}
        >
          {Math.round(clampedPercentage)}%
        </motion.span>
      )}
    </div>
  );
});

AnimatedProgressBar.displayName = 'AnimatedProgressBar';

export default AnimatedProgressBar;
