/**
 * Re-export of the app-wide score colour scale.
 * The scale itself lives in src/features/courses/_shared/scoreBands.ts and is
 * shared with the Top 100 stats panel and course detail.
 */

/**
 * The composer's surfaces are dark, so score VALUES source the dark half of the
 * same scale (BRIEF_REVIEW_COMPOSER_DARK §3). Sourcing change only: no hex is
 * declared here and scoreBands.tsx is untouched.
 */
export {
  BAND_GREEN,
  BAND_AMBER,
  BAND_RED,
  BAND_GREEN_DARK,
  BAND_AMBER_DARK,
  BAND_RED_DARK,
  bandColor,
  bandColorOnDark,
} from '@/features/courses/_shared/scoreBands';
