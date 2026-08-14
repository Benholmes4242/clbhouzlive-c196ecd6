import React from 'react';
import { adminTheme as t } from '../theme';

/**
 * Shared Dashboard primitives. Built once, used by every panel.
 */

// ─── Panel chrome ─────────────────────────────────────────────────────────────

export const CARD: React.CSSProperties = {
  background: t.surface,
  border: `1px solid ${t.line}`,
  borderRadius: 18,
  boxShadow: t.shadowCard,
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

/**
 * NO AMBER ON THE DASHBOARD. The kicker was brand amber; it is now ink white.
 * Only the Dashboard's own components import KICKER from here (Health and
 * Analytics import only formatDurationShort / the chart helpers), so this is a
 * Dashboard-scoped change despite living in a shared module.
 */
export const KICKER: React.CSSProperties = {
  color: t.ink,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0.6,
  textTransform: 'uppercase',
};

export const LABEL: React.CSSProperties = {
  color: t.inkFaint,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: 0.3,
};

export const FIG: React.CSSProperties = {
  fontFeatureSettings: '"tnum" 1, "kern" 1, "liga" 1',
  fontVariantNumeric: 'tabular-nums',
};

export const num = (n: number) => n.toLocaleString();

/**
 * S6 SKELETON RULE. Unresolved is not absent: while a query is in flight the
 * panel renders this, never a zero, a dash or an empty state. An empty state is
 * a claim about the data and may only render once the query has settled.
 */
export function Skeleton({ height, radius }: { height: number; radius?: number }) {
  return (
    <div style={{
      height,
      background: t.canvas,
      borderRadius: radius ?? t.radius.md,
      animation: 'admin-pulse 1.4s ease-in-out infinite',
    }} />
  );
}

// ─── S1 One duration formatter ────────────────────────────────────────────────

/** Seconds in, short string out. No decimals, no compounds, no "about". */
export function formatDurationShort(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

// ─── S2 Monotone cubic (Fritsch-Carlson) ──────────────────────────────────────

/**
 * Fritsch-Carlson monotone cubic interpolation. NOT a cardinal spline: a naive
 * spline overshoots between points and would draw member activity that never
 * happened. The t[i] = 0 clamp at a direction change is what prevents it.
 */
export function monotonePath(pts: { x: number; y: number }[]): string {
  const n = pts.length;
  if (n === 0) return '';
  if (n === 1) return `M${pts[0].x},${pts[0].y}`;
  if (n === 2) return `M${pts[0].x},${pts[0].y} L${pts[1].x},${pts[1].y}`;

  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = pts[i + 1].x - pts[i].x;
    m.push(dx === 0 ? 0 : (pts[i + 1].y - pts[i].y) / dx);
  }

  const tan: number[] = new Array(n);
  tan[0] = m[0];
  tan[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) {
      tan[i] = 0;
    } else {
      const avg = (m[i - 1] + m[i]) / 2;
      const cap = 3 * Math.min(Math.abs(m[i - 1]), Math.abs(m[i]));
      tan[i] = Math.sign(m[i - 1]) * Math.min(Math.abs(avg), cap);
    }
  }

  let d = `M${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const dx = pts[i + 1].x - pts[i].x;
    const c1x = pts[i].x + dx / 3;
    const c1y = pts[i].y + (tan[i] * dx) / 3;
    const c2x = pts[i + 1].x - dx / 3;
    const c2y = pts[i + 1].y - (tan[i + 1] * dx) / 3;
    d += ` C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${pts[i + 1].x.toFixed(2)},${pts[i + 1].y.toFixed(2)}`;
  }
  return d;
}

// ─── S3 Real-pixel end dot ────────────────────────────────────────────────────

/** Container pixel width, for placing the end dot in real pixels. */
export function useElementWidth<T extends HTMLElement>() {
  const ref = React.useRef<T | null>(null);
  const [width, setWidth] = React.useState(0);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

/**
 * An HTML element, NOT an SVG <circle>: the charts use
 * preserveAspectRatio="none", which stretches the viewBox horizontally and
 * renders a circle as an ellipse. Its ring is `surface`, never white - white
 * punches a hole in a dark chart.
 */
export function EndDot({ left, top, color }: { left: number; top: number; color: string }) {
  return (
    <span
      aria-hidden
      style={{
        position: 'absolute',
        left: left - 4,
        top: top - 4,
        width: 8,
        height: 8,
        borderRadius: 999,
        background: color,
        boxShadow: `0 0 0 2px ${t.surface}`,
        pointerEvents: 'none',
      }}
    />
  );
}

// ─── S5 Four ticks, ends emphasised ───────────────────────────────────────────

/**
 * HTML below the SVG, not SVG <text> - SVG text inside a stretched viewBox is
 * what produced the clipped-axis fault.
 */
export function AxisTicks({ labels }: { labels: string[] }) {
  const last = labels.length - 1;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
      {labels.map((l, i) => (
        <span
          key={`${l}-${i}`}
          style={{
            ...LABEL,
            ...FIG,
            color: i === 0 || i === last ? t.inkMuted : t.inkFaint,
            fontWeight: 600,
          }}
        >
          {l}
        </span>
      ))}
    </div>
  );
}

/** Four indices across a series: first, two interior, last. */
export function fourTickIndices(length: number): number[] {
  if (length <= 1) return [0];
  if (length <= 4) return Array.from({ length }, (_, i) => i);
  const last = length - 1;
  return [0, Math.round(last / 3), Math.round((2 * last) / 3), last];
}
