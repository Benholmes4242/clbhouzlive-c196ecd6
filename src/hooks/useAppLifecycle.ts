import { useEffect, useRef, useState, useCallback } from 'react';

// Thresholds for rehydration behavior
const REHYDRATION_THRESHOLDS = {
  LIGHT: 30_000,      // 30 seconds - refresh feeds only
  FULL: 5 * 60_000,   // 5 minutes - full rehydration + auth check
} as const;

export type RehydrationLevel = 'none' | 'light' | 'full';

export interface AppLifecycleState {
  isRehydrating: boolean;
  rehydrationLevel: RehydrationLevel;
  lastBackgroundDuration: number | null;
}

export function useAppLifecycle() {
  const [state, setState] = useState<AppLifecycleState>({
    isRehydrating: false,
    rehydrationLevel: 'none',
    lastBackgroundDuration: null,
  });

  const backgroundTimeRef = useRef<number | null>(null);
  const isRehydratingRef = useRef(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      // Going to background
      if (document.hidden) {
        backgroundTimeRef.current = Date.now();
        console.log('[AppLifecycle] App backgrounded at', new Date().toISOString());
      } 
      // Returning to foreground
      else if (backgroundTimeRef.current && !isRehydratingRef.current) {
        const backgroundDuration = Date.now() - backgroundTimeRef.current;
        console.log('[AppLifecycle] App foregrounded after', backgroundDuration, 'ms');

        // Force repaint to fix iOS compositing artifacts (grey safe area)
        requestAnimationFrame(() => {
          const root = document.getElementById('root');
          if (root) {
            root.style.transform = 'translateZ(0)';
            requestAnimationFrame(() => {
              root.style.transform = '';
            });
          }
        });

        // Determine rehydration level
        let level: RehydrationLevel = 'none';
        
        if (backgroundDuration >= REHYDRATION_THRESHOLDS.FULL) {
          level = 'full';
          console.log('[AppLifecycle] Triggering FULL rehydration (>5min background)');
        } else if (backgroundDuration >= REHYDRATION_THRESHOLDS.LIGHT) {
          level = 'light';
          console.log('[AppLifecycle] Triggering LIGHT rehydration (>30sec background)');
        } else {
          console.log('[AppLifecycle] No rehydration needed (<30sec background)');
        }

        if (level !== 'none') {
          isRehydratingRef.current = true;
          setState({
            isRehydrating: true,
            rehydrationLevel: level,
            lastBackgroundDuration: backgroundDuration,
          });
        }

        backgroundTimeRef.current = null;
      }
    };

    // Also handle window blur/focus as fallback
    const handleWindowBlur = () => {
      if (!document.hidden && !backgroundTimeRef.current) {
        backgroundTimeRef.current = Date.now();
        console.log('[AppLifecycle] Window blurred at', new Date().toISOString());
      }
    };

    const handleWindowFocus = () => {
      if (!document.hidden && backgroundTimeRef.current && !isRehydratingRef.current) {
        // Trigger same logic as visibility change
        handleVisibilityChange();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  const completeRehydration = useCallback(() => {
    console.log('[AppLifecycle] Rehydration complete');
    isRehydratingRef.current = false;
    setState({
      isRehydrating: false,
      rehydrationLevel: 'none',
      lastBackgroundDuration: null,
    });
  }, []);

  return {
    ...state,
    completeRehydration,
  };
}
