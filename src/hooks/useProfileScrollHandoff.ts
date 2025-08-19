import { useState, useEffect, useRef, useCallback } from 'react';

interface ScrollHandoffState {
  showCard: boolean;
  showHeader: boolean;
  cardOpacity: number;
  headerOpacity: number;
  cardTransform: string;
  headerTransform: string;
  cardInteractive: boolean;
  headerInteractive: boolean;
}

export const useProfileScrollHandoff = () => {
  const [state, setState] = useState<ScrollHandoffState>({
    showCard: true,
    showHeader: false,
    cardOpacity: 1,
    headerOpacity: 0,
    cardTransform: 'translateY(0) scale(1)',
    headerTransform: 'translateY(-12px)',
    cardInteractive: true,
    headerInteractive: false
  });

  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Animation easing function
  const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);

  // Calculate animation progress based on intersection ratio
  const calculateProgress = useCallback((intersectionRatio: number): number => {
    // Sentinel enters viewport from bottom when scrolling down
    // We want the handoff to happen between 15% and 25% visibility
    const enterThreshold = 0.15; // Show header when 15% of sentinel is visible
    const exitThreshold = 0.25;  // Fully show header when 25% is visible

    if (intersectionRatio >= exitThreshold) {
      return 1; // Fully show header
    } else if (intersectionRatio <= enterThreshold) {
      return 0; // Fully show card
    } else {
      // In crossfade zone (15% - 25%)
      const progress = (intersectionRatio - enterThreshold) / (exitThreshold - enterThreshold);
      return easeOut(progress);
    }
  }, []);

  // Update state based on scroll progress
  const updateState = useCallback((progress: number) => {
    const cardOpacity = 1 - progress;
    const headerOpacity = progress;
    
    // Scale and translate animations
    const cardScale = 1 - (progress * 0.02); // Scale from 1.00 to 0.98
    const cardTranslateY = progress * -12; // Move up 12px
    const headerTranslateY = (1 - progress) * -12; // Move from -12px to 0

    // Interaction states - only enable when opacity >= 0.9
    const cardInteractive = cardOpacity >= 0.9;
    const headerInteractive = headerOpacity >= 0.9;

    // Visibility states
    const showCard = cardOpacity > 0;
    const showHeader = headerOpacity > 0;

    setState({
      showCard,
      showHeader,
      cardOpacity,
      headerOpacity,
      cardTransform: `translateY(${cardTranslateY}px) scale(${cardScale})`,
      headerTransform: `translateY(${headerTranslateY}px)`,
      cardInteractive,
      headerInteractive
    });
  }, []);

  // Set up IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const progress = calculateProgress(entry.intersectionRatio);
        updateState(progress);
      },
      {
        threshold: [0, 0.15, 0.25, 0.5, 0.75, 1.0],
        rootMargin: '0px'
      }
    );

    observer.observe(sentinelRef.current);
    observerRef.current = observer;

    return () => {
      observer.disconnect();
    };
  }, [calculateProgress, updateState]);

  // Respect reduced motion preference
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      setState(prev => ({
        ...prev,
        cardTransform: prev.cardOpacity > 0.5 ? 'translateY(0) scale(1)' : 'translateY(0) scale(1)',
        headerTransform: 'translateY(0)'
      }));
    }
  }, [state.cardOpacity]);

  return {
    sentinelRef,
    ...state
  };
};