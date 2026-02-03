/**
 * useIntersectionObserver - Visibility detection with optional hysteresis
 * 
 * FIX #8: Added hysteresis support to prevent flicker at threshold boundary.
 * When hysteresis is enabled, uses different thresholds for entering (higher)
 * vs exiting (lower) the viewport, creating a "buffer zone".
 */

import { useEffect, useState, useRef, useCallback } from 'react';

interface UseIntersectionObserverProps {
  /** Primary threshold - used for entering viewport (default: 0.5 = 50%) */
  threshold?: number | number[];
  /** Exit threshold for hysteresis - lower value prevents flicker (default: same as threshold) */
  exitThreshold?: number;
  rootMargin?: string;
  /** Enable hysteresis mode with separate enter/exit thresholds */
  hysteresis?: boolean;
}

export const useIntersectionObserver = ({ 
  threshold = 0.5, 
  exitThreshold = 0.1,
  rootMargin = '0px',
  hysteresis = false,
}: UseIntersectionObserverProps = {}) => {
  const [isInView, setIsInView] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const wasInViewRef = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // For hysteresis mode, we observe at both thresholds
    const thresholds = hysteresis 
      ? [exitThreshold, typeof threshold === 'number' ? threshold : threshold[0]]
      : (Array.isArray(threshold) ? threshold : [threshold]);

    const observer = new IntersectionObserver(
      ([entry]) => {
        const ratio = entry.intersectionRatio;
        const enterThreshold = typeof threshold === 'number' ? threshold : threshold[0];
        
        if (hysteresis) {
          // FIX #8: Hysteresis logic - different thresholds for enter vs exit
          if (!wasInViewRef.current && ratio >= enterThreshold) {
            // Entering: require higher threshold (50%)
            wasInViewRef.current = true;
            setIsInView(true);
          } else if (wasInViewRef.current && ratio < exitThreshold) {
            // Exiting: only exit at lower threshold (10%)
            wasInViewRef.current = false;
            setIsInView(false);
          }
          // In between thresholds: maintain current state (hysteresis buffer)
        } else {
          // Standard mode: simple isIntersecting check
          setIsInView(entry.isIntersecting);
        }
      },
      {
        threshold: thresholds,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
      observer.disconnect();
    };
  }, [threshold, exitThreshold, rootMargin, hysteresis]);

  return { ref: elementRef, isInView };
};
