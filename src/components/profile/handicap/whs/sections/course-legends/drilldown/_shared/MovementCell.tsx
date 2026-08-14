import React from 'react';
import { INDEX_DELTA } from '@/lib/tokens/indexDelta';

/**
 * Movement glyph rendered between the name block and the score in
 * champion boards. Compete-tab language:
 *   climbed  → ▲n  in emerald  (light #059669 · dark #34D399)
 *   dropped  → ▼n  in RED      (INDEX_DELTA drifted: light #C8372B · dark #F87171)
 *   unchanged → em-dash in faint slate/white (0.30)
 *   absent from 30d board → nothing (name-side NEW badge covers it)
 *
 * WHY RED (BRIEF_MOVEMENT_RED_AND_HELD_BOARD). A dropped rank used to render
 * dim slate, on the reasoning that these boards rank a member against their
 * friends, so a drop often means someone else played well rather than that the
 * member played badly. That reading was heard and set aside: a rank move is a
 * MOVEMENT, and the app has exactly one pair for movement - INDEX_DELTA, green
 * improved / red drifted, the same pair the handicap index card uses.
 * Green-up with grey-down made the column signal only good news and muted half
 * of what it exists to say. Dropped is red on both themes; do not revert it.
 *
 * The dark drifted value is lighter than the light one because it sits on
 * near-black - the two theme pairs are not interchangeable.
 *
 * Movement cell keeps a fixed min-width so the score column stays
 * aligned across rows even when a row has no glyph. The red glyph is the same
 * ▼n form as before, so it cannot widen the column.
 */
interface Props {
  delta: number | null | undefined;
  rank30d: number | null | undefined;
  theme?: 'light' | 'dark';
  /** 'row' = list row (11px); 'chip' = compact hero chip (10px);
   *  'figure' = analytical board row (11.5px, grid-managed width). */
  size?: 'row' | 'chip' | 'figure';
}

export const MovementCell: React.FC<Props> = ({
  delta,
  rank30d,
  theme = 'dark',
  size = 'row',
}) => {
  const isLight = theme === 'light';
  const climbed = isLight ? '#059669' : '#34D399';
  const dropped = isLight ? INDEX_DELTA.light.drifted : INDEX_DELTA.dark.drifted;
  const dash    = isLight ? 'rgba(15,23,42,0.30)' : 'rgba(255,255,255,0.30)';

  const fontSize = size === 'chip' ? 10 : size === 'figure' ? 11.5 : 11;
  const base: React.CSSProperties = {
    fontSize,
    fontWeight: size === 'figure' ? 700 : 700,
    fontVariantNumeric: 'tabular-nums lining-nums',
    letterSpacing: size === 'figure' ? '0' : '0.01em',
    lineHeight: 1,
    display: 'inline-block',
    minWidth: size === 'figure' ? 0 : size === 'chip' ? 22 : 26,
    textAlign: size === 'figure' ? 'right' : 'center',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  };


  if (rank30d == null) {
    // Absent from the 30d board → NEW. The name-side NEW badge already
    // conveys it; keep the cell as a spacer for score alignment.
    return <span style={{ ...base, color: 'transparent' }} aria-hidden>—</span>;
  }
  if (delta == null || delta === 0) {
    return <span style={{ ...base, color: dash }} aria-label="rank unchanged">—</span>;
  }
  if (delta > 0) {
    return (
      <span style={{ ...base, color: climbed }} aria-label={`climbed ${delta}`}>
        ▲{delta}
      </span>
    );
  }
  return (
    <span style={{ ...base, color: dropped }} aria-label={`dropped ${-delta}`}>
      ▼{-delta}
    </span>
  );
};

export default MovementCell;
