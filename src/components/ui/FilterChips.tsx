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
  'SF Pro, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

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
              background: active ? '#15171F' : '#fff',
              color: active ? '#fff' : '#0F172A',
              border: active ? 'none' : '1px solid rgba(0,0,0,0.07)',
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
