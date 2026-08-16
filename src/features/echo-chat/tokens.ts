/**
 * BRIEF_ECHO_CHAT §1 / §7 — colour and type for the Echo thread.
 *
 * #05070A IS THE CLUBHOUSE CANVAS (CardFeed, ClubhouseSkeletonShimmer), so
 * Echo, Messages and the feed share one surface colour and the journey between
 * them is dark to dark.
 *
 * NO FADED COLOUR. The three ink tiers are THREE SEPARATE SOLID VALUES; nothing
 * takes its tone by reducing another element's opacity or saturation.
 *
 * AMBER APPEARS ON THE WAVEFORM AND NOWHERE ELSE ON THIS SURFACE (§7) — not on
 * the member's bubble, not on the send action, not on chart bars, figures,
 * labels or the thinking ticks. `grep AMBER` over this feature must find the
 * mark and nothing else. This is a deliberate narrowing of the app-wide rule:
 * elsewhere amber marks the viewing member, here it marks Echo.
 *
 * THE DEMANDING RAMP IS NOT DECLARED HERE. It is imported from its single
 * definition (features/courses/.../analytical/tokens) by the consumer.
 */

import type React from 'react';

export const EC = {
  /** The Clubhouse canvas. Echo renders no photograph in any state (§2). */
  BLACK: '#05070A',
  /** A chart's card. Solid, not the canvas at an alpha. */
  PANEL: '#10151C',
  /** Track behind a bar. */
  RAISED: '#181F28',
  /** Hairline / border. */
  LINE: '#252E39',
  /** Ink tier 1 — the member's bubble text sits on white, so this is the ink. */
  INK: '#F4F6F8',
  /** Ink tier 2 — body prose. A solid value, not white at an alpha. */
  INK_2: '#A9B4C0',
  /** Ink tier 3 — eyebrows, basis lines, hole numerals. Solid. */
  INK_3: '#6C7885',
  /** ECHO'S MARK. The only amber on this surface. */
  AMBER: '#F7931E',
  /** The one failure tone. */
  RED: '#E5484D',
} as const;

const FIGS: React.CSSProperties = { fontVariantNumeric: 'tabular-nums lining-nums' };

/** Nothing at weight 800. Nothing below 8.5px. */
export const T = {
  /** Section / basis label. */
  LABEL: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: EC.INK_3,
  } as React.CSSProperties,

  /** Smallest label used — the floor. */
  MICRO: {
    fontSize: 8.5,
    fontWeight: 700,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: EC.INK_3,
    ...FIGS,
  } as React.CSSProperties,

  /** Echo's prose. Not a bubble — body tone, flowing down the thread (§3.2). */
  BODY: {
    fontSize: 15,
    lineHeight: 1.55,
    fontWeight: 400,
    color: EC.INK_2,
  } as React.CSSProperties,

  /** The member's question, inside the white bubble. */
  ASKED: {
    fontSize: 15,
    lineHeight: 1.4,
    fontWeight: 400,
    color: EC.BLACK,
  } as React.CSSProperties,

  /** Entry headline / history headline. */
  DISPLAY: {
    fontSize: 27,
    fontWeight: 700,
    letterSpacing: '-0.045em',
    lineHeight: 1.18,
    color: EC.INK,
  } as React.CSSProperties,

  /** A figure called out beside a chart bar. */
  FIG: {
    fontSize: 13.5,
    fontWeight: 700,
    color: EC.INK,
    ...FIGS,
  } as React.CSSProperties,
} as const;

export { FIGS };
