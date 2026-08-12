import React from 'react';

/**
 * Movement glyph rendered between the name block and the score in
 * champion boards. Compete-tab language:
 *   climbed  → ▲n  in emerald  (light #059669 · dark #34D399)
 *   dropped  → ▼n  in dim slate/white (0.45)     — never red
 *   unchanged → em-dash in faint slate/white (0.30)
 *   absent from 30d board → nothing (name-side NEW badge covers it)
 *
 * Movement cell keeps a fixed min-width so the score column stays
 * aligned across rows even when a row has no glyph.
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
  const dropped = isLight ? 'rgba(15,23,42,0.45)' : 'rgba(255,255,255,0.45)';
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
