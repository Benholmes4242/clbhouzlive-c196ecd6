/**
 * AnimatedProgressRing - Premium circular progress with smooth stroke animation
 * 
 * Features:
 * - Stroke-dasharray animates smoothly
 * - Percentage text animates slightly later
 * - Ring never snaps
 * - Only animates once per mount
 * 
 * Motion spec:
 * - Duration: 900ms
 * - Easing: ease-out
 * - Text delay: 150ms after ring
 */
import { useEffect, useState, useRef, memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedProgressRingProps {
  /** Number of completed items */
  completed: number;
  /** Total number of items */
  total: number;
  /** Ring size in pixels */
  size?: number;
  /** Stroke width in pixels */
  strokeWidth?: number;
  /** Track color (unfilled portion) */
  trackColor?: string;
  /** Progress color (filled portion) */
  progressColor?: string;
  /** Show completion glow effect */
  showGlow?: boolean;
  /** Additional container classes */
  className?: string;
  /** Text shown below the count */
  bottomText?: string;
  /** Animation delay in seconds */
  delay?: number;
}

export const AnimatedProgressRing = memo<AnimatedProgressRingProps>(({
  completed,
  total,
  size = 120,
  strokeWidth = 8,
  trackColor = '#E5E7EB',
  progressColor = '#22c55e',
  showGlow = true,
  className = '',
  bottomText = 'completed',
  delay = 0,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [hasAnimated, setHasAnimated] = useState(false);
  const [displayCount, setDisplayCount] = useState(0);
  const prevCompletedRef = useRef(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = total > 0 ? Math.min(100, (completed / total) * 100) : 0;
  
  // Calculate stroke offset (0 = full, circumference = empty)
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Start offset for animation
  const getStartOffset = () => {
    if (prefersReducedMotion) return strokeDashoffset;
    if (prevCompletedRef.current > 0) {
      const prevPercentage = total > 0 ? (prevCompletedRef.current / total) * 100 : 0;
      return circumference - (prevPercentage / 100) * circumference;
    }
    // Start from 80% of current progress
    const startPercentage = percentage * 0.8;
    return circumference - (startPercentage / 100) * circumference;
  };

  useEffect(() => {
    if (!hasAnimated) {
      setHasAnimated(true);
    }
  }, [hasAnimated]);

  // Animate count-up for the number
  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayCount(completed);
      prevCompletedRef.current = completed;
      return;
    }

    const startValue = prevCompletedRef.current > 0 
      ? prevCompletedRef.current 
      : Math.round(completed * 0.85);
    
    if (completed === 0) {
      setDisplayCount(0);
      prevCompletedRef.current = 0;
      return;
    }

    const duration = 600; // ms
    const startTime = performance.now();
    const diff = completed - startValue;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + diff * eased);
      
      setDisplayCount(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayCount(completed);
        prevCompletedRef.current = completed;
      }
    };

    // Start after ring animation begins
    const timeoutId = setTimeout(() => {
      requestAnimationFrame(animate);
    }, (delay + 0.15) * 1000);

    return () => clearTimeout(timeoutId);
  }, [completed, delay, prefersReducedMotion]);

  const isComplete = completed >= total && total > 0;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Animated progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeLinecap="round"
          initial={{ strokeDashoffset: getStartOffset() }}
          animate={{ strokeDashoffset: hasAnimated ? strokeDashoffset : circumference }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.9,
            ease: [0.25, 0.1, 0.25, 1],
            delay: prefersReducedMotion ? 0 : delay,
          }}
          style={{
            filter: showGlow && isComplete
              ? `drop-shadow(0 0 8px ${progressColor}66) drop-shadow(0 0 16px ${progressColor}33)`
              : undefined,
          }}
        />
      </svg>
      
      {/* Center text */}
      <motion.div 
        className="absolute inset-0 flex flex-col items-center justify-center"
        initial={{ opacity: 0, y: 2 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.35,
          delay: delay + 0.15,
        }}
      >
        <div className="text-sm font-bold text-foreground tabular-nums">
          {displayCount}/{total}
        </div>
        <div className="text-xs text-muted-foreground">
          {bottomText}
        </div>
      </motion.div>
    </div>
  );
});

AnimatedProgressRing.displayName = 'AnimatedProgressRing';

export default AnimatedProgressRing;
