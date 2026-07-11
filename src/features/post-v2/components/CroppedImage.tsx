// CroppedImage - renders an image inside a frame-shaped box, honouring the
// per-item pos + scale (from studio_edits.crop). Falls back to plain
// object-fit: cover when no adjustments have been made.

import { useEffect, useRef, useState } from 'react';
import type { StageMediaItem } from '../hooks/useStageComposer';
import { computePreviewStyle, DEFAULT_POS } from '../lib/frameCropMath';

interface Props {
  item: StageMediaItem;
  /** Force a specific fit box; otherwise fills parent. */
  style?: React.CSSProperties;
  alt?: string;
}

export default function CroppedImage({ item, style, alt = '' }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(
    item.naturalWidth && item.naturalHeight ? { w: item.naturalWidth, h: item.naturalHeight } : null,
  );

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setBox({ w: r.width, h: r.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const crop = item.crop;
  const hasAdjust = !!crop && (crop.scale !== 1 || crop.x !== 50 || crop.y !== 50);

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', ...style }}>
      {hasAdjust && nat && box ? (() => {
        const pos = { x: crop!.x, y: crop!.y };
        const s = computePreviewStyle(nat.w, nat.h, item.frame, box.w, box.h, pos, crop!.scale);
        return (
          <img
            src={item.previewUrl}
            alt={alt}
            draggable={false}
            style={{ position: 'absolute', left: s.left, top: s.top, width: s.width, height: s.height, maxWidth: 'none' }}
          />
        );
      })() : (
        <img
          src={item.previewUrl}
          alt={alt}
          draggable={false}
          onLoad={(e) => {
            const t = e.currentTarget;
            if (t.naturalWidth && t.naturalHeight) setNat({ w: t.naturalWidth, h: t.naturalHeight });
          }}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      )}
    </div>
  );
}
