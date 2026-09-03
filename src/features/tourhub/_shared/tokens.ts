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
 * SURFACE ORIENTATION: DARK. As of BRIEF_TOUR_SURFACES_DARK_MIGRATION Part B,
 * INK_*, SLATE_* and SURFACE are the DARK-surface ramp: INK_* is near-white text
 * on a dark ground, SLATE_* are dark neutrals, SURFACE is a raised dark card.
 * THE NAMES ARE HISTORICAL AND DELIBERATELY NOT RENAMED HERE — 78 importers.
 * Read the value, not the name. The alphas in this file are one step STRONGER
 * than their former light counterparts: 8% ink on white and 8% white on #15171F
 * are not the same separation, and mirroring them is what made bogey grounds
 * invisible on four surfaces.
 *
 * Naming convention:
 * - INK_*       → text colour on DARK surfaces (primary / secondary / mute / faint / light)
 * - SLATE_*     → background-adjacent neutrals on DARK surfaces (50/150/200/etc., names Tailwind-scale, values not)
 * - HAIRLINE_*  → divider colours / borders (solid or ink-alpha variants)
 * - AMBER_*     → brand amber (text, tints, borders, soft bgs)
 * - GOLD_*      → celebratory / winner / trophy moments (more saturated than amber)
 * - SCORE_*_DARK / SCORE_*_LIGHT → verdict colours for score displays, theme-aware
 * - STATUS_*    → status indicators (live pulse, etc.)
 * - NAVY_*      → dark theatrical gradients (event card tour-stripe ends)
 * - FONT        → canonical font stack (was 5 different stacks before)
 */

// ============================================================================
// INK (text on DARK surface — names historical)
// ============================================================================
export const INK = '#F8FAFC';
export const INK_DEEP = '#0A0E14';   // app dark-chrome / active-tab underline ink
export const INK_SOFT = 'rgba(248,250,252,0.72)';
export const INK_MUTE = 'rgba(248,250,252,0.62)';
export const INK_FAINT = 'rgba(248,250,252,0.42)';
export const INK_LIGHT = 'rgba(248,250,252,0.28)';

// ============================================================================
// SURFACE (background fills for cards on DARK theme — raised panel)
// ============================================================================
export const SURFACE = '#1B1E27';

// ============================================================================
// SLATE (neutrals on DARK surface)
// ============================================================================
// NOTE: shares a value with CHARCOAL and with the app canvas. Different reasons:
// this is the quietest neutral in the tour ramp and will move again when the ramp
// is renamed. Do not merge on the strength of the value.
export const SLATE_50 = '#15171F';
export const SLATE_100 = 'rgba(255,255,255,0.06)';           // segmented-control trough, photo bg — 7 cross-app files
export const SLATE_150 = 'rgba(255,255,255,0.08)';
export const SLATE_200 = 'rgba(255,255,255,0.10)';
export const SLATE_600 = '#475569';                          // Tailwind slate-600 — used as fallback bg/stripe when no brand color is available (22 files)
export const SLATE_700 = '#334155';                          // Tailwind slate-700 — avatar fallback gradient endpoint, 6 cross-app files
export const SLATE_800 = '#1e293b';                          // Tailwind slate-800 — avatar fallback gradient endpoint, 8 cross-app files

// ============================================================================
// HAIRLINE (divider variants — white-alpha, ONE STEP STRONGER than the light values)
// ============================================================================
export const HAIRLINE_INK_7 = 'rgba(255,255,255,0.10)';
export const HAIRLINE_INK_8 = 'rgba(255,255,255,0.12)';         // hairline/faint bg fill — 15 cross-app files
export const HAIRLINE_INK_10 = 'rgba(255,255,255,0.14)';
export const HAIRLINE_INK_12 = 'rgba(255,255,255,0.18)';        // cut-line / section divider hairline — 7 cross-app files
export const HAIRLINE_INK_15 = 'rgba(255,255,255,0.22)';        // section divider on DARK bg, stronger emphasis (value is white-alpha post-flip)
export const HAIRLINE_INK_18 = 'rgba(255,255,255,0.28)';        // hairline at strongest emphasis — TIED-state bar bg, faint row-number digits — 4 cross-app files

// ============================================================================
// INK_ALPHA (alpha-muted text on DARK bg — names historical)
// ============================================================================
// Used primarily by hero PhotoBand for legibility scrims and ink-alpha caption text.
// Distinct from INK_* which are solid Tailwind slate values.
export const INK_ALPHA_45 = 'rgba(248,250,252,0.42)';        // medium alpha (caption / tertiary on dark)
export const INK_ALPHA_60 = 'rgba(248,250,252,0.62)';        // quiet floor (subhead-equivalent on dark)

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
// INK TINTS (faint backgrounds + borders on DARK bg — one step stronger than the light values)
// ============================================================================
// Cross-app frequency (pre-Phase 6):
//   _07: 47 files (borders) | _06: 30 files (placeholder bgs)
// Use for: faint placeholder backgrounds, hairline borders on DARK surfaces.
// Phase 10 will sweep all cross-app sites.
export const INK_TINT_02 = 'rgba(255,255,255,0.03)';            // ultra-faint ink tint — column-header strip bg — 11 cross-app files
export const INK_TINT_04 = 'rgba(255,255,255,0.05)';            // very-faint ink tint — logo-tile bg, mini-header bg — 9 cross-app files
export const INK_TINT_05 = 'rgba(255,255,255,0.06)';            // ultra-faint inline pill/skeleton bg — 11 cross-app files
export const INK_TINT_06 = 'rgba(255,255,255,0.08)';            // faint white-alpha bg (name historical) — placeholder containers, faint surfaces
export const INK_TINT_07 = 'rgba(255,255,255,0.10)';            // faint white-alpha border — hairline dividers on DARK bg (name historical)

// ============================================================================
// AMBER (brand)
// ============================================================================
export const AMBER = '#F7931E';
export const AMBER_INK = '#D97706';
// identity/status amber (WIN tone, isWin) — NOT for eyebrows. On dark, eyebrows
// take the dark MUTE rgba(255,255,255,0.62), NOT INK: INK is now near-white and
// would collide with the figures. AMBER_DEEP is never repointed — it does
// identity work at FormSection:89 and TournamentsSection:200.
export const AMBER_DEEP = '#C2620A';
export const AMBER_TINT_08 = 'rgba(247,147,30,0.08)';        // faint amber selection/tint (canonical zero-padded name)
export const AMBER_TINT_10 = 'rgba(247,147,30,0.10)';
export const AMBER_TINT_04 = 'rgba(247,147,30,0.04)';        // very faint amber — selection state bg, 8 cross-app files
export const AMBER_TINT_12 = 'rgba(247,147,30,0.12)';        // VS divider bg, pill treatment — 6 cross-app files
export const AMBER_BORDER = 'rgba(247,147,30,0.30)';
export const AMBER_SOFT_BG = 'rgba(247,147,30,0.12)';

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
// TO-PAR (verdict — under/over par; theme-aware)
// ============================================================================
// Canonical: RED under par (good), INK/muted-white over par, muted gray even.
// Aligned with the World Feed hole-by-hole birdie family so red-good is one
// red across every golf surface (leaderboard, hero, schedule, player history,
// college, TI). All prior SCORE_* tokens have been removed in favour of these.
export const TOPAR_UNDER_LIGHT = '#D2222D';
// One bright red for under par on every dark surface. This consolidates the
// former #DC2626 canonical token, #FF6B5E scorecard birdie, #FF5D5D glass
// override and duplicate #FF6B60 trajectory/analytical declarations.
export const TOPAR_UNDER_DARK  = '#FF6B60';
export const TOPAR_OVER_LIGHT  = '#0F172A';                  // the FORMER INK value, pinned: the light path's over-par ink. HOLD — INK is now near-white.
export const TOPAR_OVER_DARK   = 'rgba(242,244,247,0.62)';
export const TOPAR_EVEN_LIGHT  = '#8A9099';
export const TOPAR_EVEN_DARK   = 'rgba(242,244,247,0.42)';




// ============================================================================
// STATUS (live indicator dot — NOT a verdict)
// ============================================================================
export const STATUS_LIVE = '#10B981';
export const STATUS_LIVE_ON_DARK = '#5EE9A6';                 // live green that reads on dark hero gradients (STATUS_LIVE is too dark there)
export const LIVE_INK = '#34D77F';                           // readable LIVE green text on DARK bg — counterpart to STATUS_LIVE — 7 cross-app files
export const STATUS_LIVE_TINT_10 = 'rgba(16,185,129,0.10)';  // LIVE pill faint green fill — 3 cross-app sites
export const STATUS_LIVE_BORDER = 'rgba(16,185,129,0.32)';   // LIVE pill border — 2 cross-app sites
export const LIVE_DOT = '#22C55E';                            // bright pulse-dot green (green-500) — animated LIVE indicators — 7 cross-app files
export const STATUS_NEGATIVE = '#C24A4A';                     // cancelled/warning — distinct from TOPAR_UNDER red (good) and from live green


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
// CHARCOAL (shared Clubhouse / player hero / live-card surface)
// ============================================================================
// NOTE: shares a value with SLATE_50 and the app canvas. Different reasons: this
// is a named product surface — Clubhouse feed, player hero gradient end, live-now
// card — not a ramp step. Do not merge on the strength of the value.
export const CHARCOAL = '#15171F';

// ============================================================================
// TYPOGRAPHY
// ============================================================================
export const FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

// ============================================================================
// BAR (proportional tug/track fills on DARK surfaces)
// ============================================================================
export const BAR_NEUTRAL = 'rgba(255,255,255,0.18)';                        // losing / non-winning half of a head-to-head tug bar

// ============================================================================
// HERO HEIGHT (canonical, every tour surface EXCEPT the tour overview hero)
// ============================================================================
/**
 * Canonical hero height for every tour surface EXCEPT the tour overview hero,
 * which is deliberately taller (cinematic carousel, signed off separately at
 * clamp(380px, 44dvh, 460px) — see overview-v3/OverviewHero + CinematicHeroFullBleed).
 * The Tour Overview photo band is the same 244px; its 36px wire ticker brings the
 * full carousel container to 280px.
 * Source of truth: the course detail hero, src/components/golf-club/GolfClubView.tsx.
 */
export const HERO_MIN_H =
  'calc(clamp(244px, 30dvh, 390px) + env(safe-area-inset-top, 0px))';
