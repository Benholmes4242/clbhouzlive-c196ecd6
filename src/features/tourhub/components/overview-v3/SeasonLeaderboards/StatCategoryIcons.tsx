/**
 * StatCategoryIcons - SVG icon components for each stat category
 * 
 * Icons: 13x13px, stroke-based, strokeWidth 2.4, strokeLinecap round
 * Monochrome — inherits currentColor
 */

import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}

/** Distance icon - Tee marker: triangle flag on a vertical line with base */
export const DistanceIcon: React.FC<IconProps> = ({ className = '', size = 13 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M6 3v18" />
    <path d="M6 3l10 5-10 5" />
    <path d="M3 21h6" />
  </svg>
);

/** Accuracy icon - Concentric target: 3 circles (r=10, r=6, r=2) */
export const AccuracyIcon: React.FC<IconProps> = ({ className = '', size = 13 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

/** Scrambling icon - Pencil/edit: angled pen with edit path */
export const ScramblingIcon: React.FC<IconProps> = ({ className = '', size = 13 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </svg>
);

/** Putting icon - Flag + hole: circle bottom-right, vertical line to horizontal line */
export const PuttingIcon: React.FC<IconProps> = ({ className = '', size = 13 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 15v6h16" />
    <path d="M12 4v11" />
    <path d="M12 4l6 3-6 3" />
    <circle cx="18" cy="18" r="2.5" />
  </svg>
);

/** Overall icon - Trophy: cup with handles, base, and pedestal */
export const OverallIcon: React.FC<IconProps> = ({ className = '', size = 13 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

/** Bar chart icon for avg strip - 3 vertical bars */
export const BarChartIcon: React.FC<IconProps> = ({ className = '', size = 13, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    <path d="M12 20V10" />
    <path d="M18 20V4" />
    <path d="M6 20v-4" />
  </svg>
);

export type CategoryId = 'distance' | 'accuracy' | 'scrambling' | 'putting' | 'sg_total';

export const CATEGORY_ICONS: Record<CategoryId, React.FC<IconProps>> = {
  distance: DistanceIcon,
  accuracy: AccuracyIcon,
  scrambling: ScramblingIcon,
  putting: PuttingIcon,
  sg_total: OverallIcon,
};
