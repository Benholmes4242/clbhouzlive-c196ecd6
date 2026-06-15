export const adminTheme = {
  brand:      '#F7931E',
  brandText:  '#c97a10',
  brandSoft:  '#FFF4E6',
  ink:        '#0F172A',
  inkMuted:   '#64748B',
  inkFaint:   '#94A3B8',
  line:       '#E2E8F0',
  surface:    '#FFFFFF',
  canvas:     '#F8FAFC',
  ok:         '#16A34A',
  warn:       '#D97706',
  danger:     '#DC2626',
  radius:     { sm: 8, md: 10, lg: 12, xl: 16 },
  shadowCard: '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
  shadowPop:  '0 8px 24px rgba(15,23,42,0.10)',
} as const;

export type AdminTheme = typeof adminTheme;
