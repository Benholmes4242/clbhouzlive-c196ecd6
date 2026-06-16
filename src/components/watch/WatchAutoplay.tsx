/**
 * WatchAutoplay — Phase WatchSpotlight-B
 *
 * The bespoke 2-slot DOM-pool autoplay coordinator that used to live here
 * (~232 lines: videoPoolRef, activeMapRef, slotForTile/isDesignatedTile,
 * private IntersectionObserver, attachToTile/detachSlot) has been removed.
 *
 * Watch grid autoplay is now arbitrated by MediaRuntime via the unified
 * `useMediaAutoplay` hook, on `surface: 'watch'`. Concurrency cap = 1
 * (set in MediaRuntime Phase WatchSpotlight-A) — exactly one centered tile
 * plays at a time; every other tile is a crisp poster.
 *
 * Pattern mirrors DiscoverTrendingVideos / ShortCardWithObserver. The hook
 * is instantiated here once per grid and exposed to descendants
 * (WatchTile) through React context so each tile can:
 *   1. register its own <video> element with the runtime, and
 *   2. read its own `isPlaying` flag from `playingIds`.
 *
 * Composes with the pool (WatchJank-2): pool owns HLS instance lifecycle,
 * runtime owns play/pause arbitration. They are orthogonal.
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useMediaAutoplay, type RegisterMediaFn } from '@/media';

interface WatchAutoplayCtx {
  registerMedia: RegisterMediaFn;
  playingIds: Set<string>;
  visibleIds: Set<string>;
}

const WatchAutoplayContext = createContext<WatchAutoplayCtx | null>(null);

/** Tiles read their isPlaying / isVisibleCandidate flags + register callback from this context. */
export const useWatchAutoplay = (): WatchAutoplayCtx | null =>
  useContext(WatchAutoplayContext);

interface WatchAutoplayProps {
  children: React.ReactNode;
}

const WatchAutoplay: React.FC<WatchAutoplayProps> = ({ children }) => {
  const { registerMedia, playingIds, visibleIds } = useMediaAutoplay({
    mode: 'grid',
    surface: 'watch',
    startThreshold: 0.5,
    stopThreshold: 0.25,
  });

  const value = useMemo(
    () => ({ registerMedia, playingIds, visibleIds }),
    [registerMedia, playingIds, visibleIds],
  );

  return (
    <WatchAutoplayContext.Provider value={value}>
      {children}
    </WatchAutoplayContext.Provider>
  );
};

export default WatchAutoplay;
