/**
 * Monotone cubic interpolation, Fritsch-Carlson tangents.
 *
 * The guarantee we need is that the curve NEVER leaves the range of its own
 * data, so the member's line cannot dip under par on a hole they bogeyed. A
 * Catmull-Rom / naive spline overshoots exactly there.
 */
export function monotonePath(pts: { x: number; y: number }[]): string {
  const n = pts.length;
  if (n < 2) return '';
  const dx: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1].x - pts[i].x);
    slope.push(dx[i] === 0 ? 0 : (pts[i + 1].y - pts[i].y) / dx[i]);
  }
  const m: number[] = new Array(n);
  m[0] = slope[0];
  m[n - 1] = slope[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (slope[i - 1] * slope[i] <= 0) m[i] = 0;
    else m[i] = (slope[i - 1] + slope[i]) / 2;
  }
  // Fritsch-Carlson limiter - clamps tangents so no segment overshoots.
  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / slope[i];
    const b = m[i + 1] / slope[i];
    const s = a * a + b * b;
    if (s > 9) {
      const tau = 3 / Math.sqrt(s);
      m[i] = tau * a * slope[i];
      m[i + 1] = tau * b * slope[i];
    }
  }
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    const c1x = pts[i].x + h;
    const c1y = pts[i].y + m[i] * h;
    const c2x = pts[i + 1].x - h;
    const c2y = pts[i + 1].y - m[i + 1] * h;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${pts[i + 1].x.toFixed(2)} ${pts[i + 1].y.toFixed(2)}`;
  }
  return d;
}

/** Course-chart bar: 3px top corners and 1px baseline corners. */
export function roundedCourseBarPath(x: number, top: number, width: number, height: number): string {
  const topRadius = Math.min(3, width / 2);
  const bottomRadius = Math.min(1, width / 2);
  return [
    `M ${x} ${top + topRadius}`,
    `Q ${x} ${top} ${x + topRadius} ${top}`,
    `L ${x + width - topRadius} ${top}`,
    `Q ${x + width} ${top} ${x + width} ${top + topRadius}`,
    `L ${x + width} ${top + height - bottomRadius}`,
    `Q ${x + width} ${top + height} ${x + width - bottomRadius} ${top + height}`,
    `L ${x + bottomRadius} ${top + height}`,
    `Q ${x} ${top + height} ${x} ${top + height - bottomRadius}`,
    'Z',
  ].join(' ');
}