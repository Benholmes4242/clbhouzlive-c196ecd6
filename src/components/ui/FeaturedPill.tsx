/**
 * FeaturedPill — Rotated frosted-glass FEATURED pill.
 *
 * Editorial accent used on hero photo cards. Visually anchored to the
 * top-left of the parent (callers pass absolute-positioning via className).
 *
 * Composition:
 *   - rotate(-6deg) transform
 *   - rgba(0, 0, 0, 0.28) background + backdrop-blur(22px) saturate(180%)
 *   - rgba(255, 255, 255, 0.12) 1px border
 *   - 0 2px 8px rgba(0, 0, 0, 0.25) shadow
 *   - 🔥 emoji + caps text (default "FEATURED")
 *
 * Call site:
 *   <div style={{ position: 'relative' }}>
 *     <FeaturedPill className="absolute top-4 left-4" />
 *   </div>
 */

import React from 'react';

interface FeaturedPillProps {
  /** Caps text shown after the emoji. Defaults to "Featured". */
  label?: string;
  /** Optional emoji prefix. Defaults to 🔥. Pass empty string for no emoji. */
  emoji?: string;
  /** Optional className for positioning (callers typically pass absolute positioning). */
  className?: string;
  /** Optional style overrides (rare). */
  style?: React.CSSProperties;
}

export const FeaturedPill: React.FC<FeaturedPillProps> = ({
  label = 'Featured',
  emoji = '🔥',
  className,
  style,
}) => {
  return (
    <div
      className={className}
      style={{
        background: 'rgba(0, 0, 0, 0.28)',
        backdropFilter: 'blur(22px) saturate(180%)',
        WebkitBackdropFilter: 'blur(22px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
        borderRadius: 4,
        padding: '4px 10px',
        fontSize: 10,
        fontWeight: 800,
        color: '#FFFFFF',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        pointerEvents: 'none',
        zIndex: 2,
        transform: 'rotate(-6deg)',
        transformOrigin: 'top left',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        ...style,
      }}
    >
      {emoji && <span style={{ fontSize: 11, lineHeight: 1 }}>{emoji}</span>}
      <span>{label}</span>
    </div>
  );
};

export default FeaturedPill;
