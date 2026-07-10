/**
 * Review Composer v2 design tokens.
 * Messaging-v2 aligned: warm light canvas + editorial ink.
 */

export const RV2 = {
  canvas: '#F8FAFC',
  ink: '#1F2428',
  secondary: '#8A9099',
  muted: '#AEB4BC',
  hairline: 'rgba(0,0,0,0.07)',
  hairlineStrong: 'rgba(0,0,0,0.12)',
  dark: '#15171F',
  amber: '#F7931E',
  amberSoft: 'rgba(247,147,30,0.10)',
  ghost: '#EEF1F4',
  ghostRadius: 6,
  cardBg: '#FFFFFF',
  cardRadius: 18,
  panelRadius: 14,
} as const;

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
