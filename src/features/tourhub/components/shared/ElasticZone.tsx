import React, { useLayoutEffect, useRef, useState } from 'react';

/**
 * <ElasticZone> — flex:1 wrapper that measures its own rendered height and
 * computes a normalized scale parameter `t` (0..1) based on min/max bounds.
 *
 * Children are rendered via render-prop and receive `t`, allowing them to
 * scale typography/avatars/numerics proportionally so the hero header band
 * absorbs slack on tall devices and tightens on short ones, with no internal
 * scroll and no empty band below the CTA.
 */
export interface ElasticZoneProps {
  /** Height (px) at which `t` = 0. */
  minH: number;
  /** Height (px) at which `t` = 1. */
  maxH: number;
  /** Render-prop: receives normalized 0..1 scale parameter. */
  children: (t: number) => React.ReactNode;
  style?: React.CSSProperties;
}

export function ElasticZone({ minH, maxH, children, style }: ElasticZoneProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const h = el.getBoundingClientRect().height;
      const next = Math.max(0, Math.min(1, (h - minH) / Math.max(1, maxH - minH)));
      setT(prev => (Math.abs(prev - next) > 0.01 ? next : prev));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [minH, maxH]);

  return (
    <div
      ref={ref}
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        ...style,
      }}
    >
      {children(t)}
    </div>
  );
}
