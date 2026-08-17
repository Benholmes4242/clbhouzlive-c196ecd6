import type { CSSProperties } from 'react';

/**
 * PHOTO SCRIM — the ONE canonical treatment for anything that puts white text
 * or a glass chip over a photograph (BRIEF_APP_WIDE_SCRIM,
 * CORRECTION_APP_WIDE_SCRIM).
 *
 * Two tokens, and only two:
 *
 *   SCRIM_STANDOUT     the bottom-weighted gradient, for FULL-BLEED photo
 *                      surfaces (cards, tiles, media trays, posters).
 *   CHIP_GLASS_CLASS   the dark glass CLASS, for chips / badges / pucks that
 *                      sit ON a photograph. A chip NEVER takes the gradient.
 *
 * WHY A CLASS AND NOT AN INLINE FILL: the canonical chip DOES blur. The rule
 * lives in liquid-glass.css as `.standout-figure-chip` — a flat
 * rgba(24,30,26,0.62) base plus an @supports branch that drops the fill to 0.4
 * and adds blur(16px) saturate(180%). The flat value is the NO-backdrop-filter
 * FALLBACK, not the intended appearance; since iOS supports the property, the
 * blurred branch is the one members actually see. An inline style can only ever
 * express the fallback, which is why the chips flattened on busy photographs.
 *
 * CHIP_GLASS_BG / CHIP_GLASS_BORDER stay exported for the rare caller that
 * genuinely needs the raw values (canvas painting, non-DOM contexts).
 *
 * EXCLUDED by the brief: avatars, every hero, the fullscreen viewer and its
 * controls, the Clubhouse feed overlay foot (FeedOverlayLayer — a 42% band
 * carrying caption + action rail over full-screen post media), the TI pick
 * dark band (needs a 0.12 top floor, BRIEF_TI_TILE_DARK_SCRIM §2.1),
 * sheet/modal backdrops, brand washes, maps, rail edge fades, and state washes
 * such as VideoProcessingCard.
 *
 * THE EXCEPTION: a COLOUR-CARRYING band chip — e.g. ReviewTile's rated score,
 * where the green/amber/red hue is the payload — may still need white glass.
 * Do not sweep those into dark glass.
 */

/** The one gradient. Terminates transparent at 32% — it never meets a surface. */
export const SCRIM_STANDOUT =
  'linear-gradient(0deg, rgba(10,14,10,0.82) 0%, rgba(10,14,10,0) 32%)';

/** The one chip class. Carries both the flat fallback and the blurred branch. */
export const CHIP_GLASS_CLASS = 'standout-figure-chip';

/** Raw values — the fallback branch only. Prefer CHIP_GLASS_CLASS. */
export const CHIP_GLASS_BG = 'rgba(24,30,26,0.62)';
export const CHIP_GLASS_BORDER = '1px solid rgba(255,255,255,0.28)';

/** Text colour that goes with the chip class. Fill/border come from the class. */
export const CHIP_GLASS: CSSProperties = {
  color: '#FFFFFF',
};
