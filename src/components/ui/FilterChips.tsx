import React from 'react';

import { A } from '@/features/courses/components/holes/analytical/tokens';
import { SCOPE_PILL_RADIUS } from '@/components/explore-tab-new/courseled/tokens';

/**
 * TIER 2 canonical content-filter primitive.
 *
 * Dark-fill pill row extracted from watch-v2's HubChipBar so all three
 * media surfaces (Watch, Clips, Videos) share the same pill markup. Sticky
 * containment is the caller's job — this component owns the scroll row +
 * pill styling only.
 *
 * SOURCE OF TRUTH FOR THE UNSELECTED FILL: RailChips.tsx (the shipped Discover
 * chip). Exactly ONE filled pill at a time — selected = INK fill with PANEL
 * ink; unselected = TRANSPARENT with a BORDER hairline and FULL INK text. A
 * filled unselected pill competes with the selected one and must not return.
 * Geometry here is its own tier (radius SCOPE_PILL_RADIUS, padding 8/14, type
 * 12.5/700) and deliberately differs from RailChips' tighter 6/11 · 12px rail.
 * If the fill rule changes in RailChips, change it here too — these two must
 * not drift again.
 */

const FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

// Both states resolve through the dark ramp of record. A near-white selected
// fill on a dark canvas is an ACCENT, not an unconverted leftover.
const ACTIVE_FILL = A.INK;
const ACTIVE_INK = A.PANEL;
const INACTIVE_FILL = 'transparent';
const INACTIVE_INK = A.INK;
const INACTIVE_BORDER = `1px solid ${A.BORDER}`;


export interface FilterChipsOption<T extends string> {
  id: T;
  label: string;
}

export interface FilterChipsProps<T extends string> {
  options: ReadonlyArray<FilterChipsOption<T>>;
  value: T;
  onChange: (id: T) => void;
  className?: string;
  ariaLabel?: string;
}

export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  className,
  ariaLabel,
}: FilterChipsProps<T>) {
  return (
    <div
      className={`hide-scrollbar${className ? ` ${className}` : ''}`}
      role="group"
      aria-label={ariaLabel}
      style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        padding: '3px 4px',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
        fontFamily: FONT_FAMILY,
      }}
    >
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.id)}
            style={{
              flexShrink: 0,
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 12.5,
              padding: '8px 14px',
              whiteSpace: 'nowrap',
              borderRadius: SCOPE_PILL_RADIUS,
              background: active ? ACTIVE_FILL : INACTIVE_FILL,
              color: active ? ACTIVE_INK : INACTIVE_INK,
              border: active ? `1px solid ${ACTIVE_FILL}` : INACTIVE_BORDER,
              fontFamily: FONT_FAMILY,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default FilterChips;
