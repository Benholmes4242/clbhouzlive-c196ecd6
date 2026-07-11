/**
 * Overview V4 shared tokens — LIGHT canvas, dispatch aesthetic.
 */

export const V4 = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  ink: '#0F172A',
  inkSoft: 'rgba(15,23,42,0.62)',
  inkFaint: 'rgba(15,23,42,0.45)',
  hairline: 'rgba(15,23,42,0.10)',
  amber: '#F7931E',
  amberSoft: 'rgba(247,147,30,0.12)',
  gold: '#B8860B',
  goldSoft: 'rgba(184,134,11,0.14)',
  live: '#22C55E',
  violet: '#7C3AED',
  violetSoft: 'rgba(124,58,237,0.14)',
} as const;

// Match course-details hero height. The course-details page uses a
// full-viewport-under-safe-area hero; V4 mirrors that treatment via CSS
// calc so tsc has no coupling to the courses module.
export const HERO_HEIGHT_CSS = 'calc(100dvh * 0.62)';
