// Light-surface design tokens for the business management surface.
// These match the locked house style (edit-v2 SectionCard, Tours Overview).
// Do NOT import src/tokens/ui.ts here — that token set is for dark surfaces.
export const BIZ = {
  // Surfaces
  card:        '#ffffff',
  pageBg:      '#F8FAFC',
  fill:        'rgba(15,23,42,0.03)',   // subtle inset (stats strip)
  fillStrong:  'rgba(15,23,42,0.06)',   // logo placeholder bg
  // Hairlines
  hair:        'rgba(15,23,42,0.07)',
  hairSoft:    'rgba(15,23,42,0.05)',
  // Ink
  ink:         '#0F172A',
  inkMute:     '#64748B',
  // Brand
  amber:       '#F7931E',
  amberTint:   'rgba(247,147,30,0.10)',
  amberHair:   'rgba(247,147,30,0.20)',
  amberSoft:   'rgba(247,147,30,0.70)',
  // Radii
  rCard:       16,   // rounded-2xl
  rInner:      12,   // rounded-xl (logo, stats strip, buttons)
  // Motion
  ease:        'easeOut',
} as const;
