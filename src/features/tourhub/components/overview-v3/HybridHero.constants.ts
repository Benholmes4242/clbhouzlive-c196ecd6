/**
 * HybridHero design tokens — locked per §8 of HYBRID_HERO_IMPLEMENTATION_BRIEF.
 * Mobile-first, light theme. Do not introduce new tokens without updating the brief.
 */

// Layout
// Pass 4: photo band trimmed 280 → 252 (-10%).
// Pass 5.5: +22px for optional ChampionStrip narrative line → 528.
// Total = 252 (photo) + 62 (strip) + 4×40 (rows) + 32 (CTA) + 22 (narrative slack) = 528.
export const PHOTO_BAND_HEIGHT = 252;
export const TICKER_HEIGHT = 40;
export const STRIP_HEIGHT = 62;
export const ROW_HEIGHT_LEADER = 64;
export const ROW_HEIGHT_CHASER = 40;
export const TOTAL_HERO_HEIGHT_TARGET = 528;

// Colours (clbhouz Dispatch palette)
export const INK = '#0F172A';
export const INK_60 = 'rgba(15,23,42,0.60)';
export const INK_45 = 'rgba(15,23,42,0.45)';
export const INK_15 = 'rgba(15,23,42,0.15)';
export const BG = '#F8FAFC';
export const AMBER = '#F7931E';
export const GOLD = '#FBBC2E';
export const GOLD_DARK = '#D4A017';
export const GREEN_LIVE = '#16A34A';
export const GREEN_LIGHT = '#86EFAC';
export const RED = '#DC2626';
export const RED_LIGHT = '#FCA5A5';
export const SLATE_500 = '#64748B';

// Gradients
export const COURSE_GRADIENT =
  'linear-gradient(140deg, #1a3a2a 0%, #2d5a3d 22%, #4a7a5d 48%, #6b9c7a 70%, #b8d4a8 88%, #d4c89c 100%)';
export const COURSE_GRADIENT_DUSK =
  'linear-gradient(140deg, #1a2a3a 0%, #2d3d5a 25%, #5a5a7a 50%, #8a7a8c 72%, #c4946b 90%, #a06054 100%)';
export const COURSE_SCRIMS =
  'radial-gradient(ellipse 90% 60% at 50% 95%, rgba(0,0,0,0.55) 0%, transparent 70%), radial-gradient(ellipse 70% 50% at 30% 20%, rgba(0,80,40,0.30) 0%, transparent 60%)';
export const LEGIBILITY_SCRIM =
  'linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.04) 30%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 100%)';

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
