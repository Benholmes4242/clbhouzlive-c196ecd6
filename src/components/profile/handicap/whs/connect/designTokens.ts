/**
 * WHS connect flow - DARK surface tokens (BRIEF_SETTINGS_AND_MANAGE_DARK).
 * Values mirror the analytical ramp; chrome never drops below the 0.62 floor.
 * Presentation only. No business logic here.
 * ASCII only.
 */

import { MEMBER_PANEL, PAGE_CANVAS } from '@/lib/tokens/surfaces';
export const CANVAS = PAGE_CANVAS;
export const PANEL = MEMBER_PANEL;
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
export const SURFACE = PAGE_CANVAS;

/**
 * Amber wash. Runs edge to edge, sits behind the content, never a top bar.
 * RENDERED ON THE INTRO AND THE PAYOFF (done) ONLY: amber light on the
 * promise, flat canvas while the work happens (country, form, syncing, coming
 * soon), amber light again on the payoff. The wash marks a moment; on every
 * screen it would be wallpaper and stop meaning anything. On a light canvas an amber radial read as a soft
 * consumer gradient and was cut; on near-black the same radial reads as
 * stadium light. It is the brand colour used as LIGHT, not as ink, so it does
 * not compete with amber's meaning elsewhere - the viewing member's own data.
 */
export const WASH =
  `radial-gradient(118% 56% at 50% -8%, rgba(247,147,30,0.30) 0%, rgba(247,147,30,0.10) 34%, rgba(247,147,30,0) 62%), ` +
  `radial-gradient(80% 40% at 88% 4%, rgba(255,205,140,0.14) 0%, transparent 58%), ` +
  `${SURFACE}`;

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
   the figure are the structure - not decoration inside a card. This scale
   governs HEADLINES AND FIGURES only (DISPLAY, DISPLAY_SM, HERO_FIG, LEAD) and
   is deliberately larger than the app scale. INPUTS are not part of it: every
   field in the flow takes the app field canon (lib/tokens/field.ts). */

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
  /* AMBER ON EVERY STAGE (BRIEF_WHS_CONNECT_FLOW_ONE_LANGUAGE). There is no
     colour override on StageHead: an escape hatch here is how four eyebrow
     colours happened. A non-amber eyebrow is a design question, not a prop. */
  color: AMBER,
};

/** Syncing step not yet reached: ring and label. */
export const STEP_WAIT_RING = 'rgba(255,255,255,0.14)';
export const STEP_WAIT_INK = 'rgba(248,250,252,0.38)';

/** Names a value on the display surface. */
export const LABEL_LG: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: DIM,
};
