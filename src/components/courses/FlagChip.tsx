import React from 'react';

interface FlagChipProps {
  slug: 'global' | 'usa' | 'gb-i' | 'europe';
  size?: number;
}

/**
 * Shared inline-SVG flag chip — replaces emoji/CDN rendering for cross-platform consistency.
 * Used in rank badges on UnifiedCourseCard. Add new variants here as needed.
 */
export const FlagChip: React.FC<FlagChipProps> = ({ slug, size = 12 }) => {
  const w = Math.round(size * 1.3);
  const h = size;

  if (slug === 'global') {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" style={{ display: 'block' }}>
        <circle cx="8" cy="8" r="6.5" stroke="#fff" strokeWidth="1.4" fill="none" />
        <path d="M1.5 8 H14.5 M8 1.5 V14.5" stroke="#fff" strokeWidth="1.0" fill="none" />
        <ellipse cx="8" cy="8" rx="3" ry="6.5" stroke="#fff" strokeWidth="1.0" fill="none" />
      </svg>
    );
  }

  if (slug === 'usa') {
    return (
      <svg width={w} height={h} viewBox="0 0 16 12" style={{ borderRadius: 1, display: 'block' }}>
        <rect width="16" height="12" fill="#B22234" />
        {[1, 3, 5, 7, 9, 11].map(y => (
          <rect key={y} y={y} width="16" height="1" fill="#fff" />
        ))}
        <rect width="7" height="6" fill="#3C3B6E" />
      </svg>
    );
  }

  if (slug === 'gb-i') {
    return (
      <svg width={w} height={h} viewBox="0 0 16 12" style={{ borderRadius: 1, display: 'block' }}>
        <rect width="16" height="12" fill="#012169" />
        <path d="M0,0 L16,12 M16,0 L0,12" stroke="#fff" strokeWidth="2" />
        <path d="M0,0 L16,12 M16,0 L0,12" stroke="#C8102E" strokeWidth="1.2" />
        <path d="M8,0 L8,12 M0,6 L16,6" stroke="#fff" strokeWidth="3" />
        <path d="M8,0 L8,12 M0,6 L16,6" stroke="#C8102E" strokeWidth="1.6" />
      </svg>
    );
  }

  if (slug === 'europe') {
    return (
      <svg width={w} height={h} viewBox="0 0 16 12" style={{ borderRadius: 1, display: 'block' }}>
        <rect width="16" height="12" fill="#003399" />
        {[
          [8, 2.5], [10.4, 3.6], [11.5, 6], [10.4, 8.4],
          [8, 9.5], [5.6, 8.4], [4.5, 6], [5.6, 3.6],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="0.7" fill="#FFCC00" />
        ))}
      </svg>
    );
  }

  return null;
};

export default FlagChip;
