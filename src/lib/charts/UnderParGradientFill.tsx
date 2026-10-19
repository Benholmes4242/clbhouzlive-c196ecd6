import type { SmoothPoint } from './smoothPath';

/** Shared Explore/Home area mechanism only: callers own their curve, scale,
 * earned-red gate and per-instance IDs. Surface-specific colour is supplied,
 * so photo legibility never changes the Home canvas's scoring palette.
 * Density is anchored to the plot bottom, deliberately not the trace minimum.
 */
const UNDER_FILL_TOP = 0.12;
const UNDER_FILL_BOTTOM = 0.5;

export function UnderParGradientFill({
  path, points, baselineY, bottom, width, clipId, gradientId, color,
}: {
  path: string;
  points: readonly SmoothPoint[];
  baselineY: number;
  bottom: number;
  width: number;
  clipId: string;
  gradientId: string;
  color: string;
}) {
  const first = points[0];
  const last = points.at(-1);
  const underFillPath = first && last
    ? `${path} L${last.x.toFixed(2)},${baselineY.toFixed(2)} L${first.x.toFixed(2)},${baselineY.toFixed(2)} Z`
    : null;

  return (
    <>
      <defs>
        <clipPath id={clipId}>
          <rect x={0} y={baselineY} width={width} height={Math.max(bottom - baselineY, 0)} />
        </clipPath>
        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1={0} y1={baselineY} x2={0} y2={bottom}>
          <stop offset="0%" stopColor={color} stopOpacity={UNDER_FILL_TOP} />
          <stop offset="100%" stopColor={color} stopOpacity={UNDER_FILL_BOTTOM} />
        </linearGradient>
      </defs>
      {underFillPath ? (
        <path
          data-round-under-par-fill="true"
          d={underFillPath}
          fill={`url(#${gradientId})`}
          clipPath={`url(#${clipId})`}
        />
      ) : null}
    </>
  );
}