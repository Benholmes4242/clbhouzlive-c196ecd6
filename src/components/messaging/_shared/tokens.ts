/**
 * Messaging feature tokens — feature-private. Mirrors the courses + tourhub patterns.
 *
 * Migration pattern:
 *   - INK / INK_MUTE / INK_FAINT / INK_LIGHT — canonical slate ramp for text + secondary content
 *   - SURFACE / SHELL_BG — white + slate-50 page bg
 *   - AMBER + AMBER tints — brand amber for user bubbles, HCP pills, primary CTA family
 *   - SUNDRIDGE_GREEN + tints — golf-secondary brand green for course pills, presence indicators
 *   - STATUS_ONLINE — green presence dot color (distinct from sundridge green)
 *   - HAIRLINE_INK_X / INK_TINT_X — slate alpha scales for borders + faint surfaces
 *   - DESTRUCTIVE — red-600 for destructive actions (text only; backgrounds stay neutral)
 */

// Text ramp
export const INK = '#0F172A';
export const INK_DEEP = '#1e293b';                          // slate-800, message body
export const INK_MUTE = '#64748B';
export const INK_FAINT = '#94A3B8';
export const INK_LIGHT = '#CBD5E1';
export const INK_MID = '#475569';                            // slate-600, sender names

// Surfaces
export const SURFACE = '#ffffff';
export const SHELL_BG = '#F8FAFC';                           // page bg
export const SLATE_50 = '#F8FAFC';                           // alias

// Brand amber
export const AMBER = '#F7931E';
export const AMBER_TINT_06 = 'rgba(247,147,30,0.06)';
export const AMBER_TINT_10 = 'rgba(247,147,30,0.10)';
export const AMBER_TINT_12 = 'rgba(247,147,30,0.12)';
export const AMBER_TINT_22 = 'rgba(247,147,30,0.22)';
export const AMBER_TINT_25 = 'rgba(247,147,30,0.25)';
export const AMBER_TINT_28 = 'rgba(247,147,30,0.28)';

// Brand secondary green (Sundridge Park / course pills)
export const SUNDRIDGE_GREEN = '#006747';
export const SUNDRIDGE_GREEN_TINT_07 = 'rgba(0,103,71,0.07)';
export const SUNDRIDGE_GREEN_BORDER_18 = 'rgba(0,103,71,0.18)';

// Presence
export const STATUS_ONLINE = '#22c55e';

// Hairlines / borders
export const HAIRLINE_INK_6 = 'rgba(15,23,42,0.06)';
export const HAIRLINE_INK_7 = 'rgba(15,23,42,0.07)';
export const HAIRLINE_INK_8 = 'rgba(15,23,42,0.08)';
export const HAIRLINE_INK_10 = 'rgba(15,23,42,0.10)';
export const INK_TINT_05 = 'rgba(15,23,42,0.05)';
export const INK_TINT_04 = 'rgba(15,23,42,0.04)';

// Destructive
export const DESTRUCTIVE = '#DC2626';
