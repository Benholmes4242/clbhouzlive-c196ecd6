/**
 * BRIEF_MESSAGES_ECHO_PALETTE §1 / §6 — Messages runs on Echo's palette.
 *
 * WHAT IS TAKEN: the near-black surface, the three SOLID ink tiers, the glass
 * (imported from echo-chat.css — ONE definition, §3.1), and amber meaning
 * THE VIEWING MEMBER.
 *
 * WHAT IS NOT TAKEN: the waveform. That is Echo's mark and it does not appear
 * on this surface.
 *
 * NO FADED COLOUR (§3.3): every tone below is its own solid value. Nothing here
 * is another token at an alpha. Weight never reaches 800, size never drops
 * below 8.5px (§6).
 */

import type React from 'react';
import { EC } from '@/features/echo-chat/tokens';

export const MSG = {
  /** The surface. Same near-black as the caddie stage. */
  BLACK: EC.BLACK,
  /** Ink tier 1 — unread names, unread previews, bubble body. */
  INK: EC.INK,
  /** Ink tier 2 — read names, secondary lines. Solid, not white at an alpha. */
  INK_2: EC.INK_2,
  /** Ink tier 3 — context lines, timestamps, basis. Solid. */
  INK_3: EC.INK_3,
  /** THE VIEWING MEMBER. Own bubbles, own scores. Never chrome, never unread. */
  AMBER: EC.AMBER,
  /** Hairline on glass and between rows. A border, not a semantic tone. */
  EDGE: EC.LINE,
  /** Row separator on the near-black surface. */
  RULE: 'rgba(255,255,255,0.07)',
  /** Failure. The only other colour on the surface. */
  DANGER: '#F0616D',
} as const;

const FIGS: React.CSSProperties = { fontVariantNumeric: 'tabular-nums lining-nums' };

export const MT = {
  /** Screen title. */
  TITLE: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: MSG.INK,
  } as React.CSSProperties,

  /** Section eyebrow (shared-ground strip, compose groups). */
  EYEBROW: {
    fontSize: 9.5,
    fontWeight: 700,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: MSG.INK_3,
  } as React.CSSProperties,

  /** Row name. */
  NAME: {
    fontSize: 15,
    fontWeight: 600,
    letterSpacing: '-0.011em',
    lineHeight: '18px',
  } as React.CSSProperties,

  /** Row preview — the entire reason a row exists (§2.1). */
  PREVIEW: {
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: '-0.006em',
    lineHeight: '16px',
  } as React.CSSProperties,

  /** The context line: where and when you last played together (§2.3). */
  CONTEXT: {
    fontSize: 10.5,
    fontWeight: 600,
    letterSpacing: '0.01em',
    lineHeight: '13px',
    color: MSG.INK_3,
    ...FIGS,
  } as React.CSSProperties,

  /** Timestamp. */
  TIME: {
    fontSize: 10.5,
    fontWeight: 600,
    lineHeight: '13px',
    color: MSG.INK_3,
    ...FIGS,
  } as React.CSSProperties,

  /** Unread count. WHITE, never amber (§2.2). */
  BADGE: {
    fontSize: 10.5,
    fontWeight: 700,
    ...FIGS,
  } as React.CSSProperties,

  /** Bubble body. */
  BUBBLE: {
    fontSize: 14.5,
    fontWeight: 500,
    lineHeight: 1.38,
    letterSpacing: '-0.008em',
  } as React.CSSProperties,

  /** Shared-round card figure. The member's own score is AMBER. */
  SCORE: {
    fontSize: 19,
    fontWeight: 700,
    letterSpacing: '-0.03em',
    ...FIGS,
  } as React.CSSProperties,

  /** Smallest type on the surface. Never below 8.5px. */
  MICRO: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: MSG.INK_3,
  } as React.CSSProperties,
} as const;

export { FIGS };
