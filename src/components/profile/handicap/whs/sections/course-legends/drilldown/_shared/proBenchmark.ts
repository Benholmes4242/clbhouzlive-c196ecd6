export interface ProProfile {
  slug: string;
  full_name: string;
  initials: string;
  tour_code: string;
  scoring_avg: number;
  birdies_per_round: number;
  eagles_per_round: number;
  tour_cr_baseline: number;
}

export interface CourseInputs {
  cr: number | null;
  slope: number | null;
  par: number | null;
}

/** Categories the band may appear on (base names; window applied by caller). */
export const PRO_BAND_BASES = [
  'lowest_gross',
  'most_birdies',
  'most_eagles',
] as const;
export type ProBandBase = (typeof PRO_BAND_BASES)[number];

const damp = (slope: number) => 113 / slope;
const ease = (pro: ProProfile, cr: number, slope: number) =>
  (pro.tour_cr_baseline - cr) * damp(slope);

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Predicted single-round gross. Clamped to sane bounds so bad data can't print a 51. */
export function estGross(pro: ProProfile, c: Required<CourseInputs>): number {
  const raw = Math.round(pro.scoring_avg - ease(pro, c.cr, c.slope));
  return clamp(raw, c.par - 9, Math.round(pro.scoring_avg) + 5);
}

/** Predicted Stableford off scratch. */
export function estStableford(pro: ProProfile, c: Required<CourseInputs>): number {
  return clamp(36 + (c.par - estGross(pro, c)), 30, 50);
}

/** Cumulative totals scaled over the VIEWER's rounds at this course. */
export function estBirdiesTotal(
  pro: ProProfile,
  c: Required<CourseInputs>,
  viewerRounds: number,
): number {
  return Math.round((pro.birdies_per_round + ease(pro, c.cr, c.slope) / 6) * viewerRounds);
}
export function estEaglesTotal(
  pro: ProProfile,
  c: Required<CourseInputs>,
  viewerRounds: number,
): number {
  return Math.max(
    0,
    Math.round(pro.eagles_per_round * (1 + ease(pro, c.cr, c.slope) / 12) * viewerRounds),
  );
}

/** Deterministic daily seed: same course + same UTC day = same pick for everyone. */
export function rotationHash(courseId: string, dateUtcYmd: string): number {
  const s = `${courseId}:${dateUtcYmd}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface ProBenchmarkPick {
  pro: ProProfile;
  base: ProBandBase;
  value: string;
  sub: string;
  chaseLine?: string;
}

/**
 * The single decision function. Returns null whenever the band shouldn't show.
 * eligibleBases = bases whose ALL-TIME category has at least one row on this page.
 */
export function pickProBenchmark(args: {
  pros: ProProfile[];
  courseId: string;
  course: CourseInputs;
  viewerRounds: number | null;
  eligibleBases: ProBandBase[];
  recordGross?: number | null;
  dateUtcYmd?: string;
}): ProBenchmarkPick | null {
  const { pros, courseId, course, viewerRounds, recordGross } = args;
  if (!pros.length) return null;
  if (course.cr == null || course.slope == null || course.par == null || course.slope <= 0) {
    return null;
  }
  const c = course as Required<CourseInputs>;

  const bases = args.eligibleBases.filter((b) =>
    b === 'most_birdies' || b === 'most_eagles' ? (viewerRounds ?? 0) >= 1 : true,
  );
  if (!bases.length) return null;

  const ymd = args.dateUtcYmd ?? new Date().toISOString().slice(0, 10);
  const h = rotationHash(courseId, ymd);
  const pro = pros[h % pros.length];
  const base = bases[(h >>> 3) % bases.length];
  const first = pro.full_name.split(' ')[0];

  switch (base) {
    case 'lowest_gross': {
      const g = estGross(pro, c);
      return {
        pro,
        base,
        value: String(g),
        sub: `Predicted round here · CR ${c.cr}, slope ${c.slope}`,
        chaseLine:
          recordGross != null && recordGross > g
            ? `The course record is ${recordGross - g} shy of ${first}'s ${g}`
            : undefined,
      };
    }
    case 'best_stableford':
      return {
        pro,
        base,
        value: `${estStableford(pro, c)} pts`,
        sub: 'Predicted stableford here, off scratch',
      };
    case 'most_birdies': {
      const n = estBirdiesTotal(pro, c, viewerRounds!);
      return {
        pro,
        base,
        value: String(n),
        sub: `If ${first} played your ${viewerRounds} rounds here`,
      };
    }
    case 'most_eagles': {
      const n = estEaglesTotal(pro, c, viewerRounds!);
      return {
        pro,
        base,
        value: String(n),
        sub: `If ${first} played your ${viewerRounds} rounds here`,
      };
    }
  }
}
