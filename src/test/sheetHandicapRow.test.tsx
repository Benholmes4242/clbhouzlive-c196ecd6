import { describe, it, expect } from 'vitest';
import { handicapNavValue } from '@/features/profile-sheet-v2/components/HcpStrip';

const history = (first: number, last: number) => [
  { observed_at: '2026-08-01', handicap_index: first },
  { observed_at: '2026-10-01', handicap_index: last },
];
describe('SHEET_HCP_1_R3', () => {
  it('falling ninety-day history retains the latest index and movement', () => {
    expect(handicapNavValue({ kind: 'ready', index: 1.5 }, history(3, 1.5)))
      .toEqual({ index: 1.5, subLabel: 'Down 1.5 in ninety days', direction: 'down' });
  });
  it('rising ninety-day history retains the existing movement', () => {
    expect(handicapNavValue({ kind: 'ready', index: 3 }, history(1.5, 3)))
      .toEqual({ index: 3, subLabel: 'Up 1.5 in ninety days', direction: 'up' });
  });
  it('fewer than two history points keeps the value without a movement claim', () => {
    expect(handicapNavValue({ kind: 'ready', index: 1.5 }, []))
      .toEqual({ index: 1.5, subLabel: undefined, direction: undefined });
    expect(handicapNavValue({ kind: 'ready', index: 1.5 }, history(3, 1.5).slice(1)))
      .toEqual({ index: 1.5, subLabel: undefined, direction: undefined });
  });
  it('unsettled and unconnected states never expose the handicap row', () => {
    expect(handicapNavValue({ kind: 'unsettled' }, history(3, 1.5))).toBeNull();
    expect(handicapNavValue({ kind: 'none' }, history(3, 1.5))).toBeNull();
    expect(handicapNavValue({ kind: 'manual', index: 14 }, history(3, 1.5))).toBeNull();
  });
});