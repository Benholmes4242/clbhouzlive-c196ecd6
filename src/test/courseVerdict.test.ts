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
  it('outcome bands are summed counts that partition the whole', () => {
    const o = deriveCourseVerdict(card)!.outcomes!;
    expect([o.birdie, o.par, o.bogey, o.double]).toEqual([18, 90, 54, 18]);
    expect(o.total).toBe(180);
    expect(sharePct(o.par, o.total)).toBe(50);
  });
  it('no holes means no verdict', () => {
    expect(deriveCourseVerdict([])).toBeNull();
  });
});
