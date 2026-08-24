import type { ReactNode } from 'react';

import { A, SCOPE_PILL_RADIUS } from './tokens';

export interface PillFilterOption<T extends string> {
  value: T;
  label: ReactNode;
}

/** Host surface. Decides ONLY the unselected fill. */
export type PillFilterSurface = 'canvas' | 'panel';

type PillFilterBaseProps<T extends string> = {
  value: T | null;
  options: ReadonlyArray<PillFilterOption<T>>;
  ariaLabel: string;
  style?: React.CSSProperties;
  /**
   * 'canvas' (default): the row sits on A.CANVAS, so an unselected pill is
   * A.PANEL. 'panel': the row sits INSIDE an A.PANEL container (a SectionCard),
   * where A.PANEL would vanish into its own ground, so unselected is a 6% raised
   * fill. Radius, padding, type and the selected treatment are identical.
   */
  surface?: PillFilterSurface;
};

/**
 * Deselect is opt-in so the non-deselectable callers keep a non-nullable
 * onChange. Widening onChange for everyone would push a null they cannot
 * receive onto four existing call sites.
 */
type PillFilterRowProps<T extends string> = PillFilterBaseProps<T> &
  (
    | { deselectable: true; onChange: (next: T | null) => void }
    | { deselectable?: false; onChange: (next: T) => void }
  );

/**
 * The shared Discover pill row. Week scope and media type deliberately use this
 * exact primitive so their geometry and selected/unselected treatments cannot
 * drift. Their position and the search control between the two rows communicate
 * their different authority.
 *
 * It is a GENERIC primitive, not a Discover-only control: search scopes, the
 * business primary-action picker and other single-select-one-of-N rows are the
 * same control and consume it rather than restating its colours.
 */
export function PillFilterRow<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  style,
  surface = 'canvas',
  deselectable,
}: PillFilterRowProps<T>) {
  const emit = onChange as (next: T | null) => void;
  const unselectedFill = surface === 'panel' ? 'rgba(255,255,255,0.06)' : A.PANEL;

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
            onClick={() => emit(active && deselectable ? null : option.value)}
            style={{
              flex: 'none',
              border: `1px solid ${active ? A.INK : A.BORDER}`,
              background: active ? A.INK : unselectedFill,
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
