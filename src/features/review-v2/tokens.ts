/**
 * Review Composer v2 design tokens.
 * Values live in the shared composer token file so review-v2 and post-v2
 * cannot drift apart.
 */

import { CT } from '@/features/_shared/composerTokens';

export const RV2 = CT;

export const VERDICTS = [
  { slug: 'must_play', label: 'Must play' },
  { slug: 'worth_the_trip', label: 'Worth the trip' },
  { slug: 'decent_day_out', label: 'Decent day out' },
  { slug: 'one_and_done', label: 'One and done' },
] as const;

export type VerdictSlug = (typeof VERDICTS)[number]['slug'];

export const REVIEW_V2_LIMITS = {
  MAX_MEDIA: 10,
  MAX_VIDEO_SECONDS: 180,
} as const;
