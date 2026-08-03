/**
 * WHS connect flow - light surface tokens.
 * Presentation only. No business logic here.
 * ASCII only.
 */

export const CANVAS = '#F4F6F9';
export const PANEL = '#FFFFFF';
export const BORDER = '#EDF0F3';
export const INK = '#0E1216';
export const MUTE = '#68707B';
export const DIM = '#A2A9B2';
export const AMBER = '#F7931E';
export const AMBER_DEEP = '#C2620A';
export const GOOD = '#0F8F4A';
export const BAD = '#C8372B';
export const TRACK = 'rgba(14,18,22,0.08)';

export const FONT =
  'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

/** Every figure on this surface. */
export const NUM: React.CSSProperties = {
  fontVariantNumeric: 'tabular-nums lining',
};

export const KICKER: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: AMBER_DEEP,
};

export const LABEL: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: '0.13em',
  textTransform: 'uppercase',
  color: DIM,
};

export const H1: React.CSSProperties = {
  fontSize: 23,
  fontWeight: 800,
  letterSpacing: '-0.02em',
  lineHeight: 1.13,
  color: INK,
  margin: 0,
};

export const H1_SUB: React.CSSProperties = {
  fontSize: 13.5,
  fontWeight: 400,
  lineHeight: 1.52,
  color: MUTE,
  margin: '10px 0 0',
};

export const ROW_TITLE: React.CSSProperties = {
  fontSize: 13.5,
  fontWeight: 700,
  color: INK,
};

export const ROW_SUB: React.CSSProperties = {
  fontSize: 11.5,
  fontWeight: 400,
  color: MUTE,
};

export const CAPTION: React.CSSProperties = {
  fontSize: 11.5,
  lineHeight: 1.52,
  color: MUTE,
};
