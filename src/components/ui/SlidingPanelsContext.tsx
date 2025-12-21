import { createContext, useContext } from 'react';

export interface SlidingPanelsContextValue {
  isAnimating: boolean;
}

export const SlidingPanelsContext = createContext<SlidingPanelsContextValue>({
  isAnimating: false,
});

export function useSlidingPanels() {
  return useContext(SlidingPanelsContext);
}
