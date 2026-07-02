import React, { useEffect, useRef, useState } from 'react';
import { wrtMark } from '@/perf/watchRevealDebug';

export interface DecodedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /**
   * Fires once when the bitmap is ready (via HTMLImageElement.decode()
   * or the onLoad fallback). When `src` is falsy, fires immediately —
   * we never block callers on a missing thumbnail.
   */
  onDecoded?: () => void;
  /** Fade duration in ms. Defaults to 120. */
  fadeMs?: number;
  /** Temporary telemetry id like "trending#3" — feeds watchRevealDebug. */
  debugId?: string;

}

/**
 * Decode-gated <img>. Mounts at opacity 0, awaits `img.decode()`
 * (falling back to `onLoad`), then fades in. Extracted from the
 * original WatchTile logic so rails and heroes can share the exact
 * same reveal timing — the moment their tiles fade in, pixels are
 * finished, not just requested.
 */
const DecodedImage = React.forwardRef<HTMLImageElement, DecodedImageProps>(
  ({ src, onDecoded, fadeMs = 120, debugId, style, onLoad, onError, ...rest }, forwardedRef) => {
    const [loaded, setLoaded] = useState(false);
    const innerRef = useRef<HTMLImageElement>(null);
    const notifiedRef = useRef(false);

    const parsed = React.useMemo(() => {
      if (!debugId) return null;
      const [section, idx] = debugId.split('#');
      return { section, index: Number(idx) };
    }, [debugId]);

    useEffect(() => {
      if (parsed) wrtMark(parsed.section, 'tile-mount', parsed.index);
    }, [parsed]);

    const setRefs = (node: HTMLImageElement | null) => {
      innerRef.current = node;
      if (typeof forwardedRef === 'function') forwardedRef(node);
      else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLImageElement | null>).current = node;
    };

    const notify = () => {
      if (notifiedRef.current) return;
      notifiedRef.current = true;
      if (parsed) wrtMark(parsed.section, 'tile-decoded', parsed.index);
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

    if (!src) return null;

    return (
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
          // Treat errors as "done" so the coordinated reveal isn't blocked
          // by a broken thumbnail.
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
  },
);

DecodedImage.displayName = 'DecodedImage';

export default DecodedImage;
