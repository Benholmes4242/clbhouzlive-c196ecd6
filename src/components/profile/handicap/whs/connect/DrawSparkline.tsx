import React, { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Stroke-only micro line that DRAWS left to right with a CLIP REVEAL.
 *
 * NOT stroke-dasharray. getTotalLength() measures the path in the SVG's user
 * units; any non-uniform stretch of the box makes the dash length disagree with
 * the rendered path and the dash visibly wraps mid-line. clip-path clips the
 * RENDERED box, so it is immune to scaling.
 *
 * Reduced motion: the line renders complete. Guarded twice - in JS (initial
 * state) and in CSS (media query overriding clip-path + transition).
 */
interface Props {
  values: number[];
  color: string;
  w?: number;
  h?: number;
  /** ms before the draw starts. */
  delay?: number;
  /** ms the draw takes. */
  duration?: number;
  /** change to replay (e.g. when real history replaces the preview). */
  replayKey?: string | number;
}

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

export const DrawSparkline: React.FC<Props> = ({
  values,
  color,
  w = 118,
  h = 34,
  delay = 200,
  duration = 1400,
  replayKey,
}) => {
  const reduced = useRef(prefersReduced());
  const [drawn, setDrawn] = useState(() => reduced.current);

  useEffect(() => {
    if (reduced.current) {
      setDrawn(true);
      return;
    }
    setDrawn(false);
    const t = window.setTimeout(() => setDrawn(true), delay);
    return () => window.clearTimeout(t);
  }, [delay, replayKey, values.length]);

  const d = useMemo(() => {
    if (!values || values.length < 2) return null;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const pad = 2.5;
    return values
      .map((v, i) => {
        const x = pad + (i / (values.length - 1)) * (w - pad * 2);
        const y = pad + (1 - (v - min) / span) * (h - pad * 2);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');
  }, [values, w, h]);

  if (!d) return null;

  return (
    <div
      className="whs-draw"
      style={{
        width: w,
        height: h,
        clipPath: drawn ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
        transition: `clip-path ${duration}ms cubic-bezier(0.22,0.61,0.36,1)`,
        willChange: 'clip-path',
      }}
      aria-hidden
    >
      <svg width={w} height={h} style={{ display: 'block' }}>
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .whs-draw { clip-path: inset(0 0 0 0) !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
};

export default DrawSparkline;
