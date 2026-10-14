import { describe, it, expect } from 'vitest';
import { faultChip } from './NewsroomSection';

describe('faultChip', () => {
  it('players: unmatched is total minus matched', () => {
    expect(faultChip({ key: 'players', value: '3 of 4 matched' })).toEqual({ text: '1 player not matched', tone: 'danger' });
  });
  it('standfirst "Missing" reads No standfirst', () => {
    expect(faultChip({ key: 'standfirst', value: 'Missing' }).text).toBe('No standfirst');
  });
  it('emdash count', () => {
    expect(faultChip({ key: 'emdash', value: '2' }).text).toBe('2 em dashes');
  });
});
