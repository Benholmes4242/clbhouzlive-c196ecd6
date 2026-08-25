/**
 * WHS connect flow - DARK surface tokens (BRIEF_SETTINGS_AND_MANAGE_DARK).
 * Values mirror the analytical ramp; chrome never drops below the 0.62 floor.
 * Presentation only. No business logic here.
 * ASCII only.
 */

export const CANVAS = '#15171F';
export const PANEL = '#1B1E27';
export const BORDER = 'rgba(255,255,255,0.10)';
export const INK = '#F8FAFC';
export const MUTE = 'rgba(248,250,252,0.72)';
export const DIM = 'rgba(248,250,252,0.62)';
export const AMBER = '#F7931E';
export const GOOD = '#34D77F';
/** Bespoke destructive red - NOT the under-par red. */
export const BAD = '#FF5A5A';
export const TRACK = 'rgba(255,255,255,0.08)';

export const FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

/**
 * Connect-surface base. Matches the host page (ManagePageShell) and the notch
 * shield exactly, so there is no seam or bright strip under the header.
 */
export const SURFACE = '#15171F';

/** Amber wash. Runs edge to edge, sits behind the content, never a top bar. */
export const WASH =
  `radial-gradient(130% 52% at 50% -6%, rgba(247,147,30,0.20) 0%, rgba(247,147,30,0.07) 42%, rgba(247,147,30,0) 72%), ${SURFACE}`;

/** Every figure on this surface. */
export const NUM: React.CSSProperties = {
  fontVariantNumeric: 'tabular-nums lining-nums',
};

export const KICKER: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: INK,
};

export const LABEL: React.CSSProperties = {
  fontSize: 11,
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
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: INK,
};

/** Names a value on the display surface. */
export const LABEL_LG: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: DIM,
};
