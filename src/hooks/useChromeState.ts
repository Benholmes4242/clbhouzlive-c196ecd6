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

export const useChromeState = ({ isModalOpen = false, disabled = false }: UseChromeStateOptions = {}) => {
  const [chromeState, setChromeState] = useState<ChromeState>('visible');
  const scrollMetricsRef = useRef<ScrollMetrics>({ deltaY: 0, scrollTop: 0, velocity: 0 });
  const lastScrollTop = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const debounceTimer = useRef<number | null>(null);
  
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

  const hideChrome = useCallback(() => {
    if (isModalOpen || disabled) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = window.setTimeout(() => {
      setChromeState('hidden');
    }, 140);
  }, [isModalOpen, disabled]);

  const showChrome = useCallback(() => {
    if (disabled) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = window.setTimeout(() => {
      setChromeState('visible');
    }, 120);
  }, [disabled]);

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

    // Don't hide until scrolled past first post (~50% of viewport height)
    const minScrollThreshold = window.innerHeight * 0.5;
    if (scrollTop < minScrollThreshold) {
      showChrome();
      return;
    }

    // Hide on upward scroll (deltaY > 0 means scrolling down the page = content moving up)
    if (deltaY > 8 && timeDelta < 100) {
      hideChrome();
    }
    // Reveal on downward scroll (deltaY < 0 means scrolling up the page = content moving down)
    else if (deltaY < -6 && timeDelta < 120) {
      showChrome();
    }
  }, [isModalOpen, disabled, hideChrome, showChrome]);

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
