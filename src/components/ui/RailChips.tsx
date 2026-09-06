import type { CSSProperties } from 'react';

import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';

/**
 * THE CANONICAL RAIL CHIP.
 *
 * One treatment, one place. Geometry and both states come from the Scores
 * board rails (BRIEF_SCORES §S1.3) and are now shared by every surface doing
 * the same job: the two Scores rails, the Discover filter rail, and the four
 * Watch destinations (/watch/clips, /watch/videos, /explore/reviews,
 * /explore/moments).
 *
 * 12 / 700, padding 6 by 11, radius 11. Selected is A.INK ground with A.CANVAS
 * text — the active state is stated by inversion, never by colour, because
 * amber belongs to the viewing member. Unselected is transparent with a 1px
 * A.BORDER and A.MUTE text. The row scrolls horizontally and never wraps.
 *
 * Do not restate these values at a call site. This drifted into two shapes
 * once (filled rectangles on the dormant Watch pages, underlined text on the
 * library pages) and that is what this component exists to prevent.
 */

export const RAIL_CHIP_RADIUS = 11;

export interface RailChipOption {
  id: string;
  label: string;
}

export interface RailChipsProps {
  options: ReadonlyArray<RailChipOption>;
  value: string;
  onChange: (next: string) => void;
  ariaLabel: string;
  /** Outer row style — margin/padding only. Never colours or type. */
  style?: CSSProperties;
  className?: string;
}

export function RailChips({ options, value, onChange, ariaLabel, style, className }: RailChipsProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`hide-scrollbar${className ? ` ${className}` : ''}`}
      style={{
        display: 'flex',
        gap: 6,
        minWidth: 0,
        overflowX: 'auto',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
        ...style,
      }}
    >
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.id)}
            style={{
              flexShrink: 0,
              padding: '6px 11px',
              borderRadius: RAIL_CHIP_RADIUS,
              border: `1px solid ${active ? 'transparent' : A.BORDER}`,
              background: active ? A.INK : 'transparent',
              color: active ? A.CANVAS : A.MUTE,
              fontFamily: SANS,
              fontSize: 12,
              fontWeight: 700,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default RailChips;
