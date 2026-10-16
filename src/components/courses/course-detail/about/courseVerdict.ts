/**
 * BRIEF_COURSE_TAB_1A — every derived figure on the Course tab's verdict and
 * "How it defends par" sections, from ONE input: get_course_hole_analysis.
 *
 * F2/F3: the hardest and the let-off hole are the highest and lowest
 * avg_to_par here, full stop. get_course_stats_detail's hardest_hole_* columns
 * come from a different population and are NEVER read on this tab.
 * D3: each nine is the SUM of its holes' averages. Each hole's average rests on
 * whoever played that hole, so a nine is a statement about those holes, never
 * a round score.
 * P2.3 / 1B B1: the outcome bands are rounds-weighted counts rebuilt from the
 * per-hole percentages — see the comment at the aggregation.
 */
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';

export interface ParTypeSummary {
  par: number;
  holes: number;
  /** Mean avg_to_par per hole of this par. */
  perHole: number;
  /** Sum of avg_to_par across these holes: the shots they cost a card. */
  shots: number;
}

export interface OutcomeCounts {
  birdie: number;
  par: number;
  bogey: number;
  double: number;
  total: number;
}

export interface CourseVerdict {
  holes: CourseHole[];
  hardest: CourseHole;
  easiest: CourseHole;
  front: number | null;
  back: number | null;
  /** Sum of every hole's avg_to_par — the hole analysis's own total. */
  totalShots: number;
  parTypes: ParTypeSummary[];
  /** The par type with the highest per-hole average. */
  defender: ParTypeSummary | null;
  outcomes: OutcomeCounts | null;
}

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export function deriveCourseVerdict(raw: CourseHole[] | null | undefined): CourseVerdict | null {
  const holes = [...(raw ?? [])]
    .filter((h) => finite(h.avg_to_par))
    .sort((a, b) => a.hole_no - b.hole_no);
  if (holes.length === 0) return null;

  const hardest = holes.reduce((m, h) => (h.avg_to_par > m.avg_to_par ? h : m), holes[0]);
  const easiest = holes.reduce((m, h) => (h.avg_to_par < m.avg_to_par ? h : m), holes[0]);

  const nine = (from: number, to: number) => {
    const set = holes.filter((h) => h.hole_no >= from && h.hole_no <= to);
    return set.length === 9 ? set.reduce((s, h) => s + h.avg_to_par, 0) : null;
  };

  const byPar = new Map<number, CourseHole[]>();
  holes.forEach((h) => {
    if (!finite(h.par)) return;
    const list = byPar.get(h.par) ?? [];
    list.push(h);
    byPar.set(h.par, list);
  });
  const parTypes: ParTypeSummary[] = [...byPar.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([par, list]) => {
      const shots = list.reduce((s, h) => s + h.avg_to_par, 0);
      return { par, holes: list.length, shots, perHole: shots / list.length };
    });
  const defender = parTypes.reduce<ParTypeSummary | null>(
    (m, p) => (m == null || p.perHole > m.perHole ? p : m),
    null,
  );

  /* BRIEF_COURSE_TAB_1B B1: every dist value is a PER-HOLE PERCENTAGE with
     that hole's own rounds as denominator. Reconstruct each band's count as
     pct * rounds / 100 per hole, sum per band, and take the total from the four
     band totals (not the sum of rounds — the source pcts are rounded). Each
     band has its own numerator; none is ever 100 minus the others. Birdie-or-
     better = ace + albatross + eagle + birdie, disjoint in the function. */
  const n = (v: unknown) => (finite(v) ? v : 0);
  const o = holes.reduce(
    (acc, h) => {
      const d = h.dist ?? ({} as CourseHole['dist']);
      const w = n(h.rounds) / 100;
      acc.birdie += (n(d.ace) + n(d.albatross) + n(d.eagle) + n(d.birdie)) * w;
      acc.par += n(d.par) * w;
      acc.bogey += n(d.bogey) * w;
      acc.double += n(d.double) * w;
      return acc;
    },
    { birdie: 0, par: 0, bogey: 0, double: 0 },
  );
  const total = o.birdie + o.par + o.bogey + o.double;

  return {
    holes,
    hardest,
    easiest,
    front: nine(1, 9),
    back: nine(10, 18),
    totalShots: holes.reduce((s, h) => s + h.avg_to_par, 0),
    parTypes,
    defender,
    outcomes: total > 0 ? { ...o, total } : null,
  };
}

/** Rounded share of a count in a total, 0–100. */
export const sharePct = (count: number, total: number) =>
  total > 0 ? Math.round((count / total) * 100) : 0;

const WORDS = [
  'no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen',
  'eighteen', 'nineteen', 'twenty',
];

/** "eleven" for 11; numerals above twenty. */
export function shotsInWords(n: number): string {
  const r = Math.round(n);
  return r >= 0 && r < WORDS.length ? WORDS[r] : String(r);
}

/** Signed one-decimal to-par: "+11.2", "−0.4", "0.0". True minus. */
export function signed(v: number, digits = 1): string {
  const r = Number(v.toFixed(digits));
  if (r > 0) return `+${r.toFixed(digits)}`;
  if (r < 0) return `\u2212${Math.abs(r).toFixed(digits)}`;
  return (0).toFixed(digits);
}
