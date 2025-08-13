import { useState, useCallback } from 'react';

export type TransitionDirection = 'left' | 'right';
export type TransitionState = 'idle' | 'transitioning';

interface UseTabSlideTransitionProps {
  onTransitionComplete?: () => void;
  duration?: number;
}

export const useTabSlideTransition = ({ 
  onTransitionComplete, 
  duration = 300 
}: UseTabSlideTransitionProps = {}) => {
  const [transitionState, setTransitionState] = useState<TransitionState>('idle');
  const [transitionDirection, setTransitionDirection] = useState<TransitionDirection>('right');

  const startTransition = useCallback((direction: TransitionDirection, callback?: () => void) => {
    if (transitionState !== 'idle') return;
    
    setTransitionDirection(direction);
    setTransitionState('transitioning');
    
    // Execute the callback immediately to change the tab
    callback?.();
    
    // Reset transition state after animation completes
    setTimeout(() => {
      setTransitionState('idle');
      onTransitionComplete?.();
    }, duration);
  }, [duration, onTransitionComplete, transitionState]);

  return {
    transitionState,
    transitionDirection,
    startTransition,
    isTransitioning: transitionState !== 'idle'
  };
};