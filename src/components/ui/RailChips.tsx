import React, { type CSSProperties } from 'react';

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
 * 12 / 700, padding 6 by 11, radius 11. The row scrolls horizontally and
 * never wraps.
 *
 * ONE SELECTION GROUND, ONE APPLIED GROUND (BRIEF_ONE_CHIP_APP_WIDE). The
 * default and only choice ground, `filled-selection`, states A CHOICE: the
 * selected chip takes the 6% white ground, ink text and a bright edge; every
 * other chip is transparent with a 1px A.BORDER hairline and A.MUTE text. The
 * solid white (inverted) selected pill is RETIRED app-wide and this component
 * can no longer draw it — do not reintroduce an inverted branch. Amber stays
 * out because it belongs to the viewing member.
 *
 * The `filled` ground states APPLIED STATE: a 6% white ground, no border,
 * NOTHING selected, and tapping opens a panel rather than switching a list.
 * The Explore filter rail is the one filled consumer.
 * A control that looks like a choice must behave like one, so do not reach for
 * `filled` on anything that actually switches the surface below it.
 *
 * Do not restate these values at a call site. This drifted into two shapes
 * once (filled rectangles on the dormant Watch pages, underlined text on the
 * library pages) and that is what this component exists to prevent.
 */

export const RAIL_CHIP_RADIUS = 11;

/**
 * THE CHIP GEOMETRY, PUBLISHED (BRIEF_SEARCH_CONTROL_HEIGHT). A `trailing`
 * control sits in the chip row and must read as one of the set, so it needs the
 * chips' radius WITHOUT restating the number: it reads it from here, and if the
 * chip geometry ever changes the control follows. Its HEIGHT is not published
 * because it is not a number - the trailing slot stretches to the row, so the
 * control is exactly as tall as the chips whatever their padding and type make
 * them.
 */
export const RAIL_CHIP_GEOMETRY = {
  sm: { padding: '4px 9px', fontSize: 11, radius: 9 },
  md: { padding: '6px 11px', fontSize: 12, radius: RAIL_CHIP_RADIUS },
} as const;

export interface RailChipOption {
  id: string;
  label: string;
  /**
   * ADDITIVE — A COUNT INSIDE THE CHIP (BRIEF_CHIP_COUNT_CAPABILITY §2). How
   * many exist, rendered after the label at the same size, 5px gap, A.DIM
   * unselected / A.MUTE selected, inside the chip's own padding. undefined or
   * null renders NOTHING (no node, no width change). 0 renders "0" — zero is
   * an answer, not an absence. Never an unread badge: that is a different fact.
   */
  count?: number | null;
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
   * 'filled-selection' (the default) is the only ground for a row that
   * SWITCHES the surface below: selected chip = APPLIED_FILL, ink text, bright
   * edge; others transparent with the hairline. 'filled' marks NOTHING as
   * selected — correct for a panel opener only.
   */
  ground?: 'filled' | 'filled-selection';

  /** ADDITIVE: centre a fitting choice group; overflow still starts at the leading edge. */
  align?: 'start' | 'center-when-fit';

  /**
   * ADDITIVE — SIZE CARRIES HIERARCHY, TREATMENT STAYS CONSTANT
   * (BRIEF_EXPLORE_DEVICE_PASS §1b). Where two chip rows stack, the PRIMARY row
   * (the views) keeps 'md' — the canonical 12/700, 6 by 11 geometry shared with
   * the Courses page sort chips — and the SECONDARY row (the scope) takes 'sm'.
   * Both rows state their active chip the SAME WAY, so nothing about a filter
   * shouts louder than the thing it filters.
   */
  size?: 'sm' | 'md';

  /**
   * ADDITIVE — EQUAL WIDTH, DISTRIBUTED (BRIEF_EXPLORE_SECOND_PASS §2). The scope
   * rows share the run between the gutter and the place dropdown evenly rather
   * than sitting left-packed with dead space after them: every chip takes a
   * flex-basis of 0 and grows equally, so with room they end up the same width.
   *
   * THE ROW STILL SCROLLS RATHER THAN SHRINKING THE TYPE. Each chip keeps a
   * min-width of its own content, so when four chips plus the dropdown cannot
   * fit — 320px, a long locale, a fifth scope — nothing is squeezed and the row
   * overflows horizontally exactly as it does today.
   */
  distribute?: boolean;

  /**
   * ADDITIVE. An action rendered at the trailing edge of the scrollable row,
   * separated from the last chip by the same gap the chips use. The caller owns
   * the button styling and semantics; RailChips only guarantees it scrolls
   * with the chips and stays reachable when the row overflows.
   */
  trailing?: React.ReactNode;
}



/** The applied-state ground: 6% white, stated once. */
const APPLIED_FILL = 'rgba(255,255,255,0.06)';
/** filled-selection's EDGE: the selected chip is the one with a BRIGHT
 *  border, not the one with none. 6% fill alone is darker on A.CANVAS than
 *  the 10% hairline every other chip wears. */
const SELECTED_EDGE = 'rgba(255,255,255,0.28)';

/**
 * THE PUBLISHED CHIP STYLE — A BOUNDED EXCEPTION (BRIEF_CHIP_SWEEP_PASS_1_FOLLOW_UPS §2).
 *
 * These values exist ONLY for rows that cannot use the RailChips component.
 * The list of such rows is closed; each is named with the one capability the
 * component lacks:
 *
 *   PillFilterRow (explore-tab-new/courseled) — React-node labels,
 *                                               tap-again-to-clear, wrapping
 *   ScopePills (explore-tab-new/wire)         — the row element itself must be
 *                                               position:sticky (RailChips'
 *                                               `style` is margin/padding only)
 *
 * Media All/Photos/Videos and Profile courses All/Top 100 left this list when
 * `count` landed (BRIEF_CHIP_COUNT_CAPABILITY). Two rows still read it pending
 * a ruling, because the number they carry is NOT a count:
 *   BoardChips (championsFlatBits)            — a board's leading score
 *   ActivityPageV2 ChipButton                 — the amber unread badge
 *
 * A NEW row may NOT join this list. If it needs a capability the component
 * lacks, add that capability to RailChips instead.
 *
 * Every reader SPREADS this object. No reader restates a value and no reader
 * overrides one; it may only ADD layout for its own contents (display,
 * alignItems, gap for an inner count). A row that needs a different value is a
 * second treatment and comes back here for a ruling.
 */
export function railChipStyle(active: boolean, size: 'sm' | 'md' = 'md'): CSSProperties {
  const geo = RAIL_CHIP_GEOMETRY[size];
  return {
    flexShrink: 0,
    padding: geo.padding,
    borderRadius: geo.radius,
    border: `1px solid ${active ? SELECTED_EDGE : A.BORDER}`,
    background: active ? APPLIED_FILL : 'transparent',
    color: active ? A.INK : A.MUTE,
    fontFamily: SANS,
    fontSize: geo.fontSize,
    fontWeight: 700,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
  };
}

/** The canonical chip-row gap. */
export const RAIL_CHIP_GAP = 6;

export function RailChips({ options, value, onChange, ariaLabel, style, className, locked, ground = 'filled-selection', align = 'start', size = 'md', distribute = false, trailing }: RailChipsProps) {
  const filled = ground === 'filled';
  /* ONE geometry pair, stated once. 'md' is the canonical chip. */
  const geo = size === 'sm' ? RAIL_CHIP_GEOMETRY.sm : RAIL_CHIP_GEOMETRY.md;


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
              /* EQUAL WIDTH FROM A ZERO BASIS: all of the free space is shared
                 equally, and `min-width: max-content` is what makes the row
                 overflow-and-scroll instead of squeezing a label. */
              ...(distribute ? { flex: '1 1 0%', minWidth: 'max-content', textAlign: 'center' as const } : null),
              padding: geo.padding,
              borderRadius: geo.radius,


              /* Every chip keeps a 1px edge, so switching costs no width shift. */
              border: filled ? 'none' : `1px solid ${active ? SELECTED_EDGE : A.BORDER}`,
              background: filled || active ? APPLIED_FILL : 'transparent',
              color: filled || active ? A.INK : A.MUTE,


              fontFamily: SANS,
              fontSize: geo.fontSize,

              fontWeight: 700,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}
          >
            {option.label}
            {option.count != null ? (
              <span
                style={{
                  marginLeft: 5,
                  color: active ? A.MUTE : A.DIM,
                  fontVariantNumeric: 'tabular-nums lining-nums',
                }}
              >
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
      {trailing ? (
        /* STRETCH, NOT A MATCHING NUMBER: the trailing control is as tall as
           the chips because the row makes it so. Nothing here to keep in step. */
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'stretch' }}>
          {trailing}
        </div>
      ) : null}
    </div>
  );
}

export default RailChips;
