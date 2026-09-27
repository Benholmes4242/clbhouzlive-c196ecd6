import type { ReactNode } from 'react';

import { railChipStyle, RAIL_CHIP_GAP } from '@/components/ui/RailChips';

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
   * Kept for caller compatibility. Since BRIEF_ONE_CHIP_SWEEP_PASS_1 the row
   * renders the canonical RailChips style on every ground (unselected chips
   * are transparent), so the surface no longer changes anything.
   */
  surface?: PillFilterSurface;
  /**
   * WRAP (default false — every existing caller keeps its scroll behaviour
   * byte-identically). When true the row wraps to as many lines as it needs
   * instead of scrolling. Use ONLY when the option set is fixed and small
   * enough to be shown whole: a peek is right when there is more past the
   * edge than can be shown, wrong when the entire set is four items and two
   * lines would hold them (Stat Watch ruling).
   */
  wrap?: boolean;
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
  wrap = false,
  deselectable,
}: PillFilterRowProps<T>) {
  const emit = onChange as (next: T | null) => void;

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="scrollbar-hide"
      style={{
        display: 'flex',
        gap: RAIL_CHIP_GAP,
        /* wrap=false (default): single scrolling row — every existing caller.
           wrap=true: all options render in full on as many lines as needed. */
        flexWrap: wrap ? 'wrap' : 'nowrap',
        overflowX: wrap ? 'visible' : 'auto',
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
            style={railChipStyle(active)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default PillFilterRow;
