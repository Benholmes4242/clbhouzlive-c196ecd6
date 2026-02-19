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

/** Distance icon - Tee marker */
export const DistanceIcon: React.FC<IconProps> = ({ className = '', size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 3v18" /><path d="M6 3l10 5-10 5" /><path d="M3 21h6" />
  </svg>
);

/** Accuracy icon - Concentric target */
export const AccuracyIcon: React.FC<IconProps> = ({ className = '', size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
);

/** Scrambling icon */
export const ScramblingIcon: React.FC<IconProps> = ({ className = '', size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" />
  </svg>
);

/** Putting icon */
export const PuttingIcon: React.FC<IconProps> = ({ className = '', size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 15v6h16" /><path d="M12 4v11" /><path d="M12 4l6 3-6 3" /><circle cx="18" cy="18" r="2.5" />
  </svg>
);

/** Overall/Trophy icon */
export const OverallIcon: React.FC<IconProps> = ({ className = '', size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

/** Scoring icon - Clipboard/scorecard */
export const ScoringIcon: React.FC<IconProps> = ({ className = '', size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" />
    <path d="M9 12h6" /><path d="M9 16h6" />
  </svg>
);

/** GIR icon - Checkmark in circle */
export const GirIcon: React.FC<IconProps> = ({ className = '', size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
  </svg>
);

/** Sand Saves icon - Bunker/wave */
export const SandSavesIcon: React.FC<IconProps> = ({ className = '', size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 17c2-2 4-2 6 0s4 2 6 0 4-2 6 0" /><path d="M2 21c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
    <circle cx="12" cy="9" r="4" />
  </svg>
);

/** World Rank icon - Globe */
export const WorldRankIcon: React.FC<IconProps> = ({ className = '', size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" />
  </svg>
);

/** Events icon - Calendar */
export const EventsIcon: React.FC<IconProps> = ({ className = '', size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" />
  </svg>
);

/** Cuts Made icon - Scissors/cut line */
export const CutsMadeIcon: React.FC<IconProps> = ({ className = '', size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M20 4 8.12 15.88" /><path d="M14.47 14.48 20 20" /><path d="M8.12 8.12 12 12" />
  </svg>
);

/** Top 10s icon - Medal/star */
export const Top10Icon: React.FC<IconProps> = ({ className = '', size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" />
  </svg>
);

/** Earnings icon - Dollar sign */
export const EarningsIcon: React.FC<IconProps> = ({ className = '', size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

/** Bar chart icon for avg strip */
export const BarChartIcon: React.FC<IconProps> = ({ className = '', size = 13, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
  </svg>
);

export type CategoryId =
  | 'sg_total'
  | 'scoring_avg'
  | 'earnings'
  | 'distance'
  | 'accuracy'
  | 'gir_pct'
  | 'putting'
  | 'scrambling'
  | 'sand_saves';

export const CATEGORY_ICONS: Record<CategoryId, React.FC<IconProps>> = {
  sg_total: OverallIcon,
  scoring_avg: ScoringIcon,
  earnings: EarningsIcon,
  distance: DistanceIcon,
  accuracy: AccuracyIcon,
  gir_pct: GirIcon,
  putting: PuttingIcon,
  scrambling: ScramblingIcon,
  sand_saves: SandSavesIcon,
};
