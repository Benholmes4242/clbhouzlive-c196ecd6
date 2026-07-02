import React, { useEffect, useState } from 'react';
import { buildLqipUrl } from '@/utils/mediaThumbs';
import { acquireLqipSlot } from '@/utils/lqipQueue';

interface LqipUnderlayProps {
  /** Source URL to derive the tiny variant from. */
  from: string | null | undefined;
  /** Border radius to match parent (px). */
  radius?: number;
}

/**
 * Drop-in blurred underlay for raw <img> call sites that don't (yet)
 * use DecodedImage. Absolutely-positioned to fill its (relative,
 * overflow:hidden) parent. Zero effect on the sibling <img>'s reveal
 * or load — the real image sits on top and simply paints when ready.
 *
 * Rate-limited via the shared LQIP queue and fetched at low priority
 * so it never competes with the real thumbnail.
 */
const LqipUnderlay: React.FC<LqipUnderlayProps> = ({ from, radius }) => {
  const url = buildLqipUrl(from);
  const [resolved, setResolved] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!url) {
      setResolved(null);
      setLoaded(false);
      return;
    }
    let cancelled = false;
    let release: (() => void) | null = null;
    acquireLqipSlot().then((r) => {
      if (cancelled) {
        r();
        return;
      }
      release = r;
      setResolved(url);
    });
    return () => {
      cancelled = true;
      if (release) release();
    };
  }, [url]);

  if (!url || !resolved) return null;
  return (
    <img
      src={resolved}
      alt=""
      aria-hidden="true"
      decoding="async"
      // Phase 6: eager + low — fetch now, never compete with the real image.
      loading="eager"
      // @ts-expect-error — non-standard but widely supported
      fetchpriority="low"
      onLoad={() => setLoaded(true)}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        filter: 'blur(12px) saturate(1.1)',
        transform: 'scale(1.1)',
        transformOrigin: 'center',
        opacity: loaded ? 1 : 0,
        transition: 'opacity 80ms linear',
        pointerEvents: 'none',
        borderRadius: radius,
        zIndex: 0,
      }}
    />
  );
};

export default LqipUnderlay;
