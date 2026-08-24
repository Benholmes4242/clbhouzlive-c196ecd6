/**
 * Dark composer tokens for post-v2 media-first composer.
 * CT consumes these values too now that the app is dark-only.
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

/** Shared dark-only composer tokens. Used by review-v2 and post-v2. */
export const CT = {
  canvas: CT_DARK.surface,
  ink: CT_DARK.ink,
  secondary: CT_DARK.mute,
  muted: CT_DARK.dim,
  hairline: CT_DARK.line,
  hairlineStrong: CT_DARK.line,
  dark: CT_DARK.surface,
  onDark: CT_DARK.ink,
  eyebrow: CT_DARK.ink,
  amber: CT_DARK.amber,
  amberDeep: CT_DARK.amber,
  amberSoft: 'rgba(247,147,30,0.10)',
  ghost: CT_DARK.elev,
  ghostRadius: 6,
  cardBg: CT_DARK.elev,
  cardRadius: 18,
  panelRadius: 14,
  pillRadius: 999,
  danger: CT_DARK.danger,
  success: '#34D77F',
  successOnDark: '#3ECF8E',
  shellBg: CT_DARK.bg,
} as const;
