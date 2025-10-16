import { useState, useCallback, useEffect, useRef } from 'react';

export type ChromeState = 'visible' | 'hidden';

interface UseChromeStateOptions {
  isModalOpen?: boolean;
  disabled?: boolean;
}

interface ScrollMetrics {
  deltaY: number;
  scrollTop: number;
  velocity: number;
}

// Timing constants - Clubhouse fast chrome
const TOP_GUARD_PX = Math.round(window.innerHeight * 0.5);
const HIDE_DEBOUNCE_MS = 90;   // Fast hide
const REVEAL_DEBOUNCE_MS = 90; // Fast reveal
const REVEAL_DEBOUNCE_AT_TOP_MS = 0; // Instant reveal at top

export const useChromeState = ({ isModalOpen = false, disabled = false }: UseChromeStateOptions = {}) => {
  const [chromeState, setChromeState] = useState<ChromeState>('visible');
  const scrollMetricsRef = useRef<ScrollMetrics>({ deltaY: 0, scrollTop: 0, velocity: 0 });
  const lastScrollTop = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const revealTimer = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);
  
  // Edge swipe detection
  const edgeSwipeRef = useRef<{
    isEdge: boolean;
    isTop: boolean;
    isBottom: boolean;
    startY: number;
  }>({ isEdge: false, isTop: false, isBottom: false, startY: 0 });

  // Show chrome immediately when modal opens
  useEffect(() => {
    if (isModalOpen) {
      setChromeState('visible');
    }
  }, [isModalOpen]);

  // Apply chrome state to body class
  useEffect(() => {
    if (disabled) {
      document.body.classList.remove('chrome-hidden');
      return;
    }
    
    if (chromeState === 'hidden') {
      document.body.classList.add('chrome-hidden');
    } else {
      document.body.classList.remove('chrome-hidden');
    }
    
    return () => {
      document.body.classList.remove('chrome-hidden');
    };
  }, [chromeState, disabled]);

  const scheduleHide = useCallback((ms: number) => {
    if (isModalOpen || disabled) return;
    if (revealTimer.current) {
      clearTimeout(revealTimer.current);
      revealTimer.current = null;
    }
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      setChromeState('hidden');
    }, ms);
  }, [isModalOpen, disabled]);

  const scheduleReveal = useCallback((ms: number) => {
    if (disabled) return;
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    if (revealTimer.current) clearTimeout(revealTimer.current);
    revealTimer.current = window.setTimeout(() => {
      setChromeState('visible');
    }, ms);
  }, [disabled]);

  const hideChrome = useCallback(() => scheduleHide(HIDE_DEBOUNCE_MS), [scheduleHide]);
  const showChrome = useCallback(() => scheduleReveal(REVEAL_DEBOUNCE_MS), [scheduleReveal]);

  const toggleChrome = useCallback(() => {
    if (isModalOpen || disabled) return;
    setChromeState(s => s === 'visible' ? 'hidden' : 'visible');
  }, [isModalOpen, disabled]);

  // Scroll handler (to be called from rAF)
  const handleScroll = useCallback((scrollTop: number) => {
    if (isModalOpen || disabled) return;

    const now = Date.now();
    const timeDelta = now - lastScrollTime.current;
    const deltaY = scrollTop - lastScrollTop.current;
    const velocity = timeDelta > 0 ? deltaY / timeDelta : 0;

    scrollMetricsRef.current = { deltaY, scrollTop, velocity };
    lastScrollTop.current = scrollTop;
    lastScrollTime.current = now;

    // Ignore iOS rubber-band at absolute top
    if (scrollTop <= 0 && deltaY < 0) return;

    const atTopZone = scrollTop <= TOP_GUARD_PX;

    // Always show chrome in top zone
    if (atTopZone) {
      scheduleReveal(REVEAL_DEBOUNCE_AT_TOP_MS);
      return;
    }

    // Hide on downward scroll (deltaY > 0 means scrolling down the page = content moving up)
    if (deltaY > 8 && timeDelta < 100) {
      scheduleHide(HIDE_DEBOUNCE_MS);
    }
    // Reveal on upward scroll (deltaY < 0 means scrolling up the page = content moving down)
    else if (deltaY < -6 && timeDelta < 120) {
      scheduleReveal(REVEAL_DEBOUNCE_MS);
    }
  }, [isModalOpen, disabled, scheduleHide, scheduleReveal]);

  // Tap toggle handler
  const handleTap = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (isModalOpen || disabled) return;

    const target = event.target as HTMLElement;
    
    // Check if tapped on action element
    const isActionTarget = !!target.closest(
      '[data-action], [data-control], button, a, input, textarea, [role="button"]'
    );
    
    if (isActionTarget) return;
    
    toggleChrome();
  }, [isModalOpen, disabled, toggleChrome]);

  // Edge swipe handlers
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (isModalOpen || disabled) return;

    const touch = event.touches[0];
    const y = touch.clientY;
    const viewportHeight = window.innerHeight;
    
    const EDGE_ZONE = 32;
    const isTop = y <= EDGE_ZONE;
    const isBottom = y >= viewportHeight - EDGE_ZONE;
    
    edgeSwipeRef.current = {
      isEdge: isTop || isBottom,
      isTop,
      isBottom,
      startY: y
    };
  }, [isModalOpen, disabled]);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (isModalOpen || disabled) return;
    if (!edgeSwipeRef.current.isEdge) return;

    const touch = event.touches[0];
    const currentY = touch.clientY;
    const distance = currentY - edgeSwipeRef.current.startY;
    const absDistance = Math.abs(distance);

    const SWIPE_THRESHOLD = 12;

    // Top edge: swipe down to reveal
    if (edgeSwipeRef.current.isTop && distance > 0 && absDistance >= SWIPE_THRESHOLD) {
      showChrome();
      edgeSwipeRef.current.isEdge = false;
    }
    // Bottom edge: swipe up to reveal
    else if (edgeSwipeRef.current.isBottom && distance < 0 && absDistance >= SWIPE_THRESHOLD) {
      showChrome();
      edgeSwipeRef.current.isEdge = false;
    }
  }, [isModalOpen, disabled, showChrome]);

  const handleTouchEnd = useCallback(() => {
    edgeSwipeRef.current = { isEdge: false, isTop: false, isBottom: false, startY: 0 };
  }, []);

  // Keyboard escape to reveal (desktop helper)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isModalOpen && !disabled) {
        showChrome();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, disabled, showChrome]);

  return {
    chromeState,
    isHidden: chromeState === 'hidden',
    isVisible: chromeState === 'visible',
    hideChrome,
    showChrome,
    toggleChrome,
    handleScroll,
    handleTap,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
};
