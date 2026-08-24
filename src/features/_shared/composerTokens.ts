/**
 * Shared composer tokens. Used by review-v2 and post-v2.
 * Warm light canvas + editorial ink. Do not add a second grey scale.
 */

export const CT = {
  canvas: '#F8FAFC',
  ink: '#1F2428',
  secondary: '#8A9099',
  muted: '#AEB4BC',
  hairline: 'rgba(0,0,0,0.07)',
  hairlineStrong: 'rgba(0,0,0,0.12)',
  dark: '#15171F',
  onDark: '#F5F6F7',
  // Canonical eyebrow/kicker ink on light surfaces (Aug 2026 ink flip).
  eyebrow: '#0E1216',
  amber: '#F7931E',
  amberDeep: '#C2620A',
  amberSoft: 'rgba(247,147,30,0.10)',
  ghost: '#EEF1F4',
  ghostRadius: 6,
  cardBg: '#FFFFFF',
  cardRadius: 18,
  panelRadius: 14,
  pillRadius: 999,
  danger: '#B00020',
  success: '#0F8F4A',
  // ON-DARK green. CT.success (#0F8F4A) is the light-surface green and stays
  // exactly as it is; on the #0A0B0D success shell it reads muddy and all but
  // vanishes as a 14%-alpha radial. This one is tuned against that shell.
  successOnDark: '#3ECF8E',
  shellBg: '#0A0B0D',
} as const;

/**
 * Dark composer tokens for post-v2 media-first composer.
 * Review-v2 stays on CT (light) — do not use CT_DARK there.
 */
export const CT_DARK = {
  bg: '#0B0F14',
  surface: '#15171F',
  elev: '#1B222B',
  line: 'rgba(248,250,252,0.09)',
  ink: '#F8FAFC',
  mute: 'rgba(248,250,252,0.60)',
  dim: 'rgba(248,250,252,0.34)',
  amber: '#F7931E',
  danger: '#FF6B6B',
} as const;
