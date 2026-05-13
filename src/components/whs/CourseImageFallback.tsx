import React from 'react';

/**
 * Fallback visual for when a course thumbnail can't be resolved.
 * Dark green gradient with a white outlined flag at low opacity.
 *
 * Mirrors the pattern from FriendRoundCard (recently-played section)
 * so missing-thumbnail states across the app feel like one family.
 *
 * `flagOpacity` defaults to 0.08 (matches FriendRoundCard) but should
 * be raised to ~0.18 at small tile sizes (56–88px) where 8% is too
 * faint to read.
 */
interface Props {
  /** Opacity of the white flag glyph. Default 0.08. */
  flagOpacity?: number;
  /** Optional override for the gradient direction. Default 135deg. */
  gradientAngle?: number;
}

export const CourseImageFallback: React.FC<Props> = ({
  flagOpacity = 0.08,
  gradientAngle = 135,
}) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      background: `linear-gradient(${gradientAngle}deg, #1a3c2a 0%, #0f172a 100%)`,
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
      <g fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
        <line x1="32" y1="20" x2="32" y2="82" />
        <path d="M32 22 L70 32 L32 42 Z" />
        <circle cx="34" cy="84" r="3" />
      </g>
    </svg>
  </div>
);

export default CourseImageFallback;
