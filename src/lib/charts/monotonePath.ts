/**
 * MONOTONE CUBIC INTERPOLATION (Fritsch–Carlson).
 *
 * Shared by every to-par curve on the platform — the friends tile's round
 * shape and the scorecard sheet's "How it unfolded" chart. ONE copy on
 * purpose: two curve functions drift, and then the same round draws two
 * different shapes on two adjacent surfaces.
 *
 * MONOTONE, NOT Catmull-Rom OR A BASIS SPLINE. A round is mostly flat runs of
 * pars; those overshoot and draw a birdie that never happened.
 */
export function monotonePath(pts: { x: number; y: number }[]): string {
  const n = pts.length;
  if (n < 2) return '';
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = pts[i + 1].x - pts[i].x;
    slope.push(dx === 0 ? 0 : (pts[i + 1].y - pts[i].y) / dx);
  }
  const m: number[] = new Array(n);
  m[0] = slope[0];
  m[n - 1] = slope[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (slope[i - 1] * slope[i] <= 0) {
      m[i] = 0;
    } else {
      const avg = (slope[i - 1] + slope[i]) / 2;
      const cap = 3 * Math.min(Math.abs(slope[i - 1]), Math.abs(slope[i]));
      m[i] = Math.sign(slope[i - 1]) * Math.min(Math.abs(avg), cap);
    }
  }
  let d = `M${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const dx = pts[i + 1].x - pts[i].x;
    const c1x = pts[i].x + dx / 3;
    const c1y = pts[i].y + (m[i] * dx) / 3;
    const c2x = pts[i + 1].x - dx / 3;
    const c2y = pts[i + 1].y - (m[i + 1] * dx) / 3;
    d += ` C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${pts[i + 1].x.toFixed(2)},${pts[i + 1].y.toFixed(2)}`;
  }
  return d;
}

export default monotonePath;
