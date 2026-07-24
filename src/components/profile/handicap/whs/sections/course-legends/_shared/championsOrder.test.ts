import { describe, it, expect } from 'vitest';
import type { LegendCategory } from '@/lib/gam/types';
import {
  CHAMPIONS_ORDER_90D,
  CHAMPIONS_ORDER_ALL_TIME,
  orderWithWomensRecord,
} from './championsOrder';

describe('orderWithWomensRecord', () => {
  it('inserts lowest_gross_women_90d immediately after lowest_gross_90d when present', () => {
    const present = new Set<LegendCategory>([
      ...CHAMPIONS_ORDER_90D,
      'lowest_gross_women_90d',
    ]);
    const out = orderWithWomensRecord(CHAMPIONS_ORDER_90D, present);
    const grossIdx = out.indexOf('lowest_gross_90d');
    expect(grossIdx).toBeGreaterThanOrEqual(0);
    expect(out[grossIdx + 1]).toBe('lowest_gross_women_90d');
  });

  it('inserts lowest_gross_women_all_time immediately after lowest_gross_all_time when present', () => {
    const present = new Set<LegendCategory>([
      ...CHAMPIONS_ORDER_ALL_TIME,
      'lowest_gross_women_all_time',
    ]);
    const out = orderWithWomensRecord(CHAMPIONS_ORDER_ALL_TIME, present);
    const grossIdx = out.indexOf('lowest_gross_all_time');
    expect(out[grossIdx + 1]).toBe('lowest_gross_women_all_time');
  });

  it('emits base order unchanged when the women record is absent (no unclaimed slot)', () => {
    const present = new Set<LegendCategory>(CHAMPIONS_ORDER_90D);
    const out = orderWithWomensRecord(CHAMPIONS_ORDER_90D, present);
    expect(out).toEqual(CHAMPIONS_ORDER_90D);
    expect(out).not.toContain('lowest_gross_women_90d');
  });

  it('emits base order unchanged for all-time when women record absent', () => {
    const present = new Set<LegendCategory>(CHAMPIONS_ORDER_ALL_TIME);
    const out = orderWithWomensRecord(CHAMPIONS_ORDER_ALL_TIME, present);
    expect(out).toEqual(CHAMPIONS_ORDER_ALL_TIME);
  });
});
