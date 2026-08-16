/**
 * BRIEF_ECHO_CHAT §6 / correction §2 — ECHO'S MARK. IT MUST NOT CLIP.
 *
 * Ben still saw the right-hand bar cut off. It is a FLEX problem and it needs
 * all four of these, not one — so all four are here, inline as well as in CSS,
 * because a class can be overridden by a parent's flex shorthand:
 *
 *   1. THE MARK COMPUTES ITS OWN WIDTH from bar count, bar width and gap — an
 *      explicit px width, pinned by minWidth AND maxWidth so no flex parent can
 *      negotiate it. Never `100%`, never `auto`, never left to the parent.
 *   2. flexShrink: 0 ON THE MARK ITSELF (inline `flex: 0 0 <width>px`).
 *   3. flexShrink: 0 ON EVERY BAR — the one usually missed: a flex parent
 *      shrinks its children even when the container's own width is fixed. Each
 *      bar also carries flexBasis + minWidth at its own width.
 *   4. EACH BAR FLOORED AT 2px so a small `size` cannot round a bar down to a
 *      sub-pixel and drop it.
 *
 * AND NO ANCESTOR MAY CLIP IT: the mark is `overflow: visible`, and the only
 * `overflow: hidden` on this surface is `.ec-root` (the fixed page frame) and
 * `.ec-thread`'s `overflow-x` — both at the viewport edge, neither between the
 * thread row and the mark.
 *
 * boxSizing is forced to content-box on the bars: a global `* { box-sizing:
 * border-box }` plus any inherited padding would eat into the 2px floor.
 *
 * IT ANIMATES ONLY WHILE THINKING (`live`) and only via scaleY, which cannot
 * change the mark's width. The keyframes and the reduced-motion hold live in
 * echo-chat.css.
 *
 * §7 AMBER IS THE MARK, and the only amber on this surface.
 */

import React from 'react';
import { EC } from '../tokens';

const HEIGHTS = [0.30, 0.55, 0.82, 1, 0.82, 0.55, 0.30];

export const EchoWaveform: React.FC<{
  size?: number;
  /** True ONLY while Echo is thinking. */
  live?: boolean;
  bars?: number;
  colour?: string;
}> = ({ size = 22, live = false, bars = 7, colour = EC.AMBER }) => {
  const count = Math.max(1, Math.min(HEIGHTS.length, bars));
  const hs = HEIGHTS.slice(0, count);
  // 4. THE 2px FLOOR — on the bar and on the gap.
  const bw = Math.max(2, Math.round(size * 0.07));
  const gap = Math.max(2, Math.round(size * 0.06));
  // 1. COMPUTED, NEVER INHERITED: bar widths + the gaps between them.
  const width = count * bw + (count - 1) * gap;

  return (
    <span
      aria-hidden
      className={live ? 'ec-wave ec-wave--live' : 'ec-wave'}
      style={{
        gap,
        height: size,
        // 1 + 2. Pinned width, and no shrink at any level of the shorthand.
        width,
        minWidth: width,
        maxWidth: width,
        flex: `0 0 ${width}px`,
        flexShrink: 0,
        boxSizing: 'content-box',
        overflow: 'visible',
      }}
    >
      {hs.map((h, i) => (
        <i
          key={i}
          className="ec-wave-bar"
          style={{
            // 3 + 4. Every bar refuses to shrink and never falls under 2px.
            width: bw,
            minWidth: bw,
            flex: `0 0 ${bw}px`,
            flexShrink: 0,
            boxSizing: 'content-box',
            height: `${h * 100}%`,
            background: colour,
            borderRadius: bw / 2,
            animationDelay: live ? `${i * 0.09}s` : undefined,
          }}
        />
      ))}
    </span>
  );
};
