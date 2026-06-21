/**
 * HybridHero design tokens — hero-specific layout, gradients, animation, and typography.
 * Colours re-exported from _shared/tokens.ts as the canonical source.
 * Mobile-first, light theme. Layout/gradient/animation constants are locked
 * per §8 of HYBRID_HERO_IMPLEMENTATION_BRIEF — do not introduce new layout
 * tokens without updating the brief.
 */

// Layout
/**
 * Pass 7 + 7.0.2: results state hero composition.
 *   photo 306 + resultBand max 180 + topThree 155 + signature 36 = 677.
 * If upcoming state ever clips, raise this number — don't tear down the
 * load-bearing definite-height contract for HeroCarousel descendants.
 */
export const PHOTO_BAND_HEIGHT = 306;   // was 360 — Pass 7.0.2 trim

export const STRIP_HEIGHT = 62;
export const ROW_HEIGHT_LEADER = 64;
export const ROW_HEIGHT_CHASER = 40;
export const TOTAL_HERO_HEIGHT_TARGET = 677;  // was 731 — Pass 7.0.2: PHOTO_BAND_HEIGHT 360→306 (−54)

// Colours — re-exported from _shared/tokens.ts for hero-internal use.
// These re-exports preserve existing band-file imports (`import { INK, AMBER, ... } from '../HybridHero.constants'`)
// while ensuring single source of truth. NEW band files should import directly from `_shared/tokens`.
export {
  INK,
  HAIRLINE_INK_15 as INK_15,
  INK_ALPHA_45 as INK_45,
  INK_ALPHA_60 as INK_60,
  SLATE_50 as BG,
  AMBER,
  TREND_UP as GREEN_LIVE,
  DANGER as RED,
  INK_MUTE as SLATE_500,
  LEADER_GOLD as GOLD,
  LEADER_GOLD_DARK as GOLD_DARK,
  SCORE_UNDER_PAR_DARK_PALE as GREEN_LIGHT,
  SCORE_OVER_PAR_DARK_PALE as RED_LIGHT,
} from '../../_shared/tokens';

// Gradients
export const COURSE_GRADIENT =
  'linear-gradient(140deg, #1a3a2a 0%, #2d5a3d 22%, #4a7a5d 48%, #6b9c7a 70%, #b8d4a8 88%, #d4c89c 100%)';
export const COURSE_GRADIENT_DUSK =
  'linear-gradient(140deg, #1a2a3a 0%, #2d3d5a 25%, #5a5a7a 50%, #8a7a8c 72%, #c4946b 90%, #a06054 100%)';
export const COURSE_SCRIMS =
  'radial-gradient(ellipse 90% 60% at 50% 95%, rgba(0,0,0,0.55) 0%, transparent 70%), radial-gradient(ellipse 70% 50% at 30% 20%, rgba(0,80,40,0.30) 0%, transparent 60%)';
export const LEGIBILITY_SCRIM =
  'linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.04) 30%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 100%)';

/**
 * CinematicFrame scrim (Direction A) — heavy at base for capsule+title legibility,
 * lets photo breathe in the upper third.
 */
export const CINEMATIC_SCRIM =
  'linear-gradient(to top, rgba(7,12,20,0.94) 0%, rgba(7,12,20,0.55) 32%, rgba(7,12,20,0.12) 56%, rgba(7,12,20,0.22) 100%)';

export const CINEMATIC_FRAME_HEIGHT = 420;

// Animation
export const MARQUEE_DURATION_SECONDS = 40;

// Type fonts
export const FONT_SANS = "'Geist', -apple-system, BlinkMacSystemFont, sans-serif";

/**
 * Numeric column styling — Geist with tabular-nums for column alignment.
 * Use `...NUMERIC_STYLE` for any numeric span (scores, par, pos, etc.).
 * `"zero" 0` explicitly disables the slashed-zero glyph (Ben prefers unslashed).
 */
export const NUMERIC_STYLE = {
  fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, sans-serif",
  fontVariantNumeric: 'tabular-nums lining-nums' as const,
  fontFeatureSettings: '"zero" 0',
};
