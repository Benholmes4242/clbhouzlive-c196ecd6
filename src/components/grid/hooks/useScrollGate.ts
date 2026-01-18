/**
 * useScrollGate - Prevents scrolling to videos that aren't ready yet
 * 
 * Shows a loading spinner + bounces back when user tries to scroll
 * past the last "ready" video in the feed.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseScrollGateOptions {
  totalItems: number;
  /** Function to check if a video at index is ready */
  isIndexReady: (index: number) => boolean;
  /** Ref to the scroll container */
  scrollViewRef: React.RefObject<HTMLDivElement>;
  /** Callback when scroll is blocked and bounced */
  onBlocked?: (targetIndex: number) => void;
}

interface UseScrollGateReturn {
  /** Whether the gate is currently blocking scroll */
  isBlocking: boolean;
  /** Show loading overlay at bottom of feed */
  showLoadingGate: boolean;
  /** Wrap the internal scroll handler to add gating */
  createGatedScrollHandler: (internalHandler: () => void) => () => void;
  /** Force check if we need to bounce back */
  checkAndBounce: () => void;
}

export function useScrollGate({
  totalItems,
  isIndexReady,
  scrollViewRef,
  onBlocked,
}: UseScrollGateOptions): UseScrollGateReturn {
  const [isBlocking, setIsBlocking] = useState(false);
  const [showLoadingGate, setShowLoadingGate] = useState(false);
  
  const lastValidIndexRef = useRef(0);
  const bounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const blockStartTimeRef = useRef(0);
  
  // Find the highest consecutive ready index from current position
  const getMaxReadyIndex = useCallback(() => {
    let maxReady = 0;
    for (let i = 0; i < totalItems; i++) {
      if (isIndexReady(i)) {
        maxReady = i;
      } else {
        // Found first non-ready, stop
        break;
      }
    }
    return maxReady;
  }, [totalItems, isIndexReady]);

  // Bounce scroll back to the last valid index
  const bounceBack = useCallback((targetIndex: number) => {
    if (!scrollViewRef.current) return;
    
    const itemHeight = window.innerHeight;
    const targetScrollTop = targetIndex * itemHeight;
    
    console.log(`[ScrollGate] ⛔ Bouncing back to index ${targetIndex}`);
    
    scrollViewRef.current.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth',
    });
    
    onBlocked?.(targetIndex);
  }, [scrollViewRef, onBlocked]);

  // Check current scroll position and bounce if needed
  const checkAndBounce = useCallback(() => {
    if (!scrollViewRef.current) return;
    
    const scrollTop = scrollViewRef.current.scrollTop;
    const itemHeight = window.innerHeight;
    const currentScrollIndex = Math.round(scrollTop / itemHeight);
    const maxReadyIndex = getMaxReadyIndex();
    
    // If current scroll position is past the ready boundary
    if (currentScrollIndex > maxReadyIndex) {
      setIsBlocking(true);
      setShowLoadingGate(true);
      blockStartTimeRef.current = Date.now();
      bounceBack(maxReadyIndex);
    }
  }, [scrollViewRef, getMaxReadyIndex, bounceBack]);

  // Create a gated scroll handler
  const createGatedScrollHandler = useCallback((internalHandler: () => void) => {
    return () => {
      if (!scrollViewRef.current) {
        internalHandler();
        return;
      }
      
      const scrollTop = scrollViewRef.current.scrollTop;
      const itemHeight = window.innerHeight;
      const scrollIndex = Math.round(scrollTop / itemHeight);
      const maxReadyIndex = getMaxReadyIndex();
      
      // If trying to scroll past the ready boundary
      if (scrollIndex > maxReadyIndex) {
        // Show loading gate
        if (!isBlocking) {
          setIsBlocking(true);
          setShowLoadingGate(true);
          blockStartTimeRef.current = Date.now();
          console.log(`[ScrollGate] 🚫 Blocking scroll at index ${scrollIndex}, max ready: ${maxReadyIndex}`);
        }
        
        // Debounce the bounce-back to avoid fighting with user scroll
        if (bounceTimeoutRef.current) {
          clearTimeout(bounceTimeoutRef.current);
        }
        bounceTimeoutRef.current = setTimeout(() => {
          bounceBack(maxReadyIndex);
        }, 100);
        
        return; // Don't call the internal handler for blocked scroll
      }
      
      // Scroll is within ready bounds - allow it
      lastValidIndexRef.current = scrollIndex;
      
      // Clear blocking state if we're back within bounds
      if (isBlocking) {
        setIsBlocking(false);
        // Keep loading gate visible briefly so users understand what happened
        setTimeout(() => {
          setShowLoadingGate(false);
        }, 300);
      }
      
      internalHandler();
    };
  }, [scrollViewRef, getMaxReadyIndex, isBlocking, bounceBack]);

  // When ready state changes, check if we can now advance
  useEffect(() => {
    if (isBlocking) {
      const maxReady = getMaxReadyIndex();
      const scrollTop = scrollViewRef.current?.scrollTop || 0;
      const itemHeight = window.innerHeight;
      const targetIndex = Math.round(scrollTop / itemHeight);
      
      // If the target is now ready, allow scrolling there
      if (targetIndex <= maxReady) {
        setIsBlocking(false);
        setShowLoadingGate(false);
        console.log(`[ScrollGate] ✅ Unblocking - index ${targetIndex} is now ready`);
      }
    }
  }, [isBlocking, getMaxReadyIndex, scrollViewRef]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (bounceTimeoutRef.current) {
        clearTimeout(bounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    isBlocking,
    showLoadingGate,
    createGatedScrollHandler,
    checkAndBounce,
  };
}
