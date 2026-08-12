/**
 * THE CANONICAL TYPE SCALE (BRIEF_AUTH_TYPE_CANONICAL).
 *
 * One scale for the whole app, converted surface by surface. Auth is first.
 *
 * These roles carry SIZE, WEIGHT, TRACKING and LINE-HEIGHT only - never
 * colour. Colour belongs to the surface: the light member surfaces, the dark
 * admin console and the dark auth screens all use these same metrics and
 * supply their own ink. Spread a role and set `color` alongside it.
 *
 * TYPEFACE: none declared. The app stack (SF Pro / system) is inherited.
 * Do NOT add a font-family here.
 *
 * WEIGHTS IN USE ARE 400, 500, 600, 700. NOTHING ELSE - no 650, no 800.
 *
 * NOTE ON `features/courses/.../analytical/tokens.tsx`: that file still holds
 * the older, heavier values (LABEL 9/800, TITLE 13/800) and bakes in
 * light-mode colour. It is scheduled to be repointed at this module; until
 * then it is the legacy source and this one is canonical.
 */
import type { CSSProperties } from 'react';

/** Section eyebrow. Uppercase, widest tracking in the scale. */
export const KICKER: CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.19em',
  textTransform: 'uppercase',
};

/** The smallest role: names a value, a column or a field. Uppercase. */
export const LABEL: CSSProperties = {
  fontSize: 8,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
};

/** Panel, sheet and screen headings. Tracking tightens as size grows. */
export const TITLE: CSSProperties = {
  fontSize: 17,
  fontWeight: 700,
  letterSpacing: '-0.032em',
  lineHeight: 1.2,
};

/** Running prose, captions, supporting sentences. */
export const BODY: CSSProperties = {
  fontSize: 13,
  fontWeight: 400,
  lineHeight: 1.55,
};

/**
 * Numbers. Size is set by the caller - a figure may be large - but the weight,
 * tracking and tabular figures are fixed so digits hold position as they
 * change. Tabular figures are non-negotiable anywhere a value updates in place
 * (counters, code boxes, scores).
 */
export const FIGURE: CSSProperties = {
  fontWeight: 700,
  letterSpacing: '-0.04em',
  fontVariantNumeric: 'tabular-nums lining',
};

/** Tabular figures on their own, for text that is mostly prose but holds digits. */
export const FIGS: CSSProperties = { fontVariantNumeric: 'tabular-nums lining' };

/**
 * Headline sizes for hero type. Tracking follows TITLE (tighter as size grows);
 * the size itself is a layout decision left to the surface.
 */
export const DISPLAY_TRACKING = '-0.032em';
