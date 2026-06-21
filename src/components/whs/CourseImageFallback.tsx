import React from 'react';

/**
 * Fallback visual for when a course thumbnail can't be resolved.
 * Sage green gradient with concentric putting-green rings at low opacity.
 *
 * `flagOpacity` (motif opacity — name retained for call-site stability)
 * defaults to 0.3, which reads well for the rings at most tile sizes.
 */
interface Props {
  /** Opacity of the white motif. Default 0.3. */
  flagOpacity?: number;
  /** Optional override for the gradient direction. Default 135deg. */
  gradientAngle?: number;
}

export const CourseImageFallback: React.FC<Props> = ({
  flagOpacity = 0.3,
  gradientAngle = 135,
}) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      background: `linear-gradient(${gradientAngle}deg, #46665a 0%, #2f4a40 100%)`,
    }}
    aria-hidden="true"
  >
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        opacity: flagOpacity,
        color: '#ffffff',
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
  </div>
);

export default CourseImageFallback;
