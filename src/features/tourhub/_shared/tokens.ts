/**
 * Tour Hub design tokens — single source of truth.
 *
 * All Tour Hub Overview / Schedule / Players / Leaders / College sections
 * import their colour, ink, hairline, and font tokens from here. The same
 * token names + values were previously redeclared across 5+ section files
 * with three silent collisions (SLATE_200, HAIRLINE, AMBER_SOFT meaning
 * different things in different files). This file resolves those collisions
 * and gives Phase 2B+ a single place to evolve the system.
 *
 * Naming convention:
 * - INK_*       → text colour on light surfaces (primary / secondary / mute / faint / light)
 * - SLATE_*     → background-adjacent neutrals on light surfaces (50/150/200/etc., Tailwind-scale)
 * - HAIRLINE_*  → divider colours / borders (solid or ink-alpha variants)
 * - AMBER_*     → brand amber (text, tints, borders, soft bgs)
 * - GOLD_*      → celebratory / winner / trophy moments (more saturated than amber)
 * - SCORE_*_DARK / SCORE_*_LIGHT → verdict colours for score displays, theme-aware
 * - STATUS_*    → status indicators (live pulse, etc.)
 * - NAVY_*      → dark theatrical gradients (event card tour-stripe ends)
 * - FONT        → canonical font stack (was 5 different stacks before)
 */

// ============================================================================
// INK (text on light surface)
// ============================================================================
export const INK = '#0F172A';
export const INK_DEEP = '#0A0E14';   // app dark-chrome / active-tab underline ink
export const INK_SOFT = '#475569';
export const INK_MUTE = '#64748B';
export const INK_FAINT = '#94A3B8';
export const INK_LIGHT = '#CBD5E1';

// ============================================================================
// SURFACE (background fills for cards on light theme)
// ============================================================================
export const SURFACE = '#FFFFFF';

// ============================================================================
// SLATE (neutrals on light surface)
// ============================================================================
export const SLATE_50 = '#F8FAFC';
export const SLATE_100 = '#F1F5F9';                          // slate-100 — segmented-control trough, photo bg — 7 cross-app files
export const SLATE_150 = '#EDF1F5';
export const SLATE_200 = '#E2E8F0';
export const SLATE_600 = '#475569';                          // Tailwind slate-600 — used as fallback bg/stripe when no brand color is available (22 files)
export const SLATE_700 = '#334155';                          // Tailwind slate-700 — avatar fallback gradient endpoint, 6 cross-app files
export const SLATE_800 = '#1e293b';                          // Tailwind slate-800 — avatar fallback gradient endpoint, 8 cross-app files

// ============================================================================
// HAIRLINE (divider variants)
// ============================================================================
export const HAIRLINE_INK_7 = 'rgba(15,23,42,0.07)';
export const HAIRLINE_INK_8 = 'rgba(15,23,42,0.08)';         // hairline/faint bg fill — 15 cross-app files
export const HAIRLINE_INK_10 = 'rgba(15,23,42,0.10)';
export const HAIRLINE_INK_12 = 'rgba(15,23,42,0.12)';        // cut-line / section divider hairline — 7 cross-app files
export const HAIRLINE_INK_15 = 'rgba(15,23,42,0.15)';        // section divider on light bg with stronger emphasis
export const HAIRLINE_INK_18 = 'rgba(15,23,42,0.18)';        // hairline at strongest emphasis — TIED-state bar bg, faint row-number digits — 4 cross-app files

// ============================================================================
// INK_ALPHA (text/scrim overlays on light bg where alpha-based muting is needed)
// ============================================================================
// Used primarily by hero PhotoBand for legibility scrims and ink-alpha caption text.
// Distinct from INK_* which are solid Tailwind slate values.
export const INK_ALPHA_45 = 'rgba(15,23,42,0.45)';           // medium ink-alpha (caption / secondary on light)
export const INK_ALPHA_60 = 'rgba(15,23,42,0.60)';           // heavier ink-alpha (subhead-equivalent on light)

// ============================================================================
// WHITE ALPHAS (text + borders on dark bg — parallel to INK_ALPHA family)
// ============================================================================
// Cross-app frequency (pre-Phase 5):
//   _55: 16 files | _06: 16 files | _10: 11 files | _65: 7 files | _04: 6 files
//   _12: 4 files  | _18: 4 files  | _30: 3 files
// Use for: text colors on dark/photo bg, hairline borders, image placeholders,
// glass overlays, separator dots. Phase 10 will sweep all cross-app sites.
export const WHITE_ALPHA_04 = 'rgba(255,255,255,0.04)';      // image placeholder bg
export const WHITE_ALPHA_06 = 'rgba(255,255,255,0.06)';      // very faint divider/border on dark bg — 16 cross-app files
export const WHITE_ALPHA_08 = 'rgba(255,255,255,0.08)';      // faint border on dark bg — 8 cross-app files
export const WHITE_ALPHA_10 = 'rgba(255,255,255,0.10)';      // hairline border on dark bg
export const WHITE_ALPHA_12 = 'rgba(255,255,255,0.12)';      // glass overlay border
export const WHITE_ALPHA_18 = 'rgba(255,255,255,0.18)';      // inactive pill border on dark bg — 4 cross-app files
export const WHITE_ALPHA_30 = 'rgba(255,255,255,0.30)';      // separator dots, fine details
export const WHITE_ALPHA_55 = 'rgba(255,255,255,0.55)';      // tertiary/disabled text on dark bg
export const WHITE_ALPHA_65 = 'rgba(255,255,255,0.65)';      // secondary text on dark bg


// ============================================================================
// INK TINTS (faint backgrounds + borders on light bg — parallel to WHITE_ALPHA)
// ============================================================================
// Cross-app frequency (pre-Phase 6):
//   _07: 47 files (borders) | _06: 30 files (placeholder bgs)
// Use for: faint placeholder backgrounds, hairline borders on light surfaces.
// Phase 10 will sweep all cross-app sites.
export const INK_TINT_02 = 'rgba(15,23,42,0.02)';            // ultra-faint ink tint — column-header strip bg — 11 cross-app files
export const INK_TINT_04 = 'rgba(15,23,42,0.04)';            // very-faint ink tint — logo-tile bg, mini-header bg — 9 cross-app files
export const INK_TINT_05 = 'rgba(15,23,42,0.05)';            // ultra-faint inline pill/skeleton bg — 11 cross-app files
export const INK_TINT_06 = 'rgba(15,23,42,0.06)';            // light slate bg — placeholder containers, faint surfaces
export const INK_TINT_07 = 'rgba(15,23,42,0.07)';            // light slate border — hairline dividers on light bg

// ============================================================================
// AMBER (brand)
// ============================================================================
export const AMBER = '#F7931E';
export const AMBER_INK = '#D97706';
export const AMBER_TINT_08 = 'rgba(247,147,30,0.08)';        // faint amber selection/tint (canonical zero-padded name)
export const AMBER_TINT_10 = 'rgba(247,147,30,0.10)';
export const AMBER_TINT_04 = 'rgba(247,147,30,0.04)';        // very faint amber — selection state bg, 8 cross-app files
export const AMBER_TINT_12 = 'rgba(247,147,30,0.12)';        // VS divider bg, pill treatment — 6 cross-app files
export const AMBER_BORDER = 'rgba(247,147,30,0.30)';
export const AMBER_SOFT_BG = '#FEF3E7';

// ============================================================================
// GOLD (celebratory / winner / trophy theatre)
// ============================================================================
export const GOLD = '#FFB800';
export const GOLD_DEEP = '#D97706';
export const GOLD_TINT = 'rgba(255,184,0,0.04)';
export const GOLD_BORDER = 'rgba(255,184,0,0.32)';
export const GOLD_TINT_10 = 'rgba(255,184,0,0.10)';          // medium gold tint — 7 cross-app files (hero card gradients, leader pills)
export const GOLD_GLOW = '0 0 24px rgba(255,184,0,0.10), 0 1px 3px rgba(0,0,0,0.04)';
export const GOLD_GLOW_DROP = '0 4px 12px rgba(255,184,0,0.20)';  // tighter gold drop shadow — champion-treatment photo/logo tiles — 4 cross-app surfaces

// Liquid-glass backdrop blur for photo-overlay pills (hero, masthead).
export const GLASS_BLUR = 'blur(14px) saturate(140%)';

// ============================================================================
// LEADER_GOLD (hero leaderboard #1 row tint — distinct from celebratory GOLD)
// ============================================================================
// More yellow-toned than canonical GOLD (#FFB800). Used specifically for the #1
// leader row tinting in HybridHero — gold-on-dark visual lift without competing
// with finished-event GOLD trophy moments. Reserved for leaderboard row tinting;
// not a general-purpose gold.
export const LEADER_GOLD = '#FBBC2E';                        // hero leader-row tint base
export const LEADER_GOLD_DARK = '#D4A017';                   // text/icon-readable variant
export const LEADER_GOLD_TINT_7 = 'rgba(251,188,46,0.07)';   // soft leader tint (live state)
export const LEADER_GOLD_TINT_10 = 'rgba(251,188,46,0.10)';  // medium leader tint (results state)

// ============================================================================
// SCORE (verdict — under/over par; theme-aware)
// ============================================================================
export const SCORE_UNDER_PAR_LIGHT = '#2F6B4F';            // refined pine (unified scoring palette)
export const SCORE_UNDER_PAR_LIGHT_TINT = 'rgba(47,107,79,0.14)';
export const SCORE_OVER_PAR_LIGHT = '#9F1D1D';
export const SCORE_OVER_PAR_LIGHT_TINT = 'rgba(159,29,29,0.14)';
export const SCORE_UNDER_PAR_DARK = '#4ADE80';
export const SCORE_OVER_PAR_DARK = '#F87171';
// Pale variants for use on heavier-dark backgrounds (e.g. ticker marquee) where
// the standard DARK variants don't lift enough. Tailwind green-300 / red-300.
export const SCORE_UNDER_PAR_DARK_PALE = '#86EFAC';          // Tailwind green-300 — pale under-par on heavy-dark bg
export const SCORE_OVER_PAR_DARK_PALE = '#FCA5A5';           // Tailwind red-300 — pale over-par on heavy-dark bg



// ============================================================================
// STATUS (live indicator dot — NOT a verdict)
// ============================================================================
export const STATUS_LIVE = '#10B981';
export const LIVE_INK = '#047857';                           // readable LIVE green text on light bg (emerald-700) — high-contrast counterpart to STATUS_LIVE — 7 cross-app files
export const STATUS_LIVE_TINT_10 = 'rgba(16,185,129,0.10)';  // LIVE pill faint green fill — 3 cross-app sites
export const STATUS_LIVE_BORDER = 'rgba(16,185,129,0.32)';   // LIVE pill border — 2 cross-app sites
export const LIVE_DOT = '#22C55E';                            // bright pulse-dot green (green-500) — animated LIVE indicators on light bg — 7 cross-app files


// ============================================================================
// TOUR_BRAND (tour-specific brand colours)
// ============================================================================
export const PGA_GREEN = '#006747';

// ============================================================================
// TREND (ranking movement chips — risers / fallers; distinct from SCORE_*)
// ============================================================================
export const TREND_UP = '#16A34A';
export const TREND_UP_TINT = 'rgba(22,163,74,0.10)';
export const TREND_DOWN = '#DC2626';
export const TREND_DOWN_TINT = 'rgba(220,38,38,0.10)';

// ============================================================================
// SEMANTIC ALIASES
// ============================================================================
export const DANGER = '#DC2626';

// ============================================================================
// NAVY (dark theatrical accents)
// ============================================================================
export const NAVY_HIGH = '#15203A';

// ============================================================================
// SHELL CHROME (Tour Hub navigation chrome — darker than INK or NAVY_HIGH)
// ============================================================================
export const SHELL_BG = '#0A0E14';                           // Tour Hub shell/chrome dark bg — 11 cross-app files (5 shell rows + tabs + pages)



// ============================================================================
// TYPOGRAPHY
// ============================================================================
export const FONT =
  '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
