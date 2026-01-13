import { useCallback, useRef, useState } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  disabled?: boolean;
}

interface PullToRefreshState {
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  disabled = false,
}: UsePullToRefreshOptions) {
  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    isRefreshing: false,
    pullDistance: 0,
  });

  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || state.isRefreshing) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;

    startY.current = e.touches[0].clientY;
    setState(prev => ({ ...prev, isPulling: true }));
  }, [disabled, state.isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!state.isPulling || disabled || state.isRefreshing) return;

    const container = containerRef.current;
    if (!container || container.scrollTop > 0) {
      setState(prev => ({ ...prev, isPulling: false, pullDistance: 0 }));
      return;
    }

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY.current);
    
    // Apply resistance
    const pullDistance = Math.min(distance * 0.5, threshold * 1.5);
    
    setState(prev => ({ ...prev, pullDistance }));
  }, [state.isPulling, disabled, state.isRefreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!state.isPulling || disabled) return;

    if (state.pullDistance >= threshold) {
      setState(prev => ({ ...prev, isRefreshing: true, pullDistance: threshold }));
      
      try {
        await onRefresh();
      } finally {
        setState({ isPulling: false, isRefreshing: false, pullDistance: 0 });
      }
    } else {
      setState({ isPulling: false, isRefreshing: false, pullDistance: 0 });
    }
  }, [state.isPulling, state.pullDistance, threshold, disabled, onRefresh]);

  const pullProgress = Math.min(state.pullDistance / threshold, 1);

  return {
    containerRef,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    isPulling: state.isPulling,
    isRefreshing: state.isRefreshing,
    pullDistance: state.pullDistance,
    pullProgress,
  };
}
