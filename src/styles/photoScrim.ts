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

/* ==========================================================================
   ON-PHOTO FIGURE TINTS (BRIEF_EXPLORE_FIGURE_CHIP_CONTRAST §2a)

   NOT NEW COLOURS. Both values are already shipping, as unnamed local
   constants, on surfaces that solved this exact problem earlier:

     PHOTO_FIG_UNDER  #FF8A80  = the lighter under-par red for large
                                 TRANSLUCENT fills on a photograph
                                 (RoundShape's under-par gradient).
                                 TOPAR_UNDER_DARK is too deep to read as
                                 10px type through glass, which is why
                                 this exists — but the Explore round
                                 chip now takes TOPAR_UNDER_DARK
                                 anyway, by decision, so that the chip
                                 and the card's VS HCP figure are one
                                 red. See the measurement below.

     PHOTO_FIG_GOOD   #4ADE80  = the green StandoutTile's delta chip and the
                                 Explore course shelves already use, chosen
                                 because BAND_GREEN / BAND_GREEN_DARK die on a
                                 bright sky.

   THE CANVAS TOKENS (TOPAR_UNDER_DARK #E24B3F, BAND_GREEN_DARK #34D399) are
   correct on the near-black canvas and must not be used on glass over photos.

   MEASURED LIMIT, REPORTED: over the brightest ground in the catalogue no
   mid-tone hue reaches 4.5:1 through translucent glass — only white has that
   headroom. These tints plus the 0.62 fill plus PHOTO_FIG_SHADOW are the
    readable ceiling that still leaves the chip glass; see the brief report.

   MEASURED, AND ACCEPTED: over the brightest ground in the catalogue
   the chip's glass resolves to about #70736F. Against that,
   PHOTO_FIG_UNDER is 2.10:1 and TOPAR_UNDER_DARK is 1.21:1. The round
   chip's unit takes the deeper red regardless, because one card
   showing two reds for the same fact read as a fault. The figure
   itself (the gross score) stays WHITE and carries the reading; the
   unit is the smaller mark beside it.
   ========================================================================== */
export const PHOTO_FIG_UNDER = '#FF8A80';
export const PHOTO_FIG_GOOD = '#4ADE80';
/** Review-breakdown bars sit directly on variable photography. These are
 * intentionally brighter than the analytical canvas ramp. */
export const PHOTO_REVIEW_LABEL = 'rgba(255,255,255,0.62)';
export const PHOTO_REVIEW_TRACK = 'rgba(255,255,255,0.20)';
export const PHOTO_REVIEW_FILL = 'rgba(255,255,255,0.72)';
/** A tight dark shadow, not a glow: separates a coloured figure from a lifted
 *  ground without adding a second fill. Neutral white figures do not need it. */
export const PHOTO_FIG_SHADOW = '0 1px 2px rgba(0,0,0,0.62)';
