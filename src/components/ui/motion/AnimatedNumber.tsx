/**
 * AnimatedNumber - Premium count-up animation for numeric values
 * 
 * Features:
 * - Counts from previous value (or 85% of value if no previous)
 * - Fade + slide animation
 * - tabular-nums for layout stability
 * - Never animates 0 values with count-up (opacity only)
 * 
 * Motion spec:
 * - Duration: 450-600ms
 * - Easing: ease-out
 * - Delay: 40-80ms stagger allowed
 */
import { useEffect, useRef, useState, memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedNumberProps {
  value: number | null | undefined;
  isLoading?: boolean;
  minCh?: number;
  className?: string;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  delay?: number;
  duration?: number;
  /** Skip count-up, only fade/slide */
  skipCountUp?: boolean;
}

export const AnimatedNumber = memo<AnimatedNumberProps>(({
  value,
  isLoading = false,
  minCh = 2,
  className = '',
  placeholder = '—',
  prefix = '',
  suffix = '',
  delay = 0,
  duration = 0.5,
  skipCountUp = false,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const prevValueRef = useRef<number | null>(null);
  const [displayValue, setDisplayValue] = useState<number | null>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Determine the actual numeric value
  const numericValue = value ?? 0;

  useEffect(() => {
    if (isLoading || value === null || value === undefined) {
      return;
    }

    // If reduced motion, just set value immediately
    if (prefersReducedMotion) {
      setDisplayValue(numericValue);
      setHasAnimated(true);
      prevValueRef.current = numericValue;
      return;
    }

    // Determine start value for count-up
    let startValue: number;
    if (prevValueRef.current !== null && prevValueRef.current !== numericValue) {
      // Animate from previous value (delta animation)
      startValue = prevValueRef.current;
    } else if (!hasAnimated) {
      // First animation: start from 85% of value (not 0)
      startValue = numericValue === 0 ? 0 : Math.round(numericValue * 0.85);
    } else {
      // No change, no animation needed
      setDisplayValue(numericValue);
      prevValueRef.current = numericValue;
      return;
    }

    // Skip count-up if value is 0 or skipCountUp is true
    if (numericValue === 0 || skipCountUp) {
      setDisplayValue(numericValue);
      setHasAnimated(true);
      prevValueRef.current = numericValue;
      return;
    }

    // Animate count-up
    const durationMs = duration * 1000;
    const startTime = performance.now();
    const diff = numericValue - startValue;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + diff * eased);
      
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(numericValue);
        setHasAnimated(true);
        prevValueRef.current = numericValue;
      }
    };

    // Start animation after delay
    const timeoutId = setTimeout(() => {
      requestAnimationFrame(animate);
    }, delay * 1000);

    return () => clearTimeout(timeoutId);
  }, [value, isLoading, numericValue, delay, duration, prefersReducedMotion, hasAnimated, skipCountUp]);

  // Display content
  const display = isLoading 
    ? placeholder 
    : `${prefix}${displayValue ?? numericValue}${suffix}`;

  return (
    <motion.span
      className={cn(
        'tabular-nums inline-block',
        className
      )}
      style={{ minWidth: `${minCh}ch` }}
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.35, 
        ease: [0.25, 0.1, 0.25, 1],
        delay: delay,
      }}
      key={isLoading ? 'loading' : 'value'}
    >
      {display}
    </motion.span>
  );
});

AnimatedNumber.displayName = 'AnimatedNumber';

export default AnimatedNumber;
