/**
 * BRIEF_ECHO_CHAT §6 — ECHO'S MARK. IT MUST NOT CLIP.
 *
 * Ben saw the last bar cut off. CAUSE: the mark's width was left to its flex
 * parent, so a shrinking container clipped it. The fixes, all four:
 *   - THE MARK COMPUTES ITS OWN WIDTH from bar count, bar width and gap. Never
 *     `width: 100%`, never left to the parent.
 *   - flexShrink: 0 ON THE MARK AND ON EVERY BAR (see .ec-wave / .ec-wave-bar).
 *   - EACH BAR HAS A 2px FLOOR so a small size cannot round one down to a
 *     sub-pixel and drop it.
 *   - NO ANCESTOR carries overflow: hidden; the mark itself is overflow visible.
 *
 * IT ANIMATES ONLY WHILE THINKING (`live`). Static everywhere else — a
 * permanently animating logo is a distraction, not a brand. The keyframes and
 * the reduced-motion hold live in echo-chat.css.
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
  const bw = Math.max(2, Math.round(size * 0.07));
  const gap = Math.max(2, Math.round(size * 0.06));
  // Computed, never inherited: bar widths + the gaps between them.
  const width = count * bw + (count - 1) * gap;

  return (
    <span
      aria-hidden
      className={live ? 'ec-wave ec-wave--live' : 'ec-wave'}
      style={{ gap, height: size, width }}
    >
      {hs.map((h, i) => (
        <i
          key={i}
          className="ec-wave-bar"
          style={{
            width: bw,
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
