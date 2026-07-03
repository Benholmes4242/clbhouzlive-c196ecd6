/**
 * useMediaAutoplay - STUBBED (video teardown Stage A)
 * No IntersectionObserver, no runtime registration. Registration is a no-op
 * and playingIds is always empty.
 */
import { useCallback } from 'react';
import type { MediaSurface } from './runtime';

export interface MediaAutoplayRegistration {
  id: string;
  element: HTMLVideoElement;
  observeTarget?: HTMLElement;
  isCandidate: boolean;
  sortIndex: number;
  hasBeenPreloaded: boolean;
}

export interface UseMediaAutoplayOptions {
  mode?: 'grid' | 'feed' | 'videos';
  surface?: MediaSurface;
  startThreshold?: number;
  stopThreshold?: number;
  preloadMargin?: number;
  maxPreloading?: number;
  scrollSettleDelay?: number;
  warmWindowSize?: number;
}

export type RegisterMediaFn = (args: {
  id: string;
  element: HTMLVideoElement | null;
  isCandidate?: boolean;
  sortIndex?: number;
  observeTarget?: HTMLElement | null;
}) => void;

const EMPTY_IDS: Set<string> = new Set();

export function useMediaAutoplay(_options: UseMediaAutoplayOptions = {}) {
  const registerMedia: RegisterMediaFn = useCallback(() => {}, []);
  return {
    registerMedia,
    playingIds: EMPTY_IDS,
  };
}
