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
 *   photo 260 + resultBand max 180 + topThree 155 + signature 36 = 631.
 * Pass 8: the live leaderboard now extends BELOW the hero, so the photo band is
 * shorter. It cannot be live-only — every carousel card shares one definite
 * height — so both numbers drop by the same 46px (306→260, 677→631).
 * Pass 8.1: 260 read slightly too tight, so both go 10% taller by the same
 * +26px (260→286, 631→657). The height is HARD — never flex-grown.
 * If upcoming state ever clips, raise this number — don't tear down the
 * load-bearing definite-height contract for HeroCarousel descendants.
 */
export const PHOTO_BAND_HEIGHT = 286;   // 360 → 306 (Pass 7.0.2) → 260 (Pass 8) → 286 (Pass 8.1)

export const STRIP_HEIGHT = 62;
export const ROW_HEIGHT_LEADER = 64;
export const ROW_HEIGHT_CHASER = 40;
export const TOTAL_HERO_HEIGHT_TARGET = 657;  // 731 → 677 → 631 → 657 (PHOTO_BAND_HEIGHT 260→286, +26)

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
 * Canonical Tour-Overview hero scrim layers — extracted so the Courses
 * Discover hero (`CoursesPageHero`), the Amateur Circuit hero, and the
 * standalone Course Details cinematic hero (`GolfClubView.cinematicHero`)
 * share pixel-identical treatment with `PhotoBand`.
 *
 * Top scrim: protects eyebrow / notch chrome.
 * Bottom scrim: heavy fade so the lower-third title stack holds legibility.
 * Radial ambient: same subtle green ambient used by PhotoBand.
 * Base gradient: the fallback venue gradient rendered when no image loads.
 */
export const HERO_TOP_SCRIM =
  'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 100%)';
export const HERO_BOTTOM_SCRIM =
  'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.85) 78%, rgba(0,0,0,0.92) 100%)';

/**
 * Build a single multi-layer CSS `background` value that matches the
 * PhotoBand scrim stack (top scrim + bottom scrim + radial ambient +
 * image + base gradient). Pass `null` to render just the gradient.
 */
export function buildOverviewHeroBackground(imageUrl: string | null | undefined): string {
  const top = `${HERO_TOP_SCRIM} top / 100% 80px no-repeat`;
  const bottom = `${HERO_BOTTOM_SCRIM} bottom / 100% 260px no-repeat`;
  const image = imageUrl ? `url(${imageUrl}) center 40% / cover no-repeat` : null;
  return [top, bottom, COURSE_SCRIMS, image, COURSE_GRADIENT].filter(Boolean).join(', ');
}

/**
 * CinematicFrame scrim (Direction A) — heavy at base for capsule+title legibility,
 * lets photo breathe in the upper third.
 */
export const CINEMATIC_SCRIM =
  'linear-gradient(to top, rgba(7,12,20,0.82) 0%, rgba(7,12,20,0.34) 30%, rgba(7,12,20,0.04) 54%, rgba(7,12,20,0.10) 100%)';

/**
 * Diverging score colour scale - re-exported from the canonical
 * holes/_constants tokens so hero consumers cannot drift out of sync.
 * (Under section 3h of the World Feed scorecard cutover brief.)
 */
export { SC_BIRDIE, SC_BOGEY } from '@/features/courses/components/holes/_constants';

export const CINEMATIC_FRAME_HEIGHT = 480;
export const CINEMATIC_FRAME_HEIGHT_RESULTS = 480;
export const CINEMATIC_FRAME_HEIGHT_UPCOMING = 480;

// Animation
export const MARQUEE_DURATION_SECONDS = 40;

// Type fonts
export const FONT_SANS = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

/**
 * Numeric column styling — SF Pro with tabular-nums for column alignment.
 * Use `...NUMERIC_STYLE` for any numeric span (scores, par, pos, etc.).
 * `"zero" 0` explicitly disables the slashed-zero glyph (Ben prefers unslashed).
 */
export const NUMERIC_STYLE = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontVariantNumeric: 'tabular-nums lining-nums' as const,
  fontFeatureSettings: '"zero" 0',
};
