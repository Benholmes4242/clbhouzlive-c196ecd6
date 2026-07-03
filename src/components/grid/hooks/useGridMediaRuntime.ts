/**
 * useGridMediaRuntime - [VIDEOSTUB] Gutted to inert
 *
 * Poster-only chassis: returns no-op registration + empty playingIds so callers
 * compile without changes but nothing plays.
 */

// [VIDEOSTUB] RegisterMediaFn defined locally; @/media barrel deleted in Stage E.
type RegisterMediaFn = (...args: any[]) => void;

import type { GridSurface, UniversalMediaItem } from '../types';

interface UseGridMediaRuntimeOptions {
  surface: GridSurface;
  maxConcurrent?: number;
  playThreshold?: number;
  pauseThreshold?: number;
  enabled?: boolean;
}

interface UseGridMediaRuntimeResult {
  registerMedia: RegisterMediaFn;
  playingIds: Set<string>;
  setScrolling: (isScrolling: boolean) => void;
}

const EMPTY_IDS: Set<string> = new Set();
const NOOP_REGISTER: RegisterMediaFn = () => {};
const NOOP_SCROLL = (_isScrolling: boolean) => {};

export function useGridMediaRuntime(
  _options: UseGridMediaRuntimeOptions,
): UseGridMediaRuntimeResult {
  return {
    registerMedia: NOOP_REGISTER,
    playingIds: EMPTY_IDS,
    setScrolling: NOOP_SCROLL,
  };
}

export function useVerticalFeedRuntime(_args: {
  items: UniversalMediaItem[];
  currentIndex: number;
  videoRefs: React.MutableRefObject<Record<string, HTMLVideoElement | null>>;
  enabled?: boolean;
}) {
  return { setScrolling: NOOP_SCROLL };
}
