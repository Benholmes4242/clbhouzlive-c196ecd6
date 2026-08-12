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
export const GOOD = '#0F8F4A';
export const BAD = '#C8372B';
export const TRACK = 'rgba(14,18,22,0.08)';

export const FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

/**
 * Connect-surface base. #F8FAFC matches the host page (ManagePageShell) and the
 * notch shield exactly, so there is no seam or white strip under the header.
 */
export const SURFACE = '#F8FAFC';

/** Amber wash. Runs edge to edge, sits behind the content, never a top bar. */
export const WASH =
  `radial-gradient(130% 52% at 50% -6%, rgba(247,147,30,0.20) 0%, rgba(247,147,30,0.07) 42%, rgba(247,147,30,0) 72%), ${SURFACE}`;

/** Every figure on this surface. */
export const NUM: React.CSSProperties = {
  fontVariantNumeric: 'tabular-nums lining',
};

export const KICKER: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: '#0E1216',
};

export const LABEL: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.13em',
  textTransform: 'uppercase',
  color: DIM,
};

export const H1: React.CSSProperties = {
  fontSize: 23,
  fontWeight: 700,
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
