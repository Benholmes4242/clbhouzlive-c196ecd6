import React from 'react';

/**
 * TIER 1 canonical primary-nav primitive.
 *
 * Ink-active underline tabs with a configurable underline colour. Extracted
 * from the course-detail pattern and parameterised so sub-pages (Videos,
 * Courses shell, region rows) can share one component.
 */

const FONT_FAMILY =
  'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const DEFAULT_UNDERLINE = 'linear-gradient(90deg,#F59E0B,#F7931E)';

export interface UnderlineTabsOption<T extends string> {
  id: T;
  label: string;
}

export interface UnderlineTabsProps<T extends string> {
  options: ReadonlyArray<UnderlineTabsOption<T>>;
  value: T;
  onChange: (id: T) => void;
  size?: 'sm' | 'md' | 'lg';
  align?: 'center' | 'left';
  /** Underline colour or gradient. Defaults to the amber gradient. */
  underlineColor?: string;
  className?: string;
  ariaLabel?: string;
}

const SIZES = {
  sm: { gap: 20, padding: '10px 4px 8px', fontSize: 13, underline: 1.5 },
  md: { gap: 28, padding: '12px 6px 10px', fontSize: 16, underline: 2 },
  lg: { gap: 34, padding: '14px 7px 12px', fontSize: 19, underline: 3 },
} as const;

export function UnderlineTabs<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  align = 'center',
  underlineColor = DEFAULT_UNDERLINE,
  className,
  ariaLabel,
}: UnderlineTabsProps<T>) {
  const s = SIZES[size];

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={className}
      style={{
        display: 'flex',
        gap: s.gap,
        justifyContent: align === 'center' ? 'center' : 'flex-start',
        borderBottom: '1px solid rgba(15,23,42,0.07)',
        fontFamily: FONT_FAMILY,
      }}
    >
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            style={{
              position: 'relative',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: s.padding,
              minHeight: 44,
              fontSize: s.fontSize,
              fontWeight: active ? 700 : 500,
              color: active ? '#0F172A' : '#94A3B8',
              letterSpacing: active ? '-0.02em' : undefined,
              fontFamily: FONT_FAMILY,
              whiteSpace: 'nowrap',
            }}
          >
            {opt.label}
            {active ? (
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  left: 6,
                  right: 6,
                  bottom: 4,
                  height: s.underline,
                  borderRadius: 2,
                  background: underlineColor,
                }}
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export default UnderlineTabs;
