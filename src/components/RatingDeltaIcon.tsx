import * as React from 'react';

type RatingDeltaIconProps = {
  direction: 'up' | 'down';
  className?: string;
};

/**
 * Small chevron-style SVG used beside the
 * "You rate this course…" comparison text.
 * Inherits `currentColor` so it matches text colour.
 */
export const RatingDeltaIcon: React.FC<RatingDeltaIconProps> = ({
  direction,
  className = '',
}) => {
  const isUp = direction === 'up';

  return (
    <svg
      className={`w-3.5 h-3.5 text-slate-400 ${className}`}
      viewBox="0 0 16 16"
      aria-hidden="true"
    >
      <path
        d={
          isUp
            ? 'M4 10.5L8 6.5L12 10.5' // up chevron
            : 'M4 5.5L8 9.5L12 5.5' // down chevron
        }
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
