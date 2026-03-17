import { useEffect, useRef, useState, useCallback } from 'react';
import { currentShieldColor, applyShieldColor } from './useMedianStatusBar';

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
        if (import.meta.env.DEV) {
          console.log('[AppLifecycle] App backgrounded at', new Date().toISOString());
        }
        return;
      }

      // Returning to foreground
      if (!backgroundTimeRef.current || isRehydratingRef.current) return;

      const backgroundDuration = Date.now() - backgroundTimeRef.current;

      // Step 0: Re-apply current shield color so the repaint uses the correct value
      const color = currentShieldColor ?? 'transparent';
      applyShieldColor(color);
      document.documentElement.style.backgroundColor = color;
      document.body.style.backgroundColor = color;

      // Step 1: Immediately ensure shield is painted (no gap)
      const shield = document.getElementById('safe-area-shield');
      if (shield) {
        // Force the shield to repaint by briefly toggling will-change
        shield.style.willChange = 'transform';
        requestAnimationFrame(() => {
          shield.style.willChange = 'auto';
        });
      }

      // Step 2: Force GPU compositing on #root to prevent iOS grey artifact
      // Double-nested rAF gives shield and status bar time to repaint first
      const root = document.getElementById('root');
      if (root) {
        root.style.transform = 'translateZ(0)';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            root.style.transform = '';
          });
        });
      }

      // Step 3: Determine rehydration level
      let level: RehydrationLevel = 'none';

      if (backgroundDuration >= REHYDRATION_THRESHOLDS.FULL) {
        level = 'full';
      } else if (backgroundDuration >= REHYDRATION_THRESHOLDS.LIGHT) {
        level = 'light';
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
    };

    // Also handle window blur/focus as fallback
    const handleWindowBlur = () => {
      if (!document.hidden && !backgroundTimeRef.current) {
        backgroundTimeRef.current = Date.now();
        if (import.meta.env.DEV) {
          console.log('[AppLifecycle] Window blurred at', new Date().toISOString());
        }
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
    isRehydratingRef.current = false;
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
