import type { CSSProperties } from 'react';

import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';

/**
 * THE CANONICAL RAIL CHIP.
 *
 * One treatment, one place. Geometry and both states come from the Scores
 * board rails (BRIEF_SCORES §S1.3) and are now shared by every surface doing
 * the same job: the two Scores rails, the Discover filter rail, and the four
 * Watch destinations (/watch/clips, /watch/videos, /explore/reviews,
 * /explore/moments).
 *
 * 12 / 700, padding 6 by 11, radius 11. Selected is A.INK ground with A.CANVAS
 * text — the active state is stated by inversion, never by colour, because
 * amber belongs to the viewing member. Unselected is transparent with a 1px
 * A.BORDER and A.MUTE text. The row scrolls horizontally and never wraps.
 *
 * TWO GROUNDS, ONE GEOMETRY (BRIEF_EXPLORE_REFINEMENT ruling 1). The default
 * ground, `outline`, states A CHOICE: one chip selected by inversion, the rest
 * transparent with a hairline. The `filled` ground states APPLIED STATE: a 6%
 * white ground, no border, nothing selected, and tapping opens a panel rather
 * than switching a list. The Explore filter rail is the one filled consumer.
 * A control that looks like a choice must behave like one, so do not reach for
 * `filled` on anything that actually switches the surface below it.
 *
 * Do not restate these values at a call site. This drifted into two shapes
 * once (filled rectangles on the dormant Watch pages, underlined text on the
 * library pages) and that is what this component exists to prevent.
 */

export const RAIL_CHIP_RADIUS = 11;

export interface RailChipOption {
  id: string;
  label: string;
}

export interface RailChipsProps {
  options: ReadonlyArray<RailChipOption>;
  value: string;
  onChange: (next: string) => void;
  ariaLabel: string;
  /** Outer row style — margin/padding only. Never colours or type. */
  style?: CSSProperties;
  className?: string;
  /**
   * LOCKED: the rail still states the basis but cannot be changed — dimmed, not
   * hidden, so the geometry never shifts and the reader can see why. Used when a
   * block below is fixed to one value by definition (Tour's points boards).
   */
  locked?: boolean;
  /**
   * ADDITIVE. Omitted or 'outline' renders exactly as every existing consumer
   * always has. 'filled' is the applied-state ground described above.
   */
  ground?: 'outline' | 'filled';
  /** ADDITIVE: centre a fitting choice group; overflow still starts at the leading edge. */
  align?: 'start' | 'center-when-fit';
}

/** The applied-state ground: 6% white, stated once. */
const APPLIED_FILL = 'rgba(255,255,255,0.06)';

export function RailChips({ options, value, onChange, ariaLabel, style, className, locked, ground = 'outline', align = 'start' }: RailChipsProps) {
  const filled = ground === 'filled';
  return (
    <div
      role={filled ? 'group' : 'tablist'}
      aria-label={ariaLabel}
      aria-disabled={locked || undefined}
      className={`hide-scrollbar${className ? ` ${className}` : ''}`}
      style={{
        display: 'flex',
        gap: 6,
        minWidth: 0,
        overflowX: 'auto',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
        ...(align === 'center-when-fit' ? { justifyContent: 'safe center' } : null),
        ...(locked ? { opacity: 0.45, pointerEvents: 'none' as const } : null),
        ...style,
      }}
    >
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role={filled ? undefined : 'tab'}
            aria-selected={filled ? undefined : active}
            aria-disabled={locked || undefined}
            tabIndex={locked ? -1 : undefined}
            onClick={() => { if (!locked) onChange(option.id); }}
            style={{
              flexShrink: 0,
              padding: '6px 11px',
              borderRadius: RAIL_CHIP_RADIUS,
              border: filled ? 'none' : `1px solid ${active ? 'transparent' : A.BORDER}`,
              background: filled ? APPLIED_FILL : active ? A.INK : 'transparent',
              color: filled ? A.INK : active ? A.CANVAS : A.MUTE,
              fontFamily: SANS,
              fontSize: 12,
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

export default RailChips;
