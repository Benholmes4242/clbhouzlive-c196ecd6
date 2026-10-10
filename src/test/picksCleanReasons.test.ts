import { describe, it, expect } from 'vitest';
import { cleanReasons } from '@/features/tourhub/hooks/useAIPredictions';

describe('cleanReasons', () => {
  it('never pads a pick with filler reasons', () => {
    expect(cleanReasons(['Leads the field in approach play'])).toEqual(['Leads the field in approach play']);
    expect(cleanReasons([])).toEqual([]);
  });
  it('still strips betting language and caps at three', () => {
    expect(cleanReasons(['a', 'Great odds', '+2500 value', 'b', 'c', 'd'])).toEqual(['a', 'b', 'c']);
  });
});
