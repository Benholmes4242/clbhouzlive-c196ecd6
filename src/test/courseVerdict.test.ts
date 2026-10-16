import { describe, it, expect } from 'vitest';
import { deriveCourseVerdict, sharePct } from '@/components/courses/course-detail/about/courseVerdict';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';

const hole = (n: number, par: number, avg: number, d: Partial<CourseHole['dist']> = {}): CourseHole => ({
  hole_no: n, par, yards: null, stroke_index: null, rounds: 10, avg_to_par: avg, avg_gross: par + avg,
  dist: { ace: 0, albatross: 0, eagle: 0, birdie: 1, par: 5, bogey: 3, double: 1, ...d },
});
const pars = [4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 3, 4, 4, 5, 4, 3, 4, 4];
const card = pars.map((p, i) => hole(i + 1, p, 0.5));
card[17] = hole(18, 4, 1.1);
card[10] = hole(11, 3, 0.1);

describe('BRIEF_COURSE_TAB_1A course verdict', () => {
  it('hardest and let-off are the highest and lowest hole averages', () => {
    const v = deriveCourseVerdict(card)!;
    expect(v.hardest.hole_no).toBe(18);
    expect(v.easiest.hole_no).toBe(11);
  });
  it('each nine is the sum of its nine hole averages', () => {
    const v = deriveCourseVerdict(card)!;
    expect(v.front).toBeCloseTo(4.5);
    expect(v.back).toBeCloseTo(0.5 * 7 + 1.1 + 0.1);
  });
  it('a nine with missing holes is absent, not partial', () => {
    expect(deriveCourseVerdict(card.slice(0, 17))!.back).toBeNull();
  });
  it('outcome bands are rounds-weighted from per-hole percentages, each from its own numerator', () => {
    // Hole 1: 100 rounds, all par. Hole 2: 10 rounds, all bogey.
    // Unweighted average would say 50% par / 50% bogey; weighted is 100/110 par.
    const a = { ...hole(1, 4, 0), rounds: 100, dist: { ace: 0, albatross: 0, eagle: 0, birdie: 0, par: 100, bogey: 0, double: 0 } };
    const b = { ...hole(2, 4, 1), rounds: 10, dist: { ace: 0, albatross: 0, eagle: 0, birdie: 0, par: 0, bogey: 100, double: 0 } };
    const o = deriveCourseVerdict([a, b])!.outcomes!;
    expect(o.par).toBeCloseTo(100);
    expect(o.bogey).toBeCloseTo(10);
    expect(o.birdie).toBe(0);
    expect(o.double).toBe(0);
    expect(o.total).toBeCloseTo(o.birdie + o.par + o.bogey + o.double);
    expect(sharePct(o.par, o.total)).toBe(91);
    expect(sharePct(o.bogey, o.total)).toBe(9);
  });
  it('birdie-or-better adds ace, albatross, eagle and birdie', () => {
    const h = { ...hole(1, 5, 0), rounds: 50, dist: { ace: 2, albatross: 4, eagle: 10, birdie: 20, par: 40, bogey: 20, double: 4 } };
    const o = deriveCourseVerdict([h])!.outcomes!;
    expect(o.birdie).toBeCloseTo(18);
    expect(o.par).toBeCloseTo(20);
  });
  it('no holes means no verdict', () => {
    expect(deriveCourseVerdict([])).toBeNull();
  });
});
