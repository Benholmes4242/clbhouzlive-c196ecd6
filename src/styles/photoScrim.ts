import type { CSSProperties } from 'react';

/**
 * PHOTO SCRIM — the ONE canonical treatment for anything that puts white text
 * or a glass chip over a photograph (BRIEF_APP_WIDE_SCRIM).
 *
 * Two tokens, and only two:
 *
 *   SCRIM_STANDOUT  the bottom-weighted gradient, for FULL-BLEED photo
 *                   surfaces (cards, tiles, media trays, posters).
 *   CHIP_GLASS      the dark glass FILL, for chips / badges / pucks that sit
 *                   ON a photograph. A chip NEVER takes the gradient.
 *
 * EXCLUDED by the brief: avatars, every hero, the fullscreen viewer and its
 * controls, sheet/modal backdrops, brand washes, maps, rail edge fades.
 */

/** The one gradient. Terminates transparent at 32% — it never meets a surface. */
export const SCRIM_STANDOUT =
  'linear-gradient(0deg, rgba(10,14,10,0.82) 0%, rgba(10,14,10,0) 32%)';

/**
 * The one chip fill. NO backdrop-filter: a static blur costs a compositing
 * layer per card on mobile (mem://constraints/mobile-performance-rendering),
 * which is why the Discover glass badges already ship this value flat.
 */
export const CHIP_GLASS_BG = 'rgba(24,30,26,0.62)';
export const CHIP_GLASS_BORDER = '1px solid rgba(255,255,255,0.28)';

export const CHIP_GLASS: CSSProperties = {
  background: CHIP_GLASS_BG,
  border: CHIP_GLASS_BORDER,
  color: '#FFFFFF',
};
