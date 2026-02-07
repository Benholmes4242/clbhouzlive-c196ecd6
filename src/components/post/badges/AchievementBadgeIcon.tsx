import React from 'react';

type BadgeIconProps = {
  className?: string;
};

// Flat, consistent SVG icons for achievement badges
// Single or 2-tone max, no emojis

// Breaking 100 — single star outline (beginner milestone)
export const Breaking100Icon = ({ className = "w-6 h-6" }: BadgeIconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L14.5 9H22L16 13.5L18.5 21L12 16.5L5.5 21L8 13.5L2 9H9.5L12 2Z" fill="currentColor" opacity="0.2"/>
    <path d="M12 2L14.5 9H22L16 13.5L18.5 21L12 16.5L5.5 21L8 13.5L2 9H9.5L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
);

// Breaking 90 — star with "90" numeral
export const Breaking90Icon = ({ className = "w-6 h-6" }: BadgeIconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L14.5 9H22L16 13.5L18.5 21L12 16.5L5.5 21L8 13.5L2 9H9.5L12 2Z" fill="currentColor" opacity="0.2"/>
    <path d="M12 2L14.5 9H22L16 13.5L18.5 21L12 16.5L5.5 21L8 13.5L2 9H9.5L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <text x="12" y="13.5" textAnchor="middle" fill="currentColor" fontSize="6" fontWeight="700" fontFamily="system-ui">90</text>
  </svg>
);

// Breaking 80 — double star (advanced)
export const Breaking80Icon = ({ className = "w-6 h-6" }: BadgeIconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 1L14 6.5H20L15.2 10L17 16L12 12.5L7 16L8.8 10L4 6.5H10L12 1Z" fill="currentColor" opacity="0.2"/>
    <path d="M12 1L14 6.5H20L15.2 10L17 16L12 12.5L7 16L8.8 10L4 6.5H10L12 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M12 14L13.5 18H17.5L14.5 20.5L15.8 24L12 21.5L8.2 24L9.5 20.5L6.5 18H10.5L12 14Z" fill="currentColor" opacity="0.3"/>
    <path d="M12 14L13.5 18H17.5L14.5 20.5L15.8 24L12 21.5L8.2 24L9.5 20.5L6.5 18H10.5L12 14Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
  </svg>
);

// Breaking 70 — filled solid star (elite)
export const Breaking70Icon = ({ className = "w-6 h-6" }: BadgeIconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" fill="currentColor" opacity="0.6"/>
    <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="2.5" fill="currentColor" opacity="0.4"/>
  </svg>
);

export const HoleInOneIcon = ({ className = "w-6 h-6" }: BadgeIconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.15"/>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.3"/>
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
  </svg>
);

export const AlbatrossIcon = ({ className = "w-6 h-6" }: BadgeIconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4C12 4 8 8 4 10C4 10 8 11 12 11C16 11 20 10 20 10C16 8 12 4 12 4Z" fill="currentColor" opacity="0.2"/>
    <path d="M12 4C12 4 8 8 4 10C4 10 8 11 12 11C16 11 20 10 20 10C16 8 12 4 12 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M12 11V18M8 20H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="12" cy="7" r="1" fill="currentColor"/>
  </svg>
);

export const EagleIcon = ({ className = "w-6 h-6" }: BadgeIconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5L14 9L18 10L15 13L16 17L12 15L8 17L9 13L6 10L10 9L12 5Z" fill="currentColor" opacity="0.2"/>
    <path d="M12 5L14 9L18 10L15 13L16 17L12 15L8 17L9 13L6 10L10 9L12 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M3 19L7 15M21 19L17 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const BirdieIcon = ({ className = "w-6 h-6" }: BadgeIconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="10" r="5" fill="currentColor" opacity="0.15"/>
    <circle cx="12" cy="10" r="5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M10 9.5C10 9.5 11 11 14 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="10" cy="8.5" r="0.75" fill="currentColor"/>
    <path d="M7 13L5 16M17 13L19 16M9 15L8 19M15 15L16 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const PersonalBestIcon = ({ className = "w-6 h-6" }: BadgeIconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" fill="currentColor" opacity="0.2"/>
    <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
);

export const BestFront9Icon = ({ className = "w-6 h-6" }: BadgeIconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="6" width="16" height="12" rx="2" fill="currentColor" opacity="0.15"/>
    <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M12 6V18" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2"/>
    <circle cx="8" cy="12" r="2" fill="currentColor"/>
  </svg>
);

export const BestBack9Icon = ({ className = "w-6 h-6" }: BadgeIconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="6" width="16" height="12" rx="2" fill="currentColor" opacity="0.15"/>
    <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M12 6V18" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2"/>
    <circle cx="16" cy="12" r="2" fill="currentColor"/>
  </svg>
);

export const LongestDriveIcon = ({ className = "w-6 h-6" }: BadgeIconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M4 12H16M16 12L12 8M16 12L12 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="19" cy="12" r="2" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M4 18L6 16L8 18L10 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
  </svg>
);

export const TournamentIcon = ({ className = "w-6 h-6" }: BadgeIconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M8 21H16M12 17V21M6 3H18V6C18 9.31 15.31 12 12 12C8.69 12 6 9.31 6 6V3Z" fill="currentColor" opacity="0.15"/>
    <path d="M8 21H16M12 17V21M6 3H18V6C18 9.31 15.31 12 12 12C8.69 12 6 9.31 6 6V3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 5H4V7C4 8.1 4.9 9 6 9V5ZM18 5H20V7C20 8.1 19.1 9 18 9V5Z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M12 12V17" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

export const AwayCourseIcon = ({ className = "w-6 h-6" }: BadgeIconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="10" r="7" fill="currentColor" opacity="0.15"/>
    <circle cx="12" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M12 3V5M12 15V17M5 10H7M17 10H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M8 20L12 17L16 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const MatchPlayIcon = ({ className = "w-6 h-6" }: BadgeIconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="10" r="4" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="16" cy="10" r="4" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M8 14V18M16 14V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M10 20H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M12 7V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// Icon map for easy lookup by badge ID
export const BADGE_ICONS: Record<string, React.FC<BadgeIconProps>> = {
  'break-100': Breaking100Icon,
  'break-90': Breaking90Icon,
  'break-80': Breaking80Icon,
  'break-70': Breaking70Icon,
  'hio': HoleInOneIcon,
  'albatross': AlbatrossIcon,
  'eagle': EagleIcon,
  'birdie': BirdieIcon,
  'pb': PersonalBestIcon,
  'best-front-9': BestFront9Icon,
  'best-back-9': BestBack9Icon,
  'longest-drive': LongestDriveIcon,
  'tournament': TournamentIcon,
  'away-course': AwayCourseIcon,
  'match-play': MatchPlayIcon,
};

export const getBadgeIcon = (badgeId: string): React.FC<BadgeIconProps> | null => {
  return BADGE_ICONS[badgeId] || null;
};
