import { useState, useCallback, useEffect, useRef } from 'react';

export type ChromeState = 'visible' | 'hidden';
export type HideReason = 'none' | 'scroll' | 'auto' | 'overlay' | 'interaction';

interface UseChromeStateOptions {
  forceHidden?: boolean;
  disabled?: boolean;
  onNavOverlayRequest?: () => void;
  disableDirectionalReveal?: boolean;
  /** Enable progressive immersion: hide after first meaningful interaction */
  progressiveImmersion?: boolean;
}

interface ScrollMetrics {
  deltaY: number;
  scrollTop: number;
  velocity: number;
}

// Timing constants
const TOP_GUARD_PX = Math.round(window.innerHeight * 0.5);
const HIDE_DEBOUNCE_MS = 140;
const REVEAL_DEBOUNCE_MS = 140;
const REVEAL_DEBOUNCE_AT_TOP_MS = 0; // Instant reveal at top
const EDGE_REVEAL_TIMEOUT_MS = 5000; // Chrome stays visible for 5s after edge reveal

// Bottom edge zone for recovery gesture (15% of viewport)
const BOTTOM_EDGE_ZONE_PERCENT = 0.15;

export const useChromeState = ({ 
  forceHidden = false, 
  disabled = false, 
  onNavOverlayRequest, 
  disableDirectionalReveal = false,
  progressiveImmersion = false,
}: UseChromeStateOptions = {}) => {
  // ⚠️ AUTO-HIDE DISABLED: Chrome is now always visible
  // All hide logic is bypassed - the state is locked to 'visible'
  const [chromeState, setChromeState] = useState<ChromeState>('visible');
  const scrollMetricsRef = useRef<ScrollMetrics>({ deltaY: 0, scrollTop: 0, velocity: 0 });
  const lastScrollTop = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const revealTimer = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);
  const forceHiddenRef = useRef(false);
  
  // DISABLED: Always keep chrome visible regardless of forceHidden prop
  const CHROME_HIDE_DISABLED = true;
  
  // Progressive immersion: track if user has performed a meaningful interaction
  const hasHadMeaningfulInteraction = useRef(false);
  const edgeRevealTimeoutRef = useRef<number | null>(null);
  
  // Track why chrome was hidden to prevent scroll from revealing after auto-hide
  const hideReasonRef = useRef<HideReason>('none');
  
  // Edge swipe detection
  const edgeSwipeRef = useRef<{
    isEdge: boolean;
    isTop: boolean;
    isBottom: boolean;
    startY: number;
    isBottomRecoveryZone: boolean;
  }>({ isEdge: false, isTop: false, isBottom: false, startY: 0, isBottomRecoveryZone: false });

  // Clear edge reveal timeout
  const clearEdgeRevealTimeout = useCallback(() => {
    if (edgeRevealTimeoutRef.current) {
      window.clearTimeout(edgeRevealTimeoutRef.current);
      edgeRevealTimeoutRef.current = null;
    }
  }, []);

  // Handle forceHidden state changes
  // ⚠️ DISABLED: Chrome no longer hides, even when overlays open
  useEffect(() => {
    forceHiddenRef.current = forceHidden;
    
    // DISABLED: Always keep chrome visible
    if (CHROME_HIDE_DISABLED) {
      hideReasonRef.current = 'none';
      setChromeState('visible');
      return;
    }
    
    if (forceHidden) {
      // When overlay opens, hide chrome immediately
      hideReasonRef.current = 'overlay';
      setChromeState('hidden');
    } else {
      // When overlay closes, show chrome
      hideReasonRef.current = 'none';
      setChromeState('visible');
    }
  }, [forceHidden]);

  // Apply chrome state to body class
  // ⚠️ DISABLED: Always remove chrome-hidden class
  useEffect(() => {
    // DISABLED: Always visible, never add chrome-hidden
    document.body.classList.remove('chrome-hidden');
    
    return () => {
      document.body.classList.remove('chrome-hidden');
    };
  }, [chromeState, disabled]);

  // Helper to check if in top zone
  const isInTopZone = useCallback((scrollTop: number) => {
    return scrollTop <= TOP_GUARD_PX;
  }, []);

  // ⚠️ DISABLED: scheduleHide is now a no-op
  const scheduleHide = useCallback((ms: number, reason: HideReason = 'scroll') => {
    // DISABLED: Chrome hiding is disabled
    if (CHROME_HIDE_DISABLED) return;
    
    if (forceHiddenRef.current || disabled) return;
    if (revealTimer.current) {
      clearTimeout(revealTimer.current);
      revealTimer.current = null;
    }
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      hideReasonRef.current = reason;
      setChromeState('hidden');
    }, ms);
  }, [disabled]);

  const scheduleReveal = useCallback((ms: number, scrollTop?: number) => {
    if (disabled) return;
    
    // If chrome was auto-hidden and we're not in the top zone, block the reveal
    if (hideReasonRef.current === 'auto' && scrollTop !== undefined && !isInTopZone(scrollTop)) {
      return;
    }
    
    // If hidden by interaction and not in top zone, block scroll-based reveal
    if (hideReasonRef.current === 'interaction' && scrollTop !== undefined && !isInTopZone(scrollTop)) {
      return;
    }
    
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    if (revealTimer.current) clearTimeout(revealTimer.current);
    revealTimer.current = window.setTimeout(() => {
      hideReasonRef.current = 'none';
      setChromeState('visible');
    }, ms);
  }, [disabled, isInTopZone]);

  const hideChrome = useCallback((reason: HideReason = 'scroll') => {
    scheduleHide(HIDE_DEBOUNCE_MS, reason);
  }, [scheduleHide]);
  
  const showChrome = useCallback(() => {
    hideReasonRef.current = 'none';
    scheduleReveal(REVEAL_DEBOUNCE_MS);
  }, [scheduleReveal]);
  
  // Immediate show/hide (no debounce) for external control like auto-hide timer
  const showChromeImmediate = useCallback(() => {
    if (disabled) return;
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (revealTimer.current) clearTimeout(revealTimer.current);
    hideReasonRef.current = 'none';
    setChromeState('visible');
  }, [disabled]);
  
  // ⚠️ DISABLED: hideChromeImmediate is now a no-op
  const hideChromeImmediate = useCallback((reason: HideReason = 'scroll') => {
    // DISABLED: Chrome hiding is disabled
    if (CHROME_HIDE_DISABLED) return;
    
    if (forceHiddenRef.current || disabled) return;
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (revealTimer.current) clearTimeout(revealTimer.current);
    hideReasonRef.current = reason;
    setChromeState('hidden');
  }, [disabled]);

  // ⚠️ DISABLED: Progressive immersion no longer hides chrome
  const triggerProgressiveHide = useCallback(() => {
    // DISABLED: Chrome hiding is disabled
    if (CHROME_HIDE_DISABLED) return;
    
    if (!progressiveImmersion) return;
    if (forceHiddenRef.current || disabled) return;
    if (hasHadMeaningfulInteraction.current) return; // Only trigger once
    
    hasHadMeaningfulInteraction.current = true;
    hideChromeImmediate('interaction');
  }, [progressiveImmersion, disabled, hideChromeImmediate]);

  // Edge reveal with 5s timeout
  const revealFromEdge = useCallback(() => {
    if (disabled) return;
    
    clearEdgeRevealTimeout();
    showChromeImmediate();
    
    // Schedule re-hide after 5s if no further interaction
    edgeRevealTimeoutRef.current = window.setTimeout(() => {
      if (!forceHiddenRef.current) {
        hideChromeImmediate('interaction');
      }
    }, EDGE_REVEAL_TIMEOUT_MS);
  }, [disabled, showChromeImmediate, hideChromeImmediate, clearEdgeRevealTimeout]);

  const toggleChrome = useCallback(() => {
    if (forceHiddenRef.current || disabled) return;
    
    // Clear any pending timers
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (revealTimer.current) clearTimeout(revealTimer.current);
    
    // Schedule toggle with 140ms debounce
    const timer = window.setTimeout(() => {
      setChromeState(s => {
        if (s === 'visible') {
          hideReasonRef.current = 'scroll';
          return 'hidden';
        } else {
          hideReasonRef.current = 'none';
          return 'visible';
        }
      });
    }, 140);
    
    // Store in appropriate timer ref based on current state
    const currentState = chromeState;
    if (currentState === 'visible') {
      hideTimer.current = timer;
    } else {
      revealTimer.current = timer;
    }
  }, [disabled, chromeState]);

  // Debounce scroll handling to reduce overhead during rapid scroll events
  const lastScrollCall = useRef(0);
  const SCROLL_THROTTLE_MS = 16; // ~60fps max

  // Scroll handler (to be called from rAF)
  const handleScroll = useCallback((scrollTop: number) => {
    if (forceHiddenRef.current || disabled) return;

    const now = Date.now();
    
    // Throttle scroll processing to reduce CPU during transitions
    if (now - lastScrollCall.current < SCROLL_THROTTLE_MS) {
      return;
    }
    lastScrollCall.current = now;

    const timeDelta = now - lastScrollTime.current;
    const deltaY = scrollTop - lastScrollTop.current;
    const velocity = timeDelta > 0 ? deltaY / timeDelta : 0;

    scrollMetricsRef.current = { deltaY, scrollTop, velocity };
    lastScrollTop.current = scrollTop;
    lastScrollTime.current = now;

    // Ignore iOS rubber-band at absolute top
    if (scrollTop <= 0 && deltaY < 0) return;

    const atTopZone = isInTopZone(scrollTop);

    // Always show chrome in top zone (this clears auto-hide lock)
    if (atTopZone) {
      hideReasonRef.current = 'none';
      scheduleReveal(REVEAL_DEBOUNCE_AT_TOP_MS, scrollTop);
      return;
    }

    // Hide on downward scroll (deltaY > 0 means scrolling down the page = content moving up)
    if (deltaY > 8 && timeDelta < 100) {
      scheduleHide(HIDE_DEBOUNCE_MS, 'scroll');
    }
    // Reveal on upward scroll (deltaY < 0 means scrolling up the page = content moving down)
    // Only if directional reveal is not disabled
    // AND only if not auto-hidden (auto-hide lock prevents scroll reveal outside top zone)
    else if (!disableDirectionalReveal && deltaY < -6 && timeDelta < 120) {
      // Pass scrollTop so scheduleReveal can check if we're in top zone
      scheduleReveal(REVEAL_DEBOUNCE_MS, scrollTop);
    }
  }, [disabled, scheduleHide, scheduleReveal, isInTopZone, disableDirectionalReveal]);

  // Tap toggle handler
  const handleTap = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (forceHiddenRef.current || disabled) return;

    const target = event.target as HTMLElement;
    
    // Check if tapped on action element
    const isActionTarget = !!target.closest(
      '[data-action], [data-control], button, a, input, textarea, [role="button"]'
    );
    
    if (isActionTarget) return;
    
    toggleChrome();
  }, [disabled, toggleChrome]);

  // Edge swipe handlers with bottom recovery gesture
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (forceHiddenRef.current || disabled) return;

    const touch = event.touches[0];
    const y = touch.clientY;
    const viewportHeight = window.innerHeight;
    
    const EDGE_ZONE = 32;
    const bottomRecoveryZone = viewportHeight * (1 - BOTTOM_EDGE_ZONE_PERCENT);
    
    const isTop = y <= EDGE_ZONE;
    const isBottom = y >= viewportHeight - EDGE_ZONE;
    const isBottomRecoveryZone = y >= bottomRecoveryZone;
    
    edgeSwipeRef.current = {
      isEdge: isTop || isBottom || isBottomRecoveryZone,
      isTop,
      isBottom,
      startY: y,
      isBottomRecoveryZone,
    };
  }, [disabled]);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (disabled) return;
    if (!edgeSwipeRef.current.isEdge) return;

    const touch = event.touches[0];
    const currentY = touch.clientY;
    const distance = currentY - edgeSwipeRef.current.startY;
    const absDistance = Math.abs(distance);

    const SWIPE_THRESHOLD = 12;
    const RECOVERY_SWIPE_THRESHOLD = 24; // Slightly larger for recovery gesture

    // Bottom recovery zone: swipe UP to reveal header/footer
    if (edgeSwipeRef.current.isBottomRecoveryZone && chromeState === 'hidden') {
      if (distance < 0 && absDistance >= RECOVERY_SWIPE_THRESHOLD) {
        revealFromEdge();
        edgeSwipeRef.current = { isEdge: false, isTop: false, isBottom: false, startY: 0, isBottomRecoveryZone: false };
        return;
      }
    }

    // When chrome is hidden and edge swipe detected, request nav overlay instead
    if (chromeState === 'hidden' && absDistance >= SWIPE_THRESHOLD) {
      if (onNavOverlayRequest) {
        onNavOverlayRequest();
        edgeSwipeRef.current = { isEdge: false, isTop: false, isBottom: false, startY: 0, isBottomRecoveryZone: false };
      }
      return;
    }

    // Normal behavior when chrome is visible
    if (!forceHiddenRef.current) {
      // Top edge: swipe down to reveal
      if (edgeSwipeRef.current.isTop && distance > 0 && absDistance >= SWIPE_THRESHOLD) {
        showChrome();
        edgeSwipeRef.current = { isEdge: false, isTop: false, isBottom: false, startY: 0, isBottomRecoveryZone: false };
      }
      // Bottom edge: swipe up to reveal
      else if (edgeSwipeRef.current.isBottom && distance < 0 && absDistance >= SWIPE_THRESHOLD) {
        showChrome();
        edgeSwipeRef.current = { isEdge: false, isTop: false, isBottom: false, startY: 0, isBottomRecoveryZone: false };
      }
    }
  }, [disabled, showChrome, chromeState, onNavOverlayRequest, revealFromEdge]);

  const handleTouchEnd = useCallback(() => {
    edgeSwipeRef.current = { isEdge: false, isTop: false, isBottom: false, startY: 0, isBottomRecoveryZone: false };
  }, []);

  // Keyboard escape to reveal (desktop helper)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !forceHiddenRef.current && !disabled) {
        showChrome();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, showChrome]);

  // Cleanup on unmount - clear ALL timer refs
  useEffect(() => {
    return () => {
      // Clear all timer refs to prevent state updates on unmounted component
      if (revealTimer.current) {
        clearTimeout(revealTimer.current);
        revealTimer.current = null;
      }
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
      if (edgeRevealTimeoutRef.current) {
        clearTimeout(edgeRevealTimeoutRef.current);
        edgeRevealTimeoutRef.current = null;
      }
      clearEdgeRevealTimeout();
    };
  }, [clearEdgeRevealTimeout]);

  // Getter for hide reason (useful for debugging)
  const getHideReason = useCallback(() => hideReasonRef.current, []);

  // Reset progressive immersion state (for when navigating away and back)
  const resetProgressiveImmersion = useCallback(() => {
    hasHadMeaningfulInteraction.current = false;
  }, []);

  return {
    chromeState,
    isHidden: chromeState === 'hidden',
    isVisible: chromeState === 'visible',
    hideChrome,
    showChrome,
    showChromeImmediate,
    hideChromeImmediate,
    toggleChrome,
    handleScroll,
    handleTap,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    getHideReason,
    // Progressive immersion
    triggerProgressiveHide,
    resetProgressiveImmersion,
    revealFromEdge,
  };
};
