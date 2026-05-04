import React from 'react';
import { shimmerStyle } from '../../utils/skeletonStyles';

/**
 * <Shimmer /> — single shared placeholder primitive used by every Tour Hero
 * and Player Scorecard skeleton. Always responsive — pass `%`, `flex` via
 * the parent, or `clamp()` rather than hardcoded pixel widths for text rows.
 * Fixed pixel sizes are only OK for circular avatars / icons.
 */
export function Shimmer({
  width,
  height,
  radius = 6,
  style = {},
}: {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: width ?? '100%',
        height: height ?? '100%',
        borderRadius: radius,
        ...shimmerStyle,
        ...style,
      }}
    />
  );
}
