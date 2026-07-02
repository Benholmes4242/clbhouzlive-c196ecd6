import React, { useEffect, useRef, useState } from 'react';
import DecodedImage, { type DecodedImageProps } from './DecodedImage';
import { useWatchRevealed } from '../WatchRevealContext';
import { getAnimatedThumbnailUrl } from '@/media/utils/animatedThumbnail';

/**
 * AnimatedTileThumb
 * -----------------
 * Decode-gated static poster with an OPTIONAL animated overlay that swaps in
 * when the tile is dwelling in the viewport. Activation choreography:
 *
 *   1. Never before the page reveal (`useWatchRevealed()`).
 *   2. Only while ≥60% in-viewport (IntersectionObserver).
 *   3. After a `dwellMs` dwell (heroes may pass 0 to skip).
 *   4. Global cap: max 2 concurrent animated overlays app-wide.
 *   5. Preload the animated URL via `new Image()` — only crossfade when the
 *      bitmap is ready. Never expose a half-loaded GIF.
 *   6. `prefers-reduced-motion: reduce` → never animate.
 *
 * The static poster (rendered by DecodedImage under the hood) continues to
 * satisfy the coordinated reveal contract via `onDecoded`; the animated layer
 * does not participate in reveal gating.
 */

const MAX_CONCURRENT = 2;
let activeSlots = 0;
const waitQueue: Array<() => void> = [];

function tryAcquireSlot(onGranted: () => void): () => void {
  let released = false;
  let granted = false;

  const grant = () => {
    if (released) return;
    granted = true;
    activeSlots += 1;
    onGranted();
  };

  if (activeSlots < MAX_CONCURRENT) {
    grant();
  } else {
    waitQueue.push(grant);
  }

  return function release() {
    if (released) return;
    released = true;
    if (granted) {
      activeSlots = Math.max(0, activeSlots - 1);
      const next = waitQueue.shift();
      if (next) next();
    } else {
      const i = waitQueue.indexOf(grant);
      if (i >= 0) waitQueue.splice(i, 1);
    }
  };
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);
  return reduced;
}

export interface AnimatedTileThumbProps
  extends Omit<DecodedImageProps, 'src' | 'onDecoded'> {
  /** Static poster src (used by DecodedImage). */
  posterSrc: string | undefined;
  /** Cloudflare Stream UID. When missing, only the static poster renders. */
  streamId?: string;
  /** Tile pixel height (used to size the animated GIF request). */
  heightPx: number;
  /** Dwell before activation. Hero passes 0; rails/grid pass 1000. */
  dwellMs?: number;
  /** IO threshold. Default 0.6. */
  visibleThreshold?: number;
  /** Called once the static poster is decoded (reveal gating). */
  onDecoded?: () => void;
  /** Crossfade duration in ms. Default 200. */
  crossfadeMs?: number;
  /** Element the IO tracks. Defaults to the wrapper we render. */
  className?: string;
}

const AnimatedTileThumb: React.FC<AnimatedTileThumbProps> = ({
  posterSrc,
  streamId,
  heightPx,
  dwellMs = 1000,
  visibleThreshold = 0.6,
  onDecoded,
  crossfadeMs = 200,
  className,
  style,
  ...imgRest
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const pageRevealed = useWatchRevealed();

  const [inView, setInView] = useState(false);
  const [dwelled, setDwelled] = useState(false);
  const [gifSrc, setGifSrc] = useState<string | null>(null);
  const [gifReady, setGifReady] = useState(false);

  const animationEligible =
    !!streamId && !reducedMotion && pageRevealed && inView && dwelled;

  // Track viewport visibility.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.intersectionRatio >= visibleThreshold),
      { threshold: [0, visibleThreshold, 1] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visibleThreshold]);

  // Dwell timer — only while in view.
  useEffect(() => {
    if (!inView) {
      setDwelled(false);
      return;
    }
    if (dwellMs <= 0) {
      setDwelled(true);
      return;
    }
    const t = window.setTimeout(() => setDwelled(true), dwellMs);
    return () => window.clearTimeout(t);
  }, [inView, dwellMs]);

  // Acquire a slot + preload the animated asset.
  useEffect(() => {
    if (!animationEligible) return;
    let cancelled = false;
    let releaseSlot: (() => void) | null = null;

    releaseSlot = tryAcquireSlot(() => {
      if (cancelled || !streamId) return;
      const url = getAnimatedThumbnailUrl(streamId, heightPx * 2);
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        if (cancelled) return;
        setGifSrc(url);
        setGifReady(true);
      };
      img.onerror = () => {
        // Silent: static poster stays.
      };
      img.src = url;
    });

    return () => {
      cancelled = true;
      setGifReady(false);
      setGifSrc(null);
      releaseSlot?.();
    };
  }, [animationEligible, streamId, heightPx]);

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{ position: 'relative', width: '100%', height: '100%', ...style }}
    >
      <DecodedImage
        src={posterSrc}
        onDecoded={onDecoded}
        {...imgRest}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />

      {gifSrc && (
        <img
          src={gifSrc}
          alt=""
          aria-hidden
          decoding="async"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: gifReady && animationEligible ? 1 : 0,
            transition: `opacity ${crossfadeMs}ms ease-out`,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
};

export default AnimatedTileThumb;
