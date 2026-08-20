/**
 * TANGENT-BASED CUBIC SMOOTHING, tension 0.25.
 *
 * ONE copy, shared by every round/index curve on the platform — the handicap
 * strip (HcpStrip), the Discover round shape (RoundShape) and the scorecard /
 * feed trajectory (TrajectoryLine). Two smoothing functions drift, and then the
 * same round draws two different shapes on two adjacent surfaces.
 *
 * IT PASSES THROUGH EVERY SUPPLIED POINT. Corners are rounded; the points are
 * never moved. NOT a basis spline: a basis spline does not interpolate its
 * points at all, so a run of pars would be drawn as a dip and a member would
 * appear under par on a hole they bogeyed. That is a false statement, not a
 * styling choice.
 *
 * Interior tangents are the centred difference, so a FLAT RUN OF EQUAL VALUES
 * has zero vertical tangent at every interior point and draws perfectly flat.
 */

export type SmoothPoint = { x: number; y: number };

const TENSION = 0.25; // 0 = straight lines, higher = rounder

export function smoothPath(points: readonly SmoothPoint[]): string {
  const n = points.length;
  if (n === 0) return '';
  if (n === 1) return `M${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`;

  const tangents: SmoothPoint[] = points.map((p, i) => {
    if (i === 0) {
      const next = points[1];
      return { x: next.x - p.x, y: next.y - p.y };
    }
    if (i === n - 1) {
      const prev = points[i - 1];
      return { x: p.x - prev.x, y: p.y - prev.y };
    }
    const prev = points[i - 1];
    const next = points[i + 1];
    return { x: (next.x - prev.x) / 2, y: (next.y - prev.y) / 2 };
  });

  let d = `M${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`;
  for (let i = 0; i < n - 1; i += 1) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const t0 = tangents[i];
    const t1 = tangents[i + 1];

    const c1x = p0.x + t0.x * TENSION;
    const c1y = p0.y + t0.y * TENSION;
    const c2x = p1.x - t1.x * TENSION;
    const c2y = p1.y - t1.y * TENSION;

    d += ` C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p1.x.toFixed(2)},${p1.y.toFixed(2)}`;
  }
  return d;
}

/** Tuple convenience for callers that already hold [x, y] pairs (HcpStrip). */
export function smoothPathXY(points: readonly (readonly [number, number])[]): string {
  return smoothPath(points.map(([x, y]) => ({ x, y })));
}

export default smoothPath;
