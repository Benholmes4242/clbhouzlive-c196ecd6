/**
 * Admin console theme. The console is DARK; there is no toggle.
 *
 * `adminLight` is the exact record of what light was and is the rollback
 * target. ROLLBACK IS ONE LINE: change `adminTheme = adminDark` to
 * `adminTheme = adminLight` at the bottom of this file and the whole console
 * returns to its previous appearance.
 *
 * `adminLight` is deliberately NOT `as const`: AdminTheme must be a widened
 * shape so `adminDark` can satisfy it. No value changed.
 *
 * `hairline` vs `line`: hairline separates ROWS inside a list, line draws a
 * PANEL edge.
 */
export const adminLight = {
  brand:      '#F7931E',
  brandText:  '#c97a10',
  brandSoft:  '#FFF4E6',
  ink:        '#0F172A',
  inkMuted:   '#64748B',
  inkFaint:   '#94A3B8',
  hairline:   '#EDF0F3',
  line:       '#E2E8F0',
  surface:    '#FFFFFF',
  canvas:     '#F8FAFC',
  ok:         '#16A34A',
  warn:       '#D97706',
  danger:     '#DC2626',
  okSoft:     '#DCFCE7',
  okText:     '#15803D',
  dangerSoft: '#FEE2E2',
  dangerText: '#B91C1C',
  warnSoft:   '#FEF3C7',
  warnText:   '#B45309',
  neutralSoft:'#F1F5F9',
  radius:     { sm: 8, md: 10, lg: 12, xl: 16 },
  shadowCard: '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
  shadowPop:  '0 8px 24px rgba(15,23,42,0.10)',
};

export type AdminTheme = typeof adminLight;

/**
 * Dark. Each departure from a naive inversion is deliberate:
 * - brand lifted from #F7931E, which is tuned for white and haloes on OLED.
 * - canvas is blue-black, never #000: true black leaves nowhere to put a
 *   surface below the panel and smears saturated strokes.
 * - surface being one step above canvas IS the separation; borders are trim.
 * - THREE text tiers only. Dark loses legibility fast below ~55% white.
 *
 * The *Soft tokens exist as a compatibility shim for the ~43 admin files not
 * being redesigned. The Dashboard uses NONE of them: no tinted background
 * carries state there.
 */
const adminDark: AdminTheme = {
  brand:      '#FFA83A',
  brandText:  '#FFB758',
  brandSoft:  'rgba(255,168,58,0.14)',
  ink:        '#E9EDF3',
  inkMuted:   '#B3BCC9',
  inkFaint:   '#7B8697',
  hairline:   'rgba(255,255,255,0.065)',
  line:       'rgba(255,255,255,0.11)',
  surface:    '#12161D',
  canvas:     '#0A0D12',
  ok:         '#3DDC91',
  warn:       '#F7B84B',
  danger:     '#FF7B72',
  okSoft:     'rgba(61,220,145,0.14)',
  okText:     '#5FE3A8',
  dangerSoft: 'rgba(255,123,114,0.14)',
  dangerText: '#FF9B93',
  warnSoft:   'rgba(247,184,75,0.14)',
  warnText:   '#F9C874',
  neutralSoft:'rgba(255,255,255,0.05)',
  radius:     { sm: 8, md: 10, lg: 12, xl: 16 },
  shadowCard: '0 1px 2px rgba(0,0,0,0.45)',
  shadowPop:  '0 12px 32px rgba(0,0,0,0.6)',
};

// ROLLBACK: swap adminDark for adminLight here. Nothing else changes.
export const adminTheme = adminDark;
