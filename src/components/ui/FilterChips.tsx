import React from 'react';

/**
 * TIER 2 canonical content-filter primitive.
 *
 * Dark-fill pill row extracted from watch-v2's HubChipBar so all three
 * media surfaces (Watch, Clips, Videos) share the same pill markup. Sticky
 * containment is the caller's job — this component owns the scroll row +
 * pill styling only.
 */

const FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

// Keep the active/inactive pair co-located: these values are the inverse of
// the dark glass band they sit on and must migrate with that band.
const ACTIVE_FILL = '#F8FAFC';
const ACTIVE_INK = '#15171F';
const INACTIVE_FILL = 'rgba(255,255,255,0.06)';
const INACTIVE_INK = 'rgba(248,250,252,0.62)';
const INACTIVE_BORDER = '1px solid rgba(255,255,255,0.10)';

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
        padding: '0 4px',
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
              fontWeight: 600,
              fontSize: 12.5,
              padding: '7px 14px',
              borderRadius: 999,
              background: active ? ACTIVE_FILL : INACTIVE_FILL,
              color: active ? ACTIVE_INK : INACTIVE_INK,
              border: active ? 'none' : INACTIVE_BORDER,
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
