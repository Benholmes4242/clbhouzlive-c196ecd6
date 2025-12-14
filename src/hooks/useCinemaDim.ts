import { useState, useEffect, useCallback, useRef } from 'react';

const ENTER_DIM_DELAY = 4000; // 4 seconds before dimming
const REVERT_DIM_DELAY = 6000; // 6 seconds after interaction before dimming again

interface CinemaDimState {
  cinemaDim: boolean;
  bumpChrome: () => void;
}

/**
 * Hook to manage Cinema Dim state for Clubhouse
 * - First 4 seconds: standard chrome
 * - After 4 seconds: dims to cinema mode
 * - On interaction: returns to standard for 6 seconds, then dims again
 */
export function useCinemaDim(): CinemaDimState {
  const [cinemaDim, setCinemaDim] = useState(false);
  const enterDimTimerRef = useRef<NodeJS.Timeout | null>(null);
  const revertDimTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (enterDimTimerRef.current) {
      clearTimeout(enterDimTimerRef.current);
      enterDimTimerRef.current = null;
    }
    if (revertDimTimerRef.current) {
      clearTimeout(revertDimTimerRef.current);
      revertDimTimerRef.current = null;
    }
  }, []);

  // Bump chrome back to normal, then dim again after 6s
  const bumpChrome = useCallback(() => {
    setCinemaDim(false);
    clearTimers();
    
    revertDimTimerRef.current = setTimeout(() => {
      setCinemaDim(true);
    }, REVERT_DIM_DELAY);
  }, [clearTimers]);

  // On mount: start 4s timer to enter dim mode
  useEffect(() => {
    setCinemaDim(false);
    
    enterDimTimerRef.current = setTimeout(() => {
      setCinemaDim(true);
    }, ENTER_DIM_DELAY);

    return () => {
      clearTimers();
      setCinemaDim(false);
    };
  }, [clearTimers]);

  return { cinemaDim, bumpChrome };
}
