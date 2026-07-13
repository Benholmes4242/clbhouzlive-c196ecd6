import React from 'react';

/**
 * TIER 1 canonical primary-nav primitive.
 *
 * Ink-active underline tabs with amber gradient marker. Extracted from the
 * course-detail tabs pattern and parameterised so sub-pages (e.g. Videos)
 * can use the 'md' size while course-detail keeps the larger 'lg'.
 */

const FONT_FAMILY =
  'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export interface UnderlineTabsOption<T extends string> {
  id: T;
  label: string;
}

export interface UnderlineTabsProps<T extends string> {
  options: ReadonlyArray<UnderlineTabsOption<T>>;
  value: T;
  onChange: (id: T) => void;
  size?: 'lg' | 'md';
  align?: 'center' | 'left';
  className?: string;
  ariaLabel?: string;
}

export function UnderlineTabs<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  align = 'center',
  className,
  ariaLabel,
}: UnderlineTabsProps<T>) {
  const isLg = size === 'lg';

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={className}
      style={{
        display: 'flex',
        gap: isLg ? 34 : 28,
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
              padding: isLg ? '14px 7px 12px' : '12px 6px 10px',
              minHeight: 44,
              fontSize: isLg ? 19 : 16,
              fontWeight: active ? 700 : 500,
              color: active ? '#0F172A' : '#94A3B8',
              letterSpacing: active ? '-0.02em' : undefined,
              fontFamily: FONT_FAMILY,
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
                  height: isLg ? 3 : 2,
                  borderRadius: 2,
                  background: 'linear-gradient(90deg,#F59E0B,#F7931E)',
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
