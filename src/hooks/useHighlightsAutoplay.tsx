/**
 * useHighlightsAutoplay - DEPRECATED
 * 
 * This hook is no longer needed. All autoplay is now handled by MediaRuntime.
 * Components should use useMediaAutoplay instead.
 * 
 * @deprecated Use useMediaAutoplay from '@/media/useMediaAutoplay' instead
 */

import { useCallback, useState } from 'react';

interface UseHighlightsAutoplayProps {
  containerRef: React.RefObject<HTMLDivElement>;
  highlights: any[];
}

/**
 * @deprecated Use useMediaAutoplay instead
 */
export const useHighlightsAutoplay = ({ containerRef, highlights }: UseHighlightsAutoplayProps) => {
  if (import.meta.env.DEV) {
    console.warn(
      '[DEPRECATED] useHighlightsAutoplay is deprecated. Use useMediaAutoplay from @/media/useMediaAutoplay instead.'
    );
  }
  
  const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);

  // No-op registration - MediaRuntime handles this now
  const registerCard = useCallback((_index: number, _element: HTMLDivElement | null) => {
    // No-op - deprecated
  }, []);

  return {
    activeCardIndex,
    registerCard,
    shouldAutoplay: (_index: number) => false // MediaRuntime handles autoplay now
  };
};
