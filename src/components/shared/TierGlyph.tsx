/**
 * TierGlyph -- stroke-only career-ladder tier glyphs.
 *
 * One glyph per WALL_LEVELS key. Bare stroke SVG on transparent
 * background; no discs, plates, or gem chips. Colour is fully
 * controlled by the caller so surfaces can apply the ladder rules
 * (achieved / locked / current / the_goat).
 */

import React from 'react';

export const TIER_KEYS = [
  'new_recruit',
  'rising_star',
  'season_regular',
  'team_captain',
  'national_squad',
  'amateur_champion',
  'tour_rookie',
  'contender',
  'hall_of_famer',
  'the_goat',
] as const;

export type TierKey = (typeof TIER_KEYS)[number];

interface Props {
  tierKey: TierKey;
  color: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function TierGlyph({
  tierKey,
  color,
  size = 22,
  strokeWidth = 1.7,
  className,
  style,
}: Props) {
  const common = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      style={style}
      aria-hidden
    >
      {tierKey === 'new_recruit' && (
        <g {...common}>
          <path d="M9 4 Q12 7 15 4" />
          <rect x="7" y="8" width="10" height="12" rx="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <path d="M9.5 17 Q12 15.5 14.5 17" />
        </g>
      )}
      {tierKey === 'rising_star' && (
        <g {...common}>
          <path d="M14 4.5 L15.6 8.2 L19.5 8.6 L16.6 11.2 L17.5 15 L14 13 L10.5 15 L11.4 11.2 L8.5 8.6 L12.4 8.2 Z" />
          <path d="M4 17.5 L7.5 15.5" />
          <path d="M4.5 20 L9 17.8" />
        </g>
      )}
      {tierKey === 'season_regular' && (
        <g {...common}>
          <rect x="4" y="5.5" width="16" height="14" rx="2" />
          <path d="M4 9.5 H20" />
          <path d="M8.5 5.5 V3.5" />
          <path d="M15.5 5.5 V3.5" />
          <path d="M9 14.5 L11.2 16.7 L15.5 12.4" />
        </g>
      )}
      {tierKey === 'team_captain' && (
        <g {...common}>
          <path d="M6 8 L12 12 L18 8" />
          <path d="M6 13 L12 17 L18 13" />
          <path d="M6 5 H18" />
        </g>
      )}
      {tierKey === 'national_squad' && (
        <g {...common}>
          <path d="M12 3.5 L18.5 5.5 V10.5 Q18.5 15.5 12 18.5 Q5.5 15.5 5.5 10.5 V5.5 Z" />
          <path d="M12 7.5 L13 9.7 L15.3 9.9 L13.6 11.4 L14.1 13.7 L12 12.5 L9.9 13.7 L10.4 11.4 L8.7 9.9 L11 9.7 Z" />
        </g>
      )}
      {tierKey === 'amateur_champion' && (
        <g {...common}>
          <circle cx="12" cy="9" r="5" />
          <path d="M9.5 13.3 L8 20 L12 17.5 L16 20 L14.5 13.3" />
        </g>
      )}
      {tierKey === 'tour_rookie' && (
        <g {...common}>
          <rect x="3.5" y="6" width="17" height="12" rx="2" />
          <circle cx="8.3" cy="11" r="1.9" />
          <path d="M6.2 15.2 Q8.3 13.6 10.4 15.2" />
          <path d="M13 9.5 H17.5" />
          <path d="M13 12 H17.5" />
          <path d="M13 14.5 H15.8" />
        </g>
      )}
      {tierKey === 'contender' && (
        <g {...common}>
          <path d="M12 3.5 Q14.5 7 16.2 9.6 Q18 12.4 17.2 15.2 Q16.2 19 12 19.8 Q7.8 19 6.8 15.2 Q6 12.4 7.8 9.6 Q9.5 7 12 3.5 Z" />
          <path d="M12 12 Q13.8 14 12.8 16.2 Q12.4 17.2 12 17.4 Q11.6 17.2 11.2 16.2 Q10.2 14 12 12 Z" />
        </g>
      )}
      {tierKey === 'hall_of_famer' && (
        <g {...common}>
          <rect x="4.5" y="5" width="15" height="14" rx="1.5" />
          <rect x="6.8" y="7.3" width="10.4" height="9.4" rx="0.8" />
          <path d="M12 9 L12.7 10.7 L14.5 10.9 L13.2 12.1 L13.6 13.9 L12 13 L10.4 13.9 L10.8 12.1 L9.5 10.9 L11.3 10.7 Z" />
        </g>
      )}
      {tierKey === 'the_goat' && (
        <g {...common}>
          <path d="M5 17 L5 8.5 L9 12 L12 6.5 L15 12 L19 8.5 L19 17 Z" />
          <path d="M5 19.5 H19" />
        </g>
      )}
    </svg>
  );
}

export default TierGlyph;
