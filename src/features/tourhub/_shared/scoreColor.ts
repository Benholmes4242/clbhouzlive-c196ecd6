/**
 * Canonical round-level score-to-par colour helper.
 *
 * Single source of truth for "what colour does a -6 score render as on this surface?"
 *
 * Convention (US leaderboard convention — aligned across hero, leaderboard,
 * schedule, and player history):
 * - Under-par (score < 0) → RED   (good in golf; deep on light, bright on dark)
 * - Over-par  (score > 0) → INK / muted white on dark
 * - Even par / null       → neutral muted (ink-faint on light, white-alpha on dark)
 *
 * Leader emphasis variant: replaces under-par red with maximum-contrast monochrome
 * (white on dark, ink on light) for the #1 leader row.
 *
 * For HOLE-BY-HOLE scoring (eagle/birdie/par/bogey/etc.) see the SC_* World
 * Feed tokens in features/courses/components/holes/_constants — that's a
 * different semantic surface (per-hole chips, not round to-par colour).
 */

import {
  INK,
  TOPAR_UNDER_LIGHT,
  TOPAR_UNDER_DARK,
  TOPAR_OVER_LIGHT,
  TOPAR_OVER_DARK,
  TOPAR_EVEN_LIGHT,
  TOPAR_EVEN_DARK,
} from './tokens';

export type ScoreTheme = 'light' | 'dark';
export type ScoreEmphasis = 'standard' | 'leader';

/**
 * Get the colour for a score-to-par value.
 *
 * @param score - score relative to par; negative = under, positive = over, 0 = even
 * @param theme - 'light' for light backgrounds, 'dark' for dark backgrounds
 * @param emphasis - 'standard' (default); 'leader' for monochrome under-par
 */
export function getScoreColor(
  score: number | null | undefined,
  theme: ScoreTheme,
  emphasis: ScoreEmphasis = 'standard',
): string {
  if (score == null || score === 0) {
    return theme === 'light' ? TOPAR_EVEN_LIGHT : TOPAR_EVEN_DARK;
  }
  if (score < 0) {
    if (emphasis === 'leader') {
      return theme === 'light' ? INK : '#FFFFFF';
    }
    return theme === 'light' ? TOPAR_UNDER_LIGHT : TOPAR_UNDER_DARK;
  }
  return theme === 'light' ? TOPAR_OVER_LIGHT : TOPAR_OVER_DARK;
}
