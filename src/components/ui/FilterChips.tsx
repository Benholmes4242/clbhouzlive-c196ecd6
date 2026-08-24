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
 * MICRO_BRIEF_TABS_SHEETS_MAP §1.2 — GEOMETRY AND BOTH STATES NOW COME FROM
 * THE SHIPPED DISCOVER PILLS (PillFilterRow), not from a local pair. Radius is
 * SCOPE_PILL_RADIUS, padding 8/14, type 12.5/700, selected = INK fill with
 * PANEL ink, unselected = PANEL fill with a BORDER hairline and FULL INK text
 * (the old 0.62 unselected ink was the quiet tier and read as disabled).
 * Do not re-hardcode these; edit the Discover pill and both follow.
 */

const FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

// Both states resolve through the dark ramp of record. A near-white selected
// fill on a dark canvas is an ACCENT, not an unconverted leftover.
const ACTIVE_FILL = A.INK;
const ACTIVE_INK = A.PANEL;
const INACTIVE_FILL = A.PANEL;
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
