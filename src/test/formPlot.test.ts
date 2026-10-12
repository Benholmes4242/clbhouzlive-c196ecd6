import { describe, it, expect } from 'vitest';
import { barGeometry, plotMetrics, baselineInsets } from '@/features/profile-sheet-v2/components/FormSection';

const BEN = [7.4, -0.3, 3.1, 1.2, 4.5];

describe('BRIEF_FORM_PLOT', () => {
  it('baseline insets equal 14% of a slot on the left, non-zero, at 2/3/5 bars', () => {
    for (const n of [2, 3, 5]) {
      const { left, right } = baselineInsets(n);
      expect(left).toBe('calc(((100% - 32px) / 5) * 0.14)');
      expect(right).toContain('* 0.14');
      expect(right).toContain(`* ${n} + ${8 * (n - 1)}px`);
    }
    expect(baselineInsets(5).right).toBe('calc(100% - (((100% - 32px) / 5) * 5 + 32px) + ((100% - 32px) / 5) * 0.14)');
  });
  it("Ben's five measure 53 with MID 36", () => {
    expect(plotMetrics(BEN)).toEqual({ plotH: 53, mid: 36 });
  });
  it('same five with the negative made positive measure 40', () => {
    expect(plotMetrics(BEN.map(Math.abs)).plotH).toBe(40);
  });
  it('no label top is negative when the tallest bar is at the top of the scale', () => {
    for (const set of [BEN, [9, 9, 0.1], [-9, 9], [2.8, -2.8, 1]]) {
      const maxAbs = Math.max(...set.map(Math.abs));
      const { mid, plotH } = plotMetrics(set);
      for (const v of set) {
        const g = barGeometry(v, maxAbs, mid);
        expect(g.labelTop).toBeGreaterThanOrEqual(0);
        if (g.below) expect(g.labelTop + 12).toBeLessThanOrEqual(plotH);
      }
    }
  });
  it('barGeometry at MID 33 matches the old fixed behaviour', () => {
    expect(barGeometry(7.4, 7.4, 33)).toEqual({ top: 11, height: 22, labelTop: -3, below: false });
    expect(barGeometry(-2, 4, 33)).toEqual({ top: 33, height: 11, labelTop: 47, below: true });
  });
});
