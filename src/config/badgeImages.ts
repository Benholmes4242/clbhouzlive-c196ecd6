/**
 * Shared badge image and name config for all achievement sheets.
 * Single source of truth for milestone + regional badge assets.
 */

import rookieBadge from '@/assets/badges/rookie-badge.png';
import fairwayBadge from '@/assets/badges/fairway-badge.png';
import foundersBadge from '@/assets/badges/founders-badge.png';
import heritageBadge from '@/assets/badges/heritage-badge.png';
import centuryBadge from '@/assets/badges/century-badge.png';
import eliteBadge from '@/assets/badges/elite-badge.png';
import legendaryBadge from '@/assets/badges/legendary-badge.png';
import grandSlamBadge from '@/assets/badges/grandslam-badge.png';

import gbiBadge from '@/assets/badges/gbi-badge.png';
import europeBadge from '@/assets/badges/europe-badge.png';
import usaBadge from '@/assets/badges/usa-badge.png';
import globalBadge from '@/assets/badges/global-badge.png';

/** Maps milestone threshold → badge PNG */
export const MILESTONE_BADGE_IMAGES: Record<number, string> = {
  5: rookieBadge,
  10: fairwayBadge,
  20: foundersBadge,
  50: heritageBadge,
  100: centuryBadge,
  200: eliteBadge,
  300: legendaryBadge,
  400: grandSlamBadge,
};

/** Maps milestone threshold → display name */
export const MILESTONE_NAMES: Record<number, string> = {
  5: 'Rookie Club',
  10: 'Fairway Club',
  20: 'Founders Club',
  50: 'Heritage Club',
  100: 'Century Club',
  200: 'Elite Club',
  300: 'Legendary Club',
  400: 'Grand Slam Club',
};

/** Maps region slug → badge PNG */
export const REGION_BADGE_IMAGES: Record<string, string> = {
  'gb-i': gbiBadge,
  europe: europeBadge,
  usa: usaBadge,
  global: globalBadge,
};
