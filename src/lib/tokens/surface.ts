/**
 * SURFACE INK RAMPS (BRIEF_SURFACE_TOKENS_DECISION_AND_DISCOVER_PAGE, Part A).
 *
 * One place to read ink from, keyed by the surface a thing renders on. These
 * are RECORDS of shipped values - nothing here is a new colour.
 *
 * Dark-only uses four tiers so analytical body copy retains its legibility
 * floor while supporting text and quiet metadata remain distinct.
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
  /** Running prose / detail lines. */
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

/** Dark member surfaces. Sourced from PostCourseBand, plus the 72% body tier. */
const dark: InkRamp = {
  ink: '#F8FAFC',
  body: 'rgba(248,250,252,0.72)',
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
