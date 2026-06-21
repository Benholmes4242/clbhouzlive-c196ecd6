import React from 'react';

interface Props {
  /** Opacity of the white motif. Default 0.12. */
  opacity?: number;
}

/**
 * Concentric putting-green rings overlay sized to its parent. Renders
 * ABOVE the gradient/photo and BELOW the atmospheric/legibility scrims.
 *
 * (Component name retained for import stability — it now draws rings,
 * not a flag.)
 */
export const FlagSilhouetteOverlay: React.FC<Props> = ({ opacity = 0.12 }) => (
  <svg
    viewBox="0 0 100 100"
    preserveAspectRatio="xMidYMid meet"
    style={{
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      opacity,
      color: '#ffffff',
      pointerEvents: 'none',
    }}
    aria-hidden="true"
  >
    <g fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="50" cy="50" r="40" />
      <circle cx="50" cy="50" r="28" />
      <circle cx="50" cy="50" r="16" />
      <circle cx="50" cy="50" r="5" fill="currentColor" />
    </g>
  </svg>
);

export default FlagSilhouetteOverlay;
