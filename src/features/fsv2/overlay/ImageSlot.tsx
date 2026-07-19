/**
 * ImageSlot — image on the v1 backdrop treatment (cover-blur, dim, scrim).
 * useLayoutEffect + visualViewport listeners handle iOS visualViewport
 * degenerate reads (v1 defect 2). Watchdog forces reveal on decode
 * timeout.
 */

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { FSV2 } from '../tokens';
import { traceReveal } from '../perf/trace';
import { WATCHDOG_MS, armWatchdog } from './Watchdogs';

interface Props {
  imageUrl: string;
  posterUrl?: string | null;
  active: boolean;
  openId: string;
  onFirstReveal?: () => void;
}

export const Fsv2ImageSlot: React.FC<Props> = ({
  imageUrl,
  posterUrl,
  active,
  openId,
  onFirstReveal,
}) => {
  const [revealed, setRevealed] = useState(false);
  const revealedRef = useRef(false);

  const reveal = (reason: 'decoded' | 'forced') => {
    if (revealedRef.current) return;
    revealedRef.current = true;
    setRevealed(true);
    traceReveal(openId, { kind: 'image', reason });
    onFirstReveal?.();
  };

  useLayoutEffect(() => {
    if (!active) return;
    const img = new Image();
    img.src = imageUrl;
    if (img.decode) {
      img.decode().then(() => reveal('decoded')).catch(() => {
        // decode() can reject on GIFs / animated formats — treat onload
        // as the reveal signal instead.
      });
    }
    img.onload = () => reveal('decoded');
    return () => {
      img.onload = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl, active]);

  useEffect(() => {
    if (!active || revealedRef.current) return;
    const cancel = armWatchdog(
      openId,
      'image-decode-timeout',
      WATCHDOG_MS.IMAGE_DECODE,
      () => reveal('forced'),
      { imageUrl },
    );
    return cancel;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, openId]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: FSV2.BACKDROP,
      }}
    >
      {/* Cover-blur backdrop */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: FSV2.IMAGE_BLUR_BG_FILTER,
          transform: 'scale(1.1)',
        }}
      />
      {/* Scrim */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: `rgba(0,0,0,${FSV2.SCRIM_ALPHA})`,
        }}
      />
      {/* Optional poster (paints before decode finishes) */}
      {posterUrl && !revealed ? (
        <img
          src={posterUrl}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            opacity: 0.6,
          }}
        />
      ) : null}
      {/* Real image, contain */}
      <img
        src={imageUrl}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          opacity: revealed ? 1 : 0,
          transition: `opacity ${FSV2.VIDEO_CROSSFADE_MS}ms ease`,
        }}
      />
    </div>
  );
};
