import React from 'react';

/**
 * ScopeSegment — the canonical "Lens" segment control used across:
 *  - Discover Almanac (Recent / All time)
 *  - Course details Holes tab (By hole / By difficulty)
 *  - Handicap Course Champions cabinet (All time / 90d)
 *
 * Anatomy: capsule border 1px rgba(15,23,42,0.08), radius 999, white bg;
 * buttons padding 5/11, radius 999, active #15171F + white, inactive
 * transparent + rgba(15,23,42,0.55), 10.5/600. role="tab" + aria-selected.
 * Labels stay caller-owned so i18n and casing decisions live with each site.
 */

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export interface ScopeSegmentOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface Props<T extends string> {
  value: T;
  onChange: (next: T) => void;
  options: ReadonlyArray<ScopeSegmentOption<T>>;
  ariaLabel?: string;
  /** Optional style overrides on the outer capsule (e.g. flexShrink). */
  style?: React.CSSProperties;
}

export function ScopeSegment<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  style,
}: Props<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      style={{
        flexShrink: 0,
        display: 'inline-flex',
        gap: 2,
        padding: 2,
        background: '#FFFFFF',
        border: '1px solid rgba(15,23,42,0.08)',
        borderRadius: 999,
        ...style,
      }}
    >
      {options.map((o) => {
        const active = value === o.value;
        const disabled = !!o.disabled;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            aria-disabled={disabled}
            disabled={disabled}
            onClick={() => { if (!disabled) onChange(o.value); }}
            style={{
              padding: '5px 11px',
              borderRadius: 999,
              background: active ? '#15171F' : 'transparent',
              color: active ? '#FFFFFF' : 'rgba(15,23,42,0.55)',
              border: 'none',
              fontFamily: FONT,
              fontSize: 10.5,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.35 : 1,
              transition: 'all .15s',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export default ScopeSegment;
