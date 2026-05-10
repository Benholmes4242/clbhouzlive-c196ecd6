import React, { useLayoutEffect, useRef, useState } from 'react';

/**
 * useElasticT — measures a referenced element's rendered height and returns
 * a normalized 0..1 scale parameter based on min/max bounds. Useful for
 * scaling siblings of an ElasticZone (e.g. LEADER/CHAMPION blocks) so the
 * entire hero — header AND lower content — grows on tall devices and tightens
 * on short ones, with no dead space.
 */
export function useElasticT(
  ref: React.RefObject<HTMLElement>,
  minH: number,
  maxH: number,
): number {
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
  }, [ref, minH, maxH]);
  return t;
}

/** Linear interpolation helper for elastic scaling. */
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

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
        justifyContent: 'flex-start',
        ...style,
      }}
    >
      {children(t)}
    </div>
  );
}
