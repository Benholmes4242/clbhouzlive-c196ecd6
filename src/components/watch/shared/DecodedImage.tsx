import React, { useEffect, useRef, useState } from 'react';
import { acquireLqipSlot } from '@/utils/lqipQueue';

export interface DecodedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /**
   * Fires once when the bitmap is ready (via HTMLImageElement.decode()
   * or the onLoad fallback). When `src` is falsy, fires immediately —
   * we never block callers on a missing thumbnail.
   */
  onDecoded?: () => void;
  /** Fade duration in ms. Defaults to 120. */
  fadeMs?: number;
  /**
   * Optional tiny (~1-3KB) LQIP variant of `src`. When provided, paints
   * blurred underneath the real image the moment it decodes. Reveal
   * semantics are UNTOUCHED — `onDecoded` still fires against the real
   * image; the LQIP has zero say in reveal or settle.
   */
  lqipSrc?: string | null;
}

/**
 * Decode-gated <img>. Mounts at opacity 0, awaits `img.decode()`
 * (falling back to `onLoad`), then fades in. Extracted from the
 * original WatchTile logic so rails and heroes can share the exact
 * same reveal timing — the moment their tiles fade in, pixels are
 * finished, not just requested.
 *
 * When `lqipSrc` is provided, a blurred sibling <img> is painted
 * behind the real one so grey placeholder boxes become content
 * previews (Netflix/YouTube feel). The LQIP layer never blocks or
 * gates the reveal.
 */
const DecodedImage = React.forwardRef<HTMLImageElement, DecodedImageProps>(
  ({ src, onDecoded, fadeMs = 120, lqipSrc, style, className, onLoad, onError, ...rest }, forwardedRef) => {
    const [loaded, setLoaded] = useState(false);
    const [lqipLoaded, setLqipLoaded] = useState(false);
    const [lqipResolved, setLqipResolved] = useState<string | null>(null);
    const innerRef = useRef<HTMLImageElement>(null);
    const notifiedRef = useRef(false);

    const setRefs = (node: HTMLImageElement | null) => {
      innerRef.current = node;
      if (typeof forwardedRef === 'function') forwardedRef(node);
      else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLImageElement | null>).current = node;
    };

    const notify = () => {
      if (notifiedRef.current) return;
      notifiedRef.current = true;
      onDecoded?.();
    };

    // No src → nothing to decode; unblock the reveal immediately.
    useEffect(() => {
      if (!src) {
        notify();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [src]);

    useEffect(() => {
      if (!src) return;
      const img = innerRef.current;
      if (!img) return;
      let cancelled = false;

      const reveal = () => {
        if (cancelled) return;
        setLoaded(true);
        notify();
      };

      if (img.complete && img.naturalWidth > 0) {
        reveal();
        return;
      }
      if (typeof img.decode === 'function') {
        img.decode().then(reveal).catch(() => {
          // decode() rejects on some browsers for cross-origin / animated;
          // onLoad fallback handles it.
        });
      }

      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [src]);

    // LQIP: rate-limited fetch slot so 20 tiles can't flood the network.
    useEffect(() => {
      if (!lqipSrc) {
        setLqipResolved(null);
        setLqipLoaded(false);
        return;
      }
      let cancelled = false;
      let releaseFn: (() => void) | null = null;
      acquireLqipSlot().then((release) => {
        if (cancelled) {
          release();
          return;
        }
        releaseFn = release;
        setLqipResolved(lqipSrc);
      });
      return () => {
        cancelled = true;
        if (releaseFn) releaseFn();
      };
    }, [lqipSrc]);

    if (!src) return null;

    // No LQIP requested — legacy shape (bare <img>) to keep parent layouts identical.
    if (!lqipSrc) {
      return (
        <img
          ref={setRefs}
          src={src}
          decoding="async"
          className={className}
          {...rest}
          onLoad={(e) => {
            setLoaded(true);
            notify();
            onLoad?.(e);
          }}
          onError={(e) => {
            notify();
            onError?.(e);
          }}
          style={{
            ...style,
            opacity: loaded ? 1 : 0,
            transition: `opacity ${fadeMs}ms ease-out`,
          }}
        />
      );
    }

    // With LQIP: wrap both imgs so scale(1.1) can't bleed past rounded corners.
    // Wrapper is absolutely-positioned + full-bleed to match the caller's
    // <img style={position:absolute; inset:0}> pattern used across tiles.
    const wrapperStyle: React.CSSProperties = {
      position: (style as any)?.position ?? 'absolute',
      inset: 0,
      width: (style as any)?.width ?? '100%',
      height: (style as any)?.height ?? '100%',
      overflow: 'hidden',
      // Preserve tile radius/opacity toggles from callers (e.g. WatchRailTile
      // fades the poster out when video takes over).
      borderRadius: (style as any)?.borderRadius,
      opacity: (style as any)?.opacity,
      transition: (style as any)?.transition,
    };

    return (
      <span aria-hidden={false} style={wrapperStyle} className={className}>
        {lqipResolved ? (
          <img
            src={lqipResolved}
            alt=""
            aria-hidden="true"
            decoding="async"
            // @ts-expect-error — non-standard but widely supported HTML attribute
            fetchpriority="low"
            // Phase 6: eager so it fetches immediately, but low priority so it
            // never competes with the real image (per fetchPriority contract).
            loading="eager"
            onLoad={() => setLqipLoaded(true)}
            onError={() => setLqipLoaded(false)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: (style as any)?.objectFit ?? 'cover',
              filter: 'blur(12px) saturate(1.1)',
              transform: 'scale(1.1)',
              transformOrigin: 'center',
              opacity: lqipLoaded && !loaded ? 1 : lqipLoaded ? 1 : 0,
              transition: 'opacity 80ms linear',
              willChange: 'opacity',
              pointerEvents: 'none',
            }}
          />
        ) : null}
        <img
          ref={setRefs}
          src={src}
          decoding="async"
          {...rest}
          onLoad={(e) => {
            setLoaded(true);
            notify();
            onLoad?.(e);
          }}
          onError={(e) => {
            notify();
            onError?.(e);
          }}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: (style as any)?.objectFit ?? 'cover',
            objectPosition: (style as any)?.objectPosition,
            opacity: loaded ? 1 : 0,
            transition: `opacity ${fadeMs}ms ease-out`,
          }}
        />
      </span>
    );
  },
);

DecodedImage.displayName = 'DecodedImage';

export default DecodedImage;
