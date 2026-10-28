import React from 'react';

/**
 * THE NAV ICON SET IS OUTLINE, NOT FILLED (BRIEF_ISLANDS_NAV §1 — supersedes
 * the old filled-set note in navigationTabs.ts). 24 viewBox, round caps and
 * joins, stroke-only. Paths are the signed-off mock's exact drawings; the
 * filled components in src/components/icons/ remain for their other consumers
 * (e.g. StatRow's TrophyIcon) and are deliberately untouched.
 */

export interface NavIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}

const NavSvg: React.FC<NavIconProps & { children: React.ReactNode }> = ({
  size = 22,
  color = 'currentColor',
  strokeWidth = 1.8,
  style,
  children,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    style={{ display: 'block', flexShrink: 0, ...style }}
  >
    {children}
  </svg>
);

export const HomeNavIcon: React.FC<NavIconProps> = (p) => (
  <NavSvg {...p}>
    <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
  </NavSvg>
);

export const ExploreNavIcon: React.FC<NavIconProps> = (p) => (
  <NavSvg {...p}>
    <circle cx={12} cy={12} r={10} />
    <path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
  </NavSvg>
);

export const CoursesNavIcon: React.FC<NavIconProps> = (p) => (
  <NavSvg {...p}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx={12} cy={10} r={3} />
  </NavSvg>
);

/** lucide Trophy. */
export const TourNavIcon: React.FC<NavIconProps> = (p) => (
  <NavSvg {...p}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </NavSvg>
);

export const ShareNavIcon: React.FC<NavIconProps> = (p) => (
  <NavSvg {...p}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </NavSvg>
);
