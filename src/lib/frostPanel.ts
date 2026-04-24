/**
 * Design tokens for the Frost Panel visual system.
 * Used across review post surfaces (InlineReviewCard, ReviewBottomSheet,
 * ReviewOverlayCore, CreatorCapsule review mode).
 *
 * Vision Pro / iOS 17+ glass morphism language with amber accents.
 */
export const FROST = {
  // Glass surfaces
  glass:        'rgba(15, 20, 30, 0.42)',     // primary panel (tile)
  glassStrong:  'rgba(12, 18, 28, 0.75)',     // sheet
  glassSoft:    'rgba(255, 255, 255, 0.06)',  // nested card inside sheet
  border:       'rgba(255, 255, 255, 0.14)',
  borderSoft:   'rgba(255, 255, 255, 0.10)',
  borderNested: 'rgba(255, 255, 255, 0.12)',
  innerHighlight: 'inset 0 1px 0 rgba(255,255,255,0.18)',
  dropShadow:     '0 20px 60px rgba(0,0,0,0.5)',

  // Ink (text) — white at descending opacity for hierarchy
  ink:        '#ffffff',
  inkSoft:    'rgba(255,255,255,0.85)',
  inkMute:    'rgba(255,255,255,0.70)',
  inkMuter:   'rgba(255,255,255,0.50)',
  inkFaint:   'rgba(255,255,255,0.35)',

  // Amber accent (kept consistent with existing app palette: #F7931E)
  amber:        '#F7931E',
  amberSoft:    '#FCD99D',
  amberDeep:    '#C97211',
  amberTint:    'rgba(247, 147, 30, 0.18)',
  amberBorder:  'rgba(247, 147, 30, 0.35)',

  // Chromatic glow accents (decorative, on glass surfaces)
  amberGlow: 'radial-gradient(circle, rgba(247,147,30,0.35), transparent 65%)',
  blueGlow:  'radial-gradient(circle, rgba(59, 130, 246, 0.2), transparent 65%)',
} as const;

/**
 * Standard backdrop-filter recipe used on Frost Panel surfaces.
 * Tuned for iOS Safari and modern Android WebView.
 *
 * Use the `tile` variant for cards that may render many at once (grids, feed lists).
 * Use `panel` for primary feed tiles.
 * Use `sheet` for the bottom sheet — strongest blur, only one at a time.
 */
export const FROST_BLUR = {
  tile:  'blur(20px) saturate(160%)',
  panel: 'blur(32px) saturate(180%)',
  sheet: 'blur(40px) saturate(180%)',
} as const;

/**
 * Score gradient mask — applied to large numeric scores on dark glass surfaces.
 * If contrast becomes borderline against bright photo backdrops, raise the
 * lower stop from 0.75 to 0.85.
 */
export const FROST_SCORE_GRADIENT: React.CSSProperties = {
  background: 'linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.75) 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

/**
 * Format a rating for display: "10" for exact 10, otherwise one decimal.
 */
export function formatFrostRating(rating: number): string {
  return rating === 10 ? '10' : rating.toFixed(1);
}

/**
 * Split a course name on a parenthetical to get a name + subtitle.
 *  "Gleneagles (King's)"   → { name: "Gleneagles", subtitle: "The King's Course" }
 *  "Pebble Beach"          → { name: "Pebble Beach", subtitle: null }
 *  "St Andrews (Old)"      → { name: "St Andrews", subtitle: "The Old Course" }
 */
export function splitCourseName(courseName: string): { name: string; subtitle: string | null } {
  const match = courseName.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (!match) return { name: courseName, subtitle: null };
  const [, base, inner] = match;
  const trimmed = inner.trim();
  // If it already contains "Course", don't double-suffix
  const subtitle = /course/i.test(trimmed) ? `The ${trimmed}` : `The ${trimmed} Course`;
  return { name: base.trim(), subtitle };
}

import type React from 'react';
