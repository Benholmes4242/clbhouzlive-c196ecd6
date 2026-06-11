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
  yards: number | null;
}

/** Categories the band may appear on (base names; window applied by caller). */
export const PRO_BAND_BASES = [
  'lowest_gross',
  'most_birdies',
  'most_eagles',
] as const;
export type ProBandBase = (typeof PRO_BAND_BASES)[number];

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

const TOUR_YARDS = 7200;

/** Extra strokes of edge from course shortness: 1 stroke per 450 yards under
 *  tour length, capped at 2.5. Null/short data → 0 (current behaviour). */
export function lengthBonus(courseYards: number | null): number {
  if (courseYards == null || courseYards < 4000) return 0;
  return clamp((TOUR_YARDS - courseYards) / 450, 0, 2.5);
}

/** Predicted single-round gross. Clamped to sane bounds so bad data can't print a 51. */
export function estGross(pro: ProProfile, c: Required<CourseInputs>): number {
  const raw = Math.round(
    c.cr - ((pro.tour_cr_baseline - pro.scoring_avg) + lengthBonus(c.yards)),
  );
  return clamp(raw, c.par - 9, Math.round(pro.scoring_avg) + 5);
}


/** Cumulative totals scaled over the VIEWER's rounds at this course. */
export function estBirdiesTotal(
  pro: ProProfile,
  c: Required<CourseInputs>,
  viewerRounds: number,
): number {
  const effEase = (pro.tour_cr_baseline - c.cr) + lengthBonus(c.yards);
  return Math.round((pro.birdies_per_round + effEase / 6) * viewerRounds);
}
export function estEaglesTotal(
  pro: ProProfile,
  c: Required<CourseInputs>,
  viewerRounds: number,
): number {
  const effEase = (pro.tour_cr_baseline - c.cr) + lengthBonus(c.yards);
  return Math.max(
    0,
    Math.round(pro.eagles_per_round * (1 + effEase / 12) * viewerRounds),
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
  /** Per-visit rotation counter; when provided, supersedes the date-hash seed. */
  visitN?: number | null;
  courseName: string;
}): ProBenchmarkPick | null {
  const { pros, courseId, course, viewerRounds, recordGross, visitN, courseName } = args;
  if (!pros.length) return null;
  if (course.cr == null || course.slope == null || course.par == null || course.slope <= 0) {
    return null;
  }
  const c = course as Required<CourseInputs>;

  const allBases = [...PRO_BAND_BASES];
  const bases = args.eligibleBases.filter((b) =>
    b === 'most_birdies' || b === 'most_eagles' ? (viewerRounds ?? 0) >= 1 : true,
  );
  if (!bases.length) return null;

  let proIdx: number;
  let baseIdx: number;
  if (typeof visitN === 'number' && Number.isFinite(visitN)) {
    const n = ((visitN % 1_000_000) + 1_000_000) % 1_000_000;
    proIdx = n % pros.length;
    // Lockstep-breaker: if pros.length and allBases.length share a factor,
    // this still advances both indices independently across visits.
    baseIdx = (n + Math.floor(n / allBases.length)) % allBases.length;
  } else {
    const ymd = args.dateUtcYmd ?? new Date().toISOString().slice(0, 10);
    const h = rotationHash(courseId, ymd);
    proIdx = h % pros.length;
    baseIdx = (h >>> 3) % allBases.length;
  }

  const pro = pros[proIdx];
  // Walk the full base list from baseIdx until we hit an eligible base.
  let base: ProBandBase = bases[0];
  for (let i = 0; i < allBases.length; i++) {
    const candidate = allBases[(baseIdx + i) % allBases.length];
    if (bases.includes(candidate)) {
      base = candidate;
      break;
    }
  }
  const first = pro.full_name.split(' ')[0];

  switch (base) {
    case 'lowest_gross': {
      const g = estGross(pro, c);
      return {
        pro,
        base,
        value: String(g),
        sub: `Predicted round at ${courseName}`,
        chaseLine:
          recordGross != null && recordGross > g
            ? `The course record is ${recordGross - g} shy of ${first}'s predicted ${g}`
            : undefined,
      };
    }
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
