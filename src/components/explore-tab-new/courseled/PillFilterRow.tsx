import type { ReactNode } from 'react';

import { A, SCOPE_PILL_RADIUS } from './tokens';

export interface PillFilterOption<T extends string> {
  value: T;
  label: ReactNode;
}

/**
 * The shared Discover pill row. Week scope and media type deliberately use this
 * exact primitive so their geometry and selected/unselected treatments cannot
 * drift. Their position and the search control between the two rows communicate
 * their different authority.
 */
export function PillFilterRow<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  style,
}: {
  value: T;
  options: ReadonlyArray<PillFilterOption<T>>;
  onChange: (next: T) => void;
  ariaLabel: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="scrollbar-hide"
      style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        minWidth: 0,
        ...style,
      }}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            style={{
              flex: 'none',
              border: `1px solid ${active ? A.INK : A.BORDER}`,
              background: active ? A.INK : A.PANEL,
              color: active ? A.PANEL : A.INK,
              borderRadius: SCOPE_PILL_RADIUS,
              padding: '8px 14px',
              fontSize: 12.5,
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

export default PillFilterRow;