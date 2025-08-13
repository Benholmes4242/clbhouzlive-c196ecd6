import { useState, useCallback } from 'react';

export type TransitionDirection = 'left' | 'right';
export type TransitionState = 'idle' | 'sliding-out' | 'sliding-in';

interface UseTabSlideTransitionProps {
  onTransitionComplete?: () => void;
  duration?: number;
}

export const useTabSlideTransition = ({ 
  onTransitionComplete, 
  duration = 280 
}: UseTabSlideTransitionProps = {}) => {
  const [transitionState, setTransitionState] = useState<TransitionState>('idle');
  const [transitionDirection, setTransitionDirection] = useState<TransitionDirection>('right');

  const startTransition = useCallback((direction: TransitionDirection) => {
    setTransitionDirection(direction);
    setTransitionState('sliding-out');
    
    // After slide-out completes, start slide-in
    setTimeout(() => {
      setTransitionState('sliding-in');
      
      // After slide-in completes, reset to idle
      setTimeout(() => {
        setTransitionState('idle');
        onTransitionComplete?.();
      }, duration);
    }, duration);
  }, [duration, onTransitionComplete]);

  return {
    transitionState,
    transitionDirection,
    startTransition,
    isTransitioning: transitionState !== 'idle'
  };
};