import React from 'react';

interface Props {
  /** Opacity of the white flag glyph. Default 0.12. */
  opacity?: number;
}

/**
 * White flag-pin silhouette overlay sized to its parent. Renders ABOVE
 * the gradient/photo and BELOW the atmospheric/legibility scrims so the
 * scrims darken the flag along with everything else.
 *
 * Use as a sibling layer when no real course thumbnail is available
 * — keeps the Cinema golden-hour gradient feeling intentional rather
 * than empty.
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
    <g fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <line x1="32" y1="20" x2="32" y2="82" />
      <path d="M32 22 L70 32 L32 42 Z" />
      <circle cx="34" cy="84" r="3" />
    </g>
  </svg>
);

export default FlagSilhouetteOverlay;
