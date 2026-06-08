import { WHITE_ALPHA_55 } from './tokens';
/**
 * Canonical round-level score-to-par colour helper.
 *
 * Single source of truth for "what colour does a -6 score render as on this surface?"
 *
 * Convention (US leaderboard convention — aligned across hero, leaderboard,
 * schedule, and player history):
 * - Under-par (score < 0) → RED   (good in golf; deep on light, bright on dark)
 * - Over-par  (score > 0) → DARK  (ink on light, pale-white on dark)
 * - Even par / null       → neutral muted (ink-faint on light, white-alpha on dark)
 *
 * Leader emphasis variant: replaces under-par red with maximum-contrast monochrome
 * (white on dark, ink on light) for the #1 leader row.
 *
 * For HOLE-BY-HOLE scoring (eagle/birdie/par/bogey/etc.) see utils/scoreColors.ts —
 * that's a different semantic surface.
 */

import {
  INK,
  INK_FAINT,
  SCORE_OVER_PAR_LIGHT,
  SCORE_OVER_PAR_DARK,
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
    return theme === 'light' ? INK_FAINT : WHITE_ALPHA_55;
  }
  if (score < 0) {
    if (emphasis === 'leader') {
      return theme === 'light' ? INK : '#FFFFFF';
    }
    // under-par now RED (aligns with leaderboard "good = red")
    return theme === 'light' ? SCORE_OVER_PAR_LIGHT : SCORE_OVER_PAR_DARK;
  }
  // over-par now DARK
  return theme === 'light' ? INK : WHITE_ALPHA_55;
}
