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
  fontVariantNumeric: 'tabular-nums lining-nums',
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

/* ── DISPLAY SCALE (BRIEF_WHS_CONNECT_FLOW_CINEMATIC) ──────────────────────
   The flow is read at arm's length, one idea per screen, so the headline and
   the figure are the structure - not decoration inside a card. Sizes here are
   deliberately larger than the app scale and belong to THIS surface only. */

/** Stage headline. Three lines maximum, always left aligned. */
export const DISPLAY: React.CSSProperties = {
  fontSize: 42,
  fontWeight: 700,
  letterSpacing: '-0.04em',
  lineHeight: 1.03,
  color: INK,
  margin: 0,
};

/** Stage headline where the copy runs longer (country, form, coming soon). */
export const DISPLAY_SM: React.CSSProperties = {
  fontSize: 38,
  fontWeight: 700,
  letterSpacing: '-0.038em',
  lineHeight: 1.06,
  color: INK,
  margin: 0,
};

/** The one figure that IS the screen. Tabular by construction. */
export const HERO_FIG: React.CSSProperties = {
  fontSize: 68,
  fontWeight: 700,
  letterSpacing: '-0.05em',
  lineHeight: 1,
  color: INK,
  fontVariantNumeric: 'tabular-nums lining-nums',
};

/** The sentence under a DISPLAY headline. */
export const LEAD: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 400,
  lineHeight: 1.5,
  color: MUTE,
};

/** Stage eyebrow, one per screen, above the headline. */
export const KICKER_LG: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: INK,
};

/** Names a value on the display surface. */
export const LABEL_LG: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: DIM,
};
