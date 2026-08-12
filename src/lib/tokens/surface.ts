/**
 * SURFACE INK RAMPS (BRIEF_SURFACE_TOKENS_DECISION_AND_DISCOVER_PAGE, Part A).
 *
 * One place to read ink from, keyed by the surface a thing renders on. These
 * are RECORDS of shipped values - nothing here is a new colour.
 *
 * THREE TIERS ON DARK, FOUR ON LIGHT. That asymmetry is a property of the
 * system, not an omission: PostRoundCard, PostCourseBand, the admin theme
 * (ink / inkMuted / inkFaint) and handicap-dark.css (--hcp-t-100 / -60 / -40)
 * all carry three. `body` is therefore OPTIONAL. When a dark surface genuinely
 * needs a fourth tier that is a design decision at that moment, not a value
 * backfilled for symmetry.
 *
 * WHY THE DARK RAMP IS PostCourseBand's #F8FAFC FAMILY: PostCourseBand tones
 * its alpha ramps to the SAME BASE as its ink. PostRoundCard mixes a tinted
 * ink (#F4F7F9) with pure-white alphas - an incoherent construction that only
 * looks right because the tint is slight. One base, one family.
 *
 * PostRoundCard and PostCourseBand keep their LOCAL ramps until a brief with
 * its own regression pass. Do not migrate them here.
 */

export interface InkRamp {
  /** Primary ink: headlines, figures, anything that must read first. */
  ink: string;
  /** Running prose / detail lines. LIGHT ONLY - dark surfaces have three tiers. */
  body?: string;
  /** Supporting text, labels, secondary values. */
  mute: string;
  /** Quietest legible tier: timestamps, units, disabled. */
  dim: string;
  /** The only rule permitted inside a panel. */
  hairline: string;
}

/** Light member surfaces. Sourced from analytical/tokens `A`. Four tiers. */
const light: InkRamp = {
  ink: '#0E1216',
  body: '#3A424C',
  mute: '#68707B',
  dim: '#A2A9B2',
  hairline: 'rgba(14,18,22,0.08)',
};

/** Dark member surfaces. Sourced from PostCourseBand. Three tiers. */
const dark: InkRamp = {
  ink: '#F8FAFC',
  mute: 'rgba(248,250,252,0.62)',
  dim: 'rgba(248,250,252,0.42)',
  hairline: 'rgba(255,255,255,0.10)',
};

/** Admin console. Sourced from features/admin/theme.ts (adminDark). Three tiers. */
const admin: InkRamp = {
  ink: '#E9EDF3',
  mute: '#B3BCC9',
  dim: '#7B8697',
  hairline: 'rgba(255,255,255,0.065)',
};

export const SURFACE = { light, dark, admin } as const;

export type SurfaceName = keyof typeof SURFACE;
