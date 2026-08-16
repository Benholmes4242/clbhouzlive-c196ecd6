/**
 * BRIEF_ECHO_CADDIE §7 — colour and type for the caddie surface.
 *
 * NO FADED COLOUR. The three ink tiers below are THREE SEPARATE SOLID VALUES.
 * Nothing here derives a tone by reducing another element's opacity or
 * saturation — that is the rule the whole app now runs on and Echo does not get
 * an exemption.
 *
 * AMBER: app-wide amber means THE VIEWING MEMBER, and on this surface it is
 * ALSO Echo's mark. Narrow rule, deliberately: amber appears on THE MARK and on
 * THE MEMBER'S OWN FIGURES, and nowhere else. Never chrome, never links, never
 * emphasis. `grep -n AMBER` over this feature should only ever find the
 * waveform and a member figure.
 *
 * THE DEMANDING RAMP IS NOT DECLARED HERE. It is imported from its single
 * definition (features/courses/.../analytical/tokens) by the consumer.
 */

import type React from 'react';

export const EC = {
  /** The image-absent / no-rounds surface. A missing photograph is not drawn. */
  BLACK: '#08090B',
  /** Ink tier 1 — headlines, hero figures. */
  INK: '#FFFFFF',
  /** Ink tier 2 — body and advice. A solid value, not white at an alpha. */
  INK_2: '#C9CFD7',
  /** Ink tier 3 — eyebrows, basis lines. A solid value, not white at an alpha. */
  INK_3: '#8B929C',
  /** Echo's mark, and the member's own figures. Nothing else. */
  AMBER: '#F7931E',
  /** Hairline on glass. A border, not a tone doing semantic work. */
  EDGE: 'rgba(255,255,255,0.13)',
} as const;

const FIGS: React.CSSProperties = { fontVariantNumeric: 'tabular-nums lining-nums' };

/**
 * TYPE. Nothing at weight 800. Nothing below 8.5px. Figures get BIGGER and
 * TIGHTER, never heavier. Body copy runs LARGER than elsewhere in the app —
 * it is read over a photograph, at arm's length, one idea at a time.
 */
export const T = {
  /** Panel eyebrow / state label. */
  EYEBROW: {
    fontSize: 9.5,
    fontWeight: 700,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: EC.INK_3,
  } as React.CSSProperties,

  /** The one hero figure a panel carries. Big and tight. */
  HERO: {
    fontSize: 64,
    lineHeight: 0.92,
    fontWeight: 700,
    letterSpacing: '-0.045em',
    color: EC.INK,
    ...FIGS,
  } as React.CSSProperties,

  /** A hero that is words rather than a number (Echo's lead line). */
  HERO_WORDS: {
    fontSize: 27,
    lineHeight: 1.16,
    fontWeight: 700,
    letterSpacing: '-0.022em',
    color: EC.INK,
  } as React.CSSProperties,

  /** Supporting figure inside a figure group. */
  FIG: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: '-0.03em',
    color: EC.INK,
    ...FIGS,
  } as React.CSSProperties,

  /** The advice line. Says what to DO. */
  ADVICE: {
    fontSize: 16,
    lineHeight: 1.42,
    fontWeight: 500,
    letterSpacing: '-0.008em',
    color: EC.INK_2,
  } as React.CSSProperties,

  /** Body copy on the ask / empty states. Larger than elsewhere. */
  BODY: {
    fontSize: 17,
    lineHeight: 1.38,
    fontWeight: 600,
    letterSpacing: '-0.014em',
    color: EC.INK,
  } as React.CSSProperties,

  /** §4.4 the basis. A figure without its sample is not analytical. */
  BASIS: {
    fontSize: 11.5,
    fontWeight: 600,
    letterSpacing: '0.01em',
    color: EC.INK_3,
    ...FIGS,
  } as React.CSSProperties,

  /** Small caption / hole numerals under the chart. */
  MICRO: {
    fontSize: 8.5,
    fontWeight: 700,
    letterSpacing: '0.02em',
    color: EC.INK_3,
    ...FIGS,
  } as React.CSSProperties,
} as const;

export { FIGS };
