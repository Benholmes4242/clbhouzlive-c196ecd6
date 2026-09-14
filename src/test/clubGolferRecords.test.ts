import { describe, expect, it } from 'vitest';

import {
  assignClubRecordCategories,
  isClubRecordCategory,
} from '@/features/explore-magazine/clubGolferRecords';

describe('club golfer record assignment', () => {
  it('accepts all-time categories and rejects 90-day categories', () => {
    expect(isClubRecordCategory('most_aces_all_time')).toBe(true);
    expect(isClubRecordCategory('most_aces_90d')).toBe(false);
  });

  it('gives a one-option golfer their scarce claim before a flexible golfer', () => {
    const result = assignClubRecordCategories([
      { userId: 'multi', recordCategories: ['most_aces_all_time', 'most_eagles_all_time'] },
      { userId: 'single', recordCategories: ['most_aces_all_time'] },
    ]);
    expect(result.get('single')).toBe('most_aces_all_time');
    expect(result.get('multi')).toBe('most_eagles_all_time');
  });

  it('uses rarity order and never repeats a category', () => {
    const result = assignClubRecordCategories([
      { userId: 'a', recordCategories: ['most_rounds_all_time', 'most_albatrosses_all_time'] },
      { userId: 'b', recordCategories: ['most_rounds_all_time', 'most_aces_all_time'] },
    ]);
    expect(result.get('a')).toBe('most_albatrosses_all_time');
    expect(result.get('b')).toBe('most_aces_all_time');
    expect(new Set(result.values()).size).toBe(result.size);
  });

  it('leaves a golfer unassigned when every claim is already taken', () => {
    const result = assignClubRecordCategories([
      { userId: 'first', recordCategories: ['most_rounds_all_time'] },
      { userId: 'second', recordCategories: ['most_rounds_all_time'] },
    ]);
    expect(result.get('first')).toBe('most_rounds_all_time');
    expect(result.has('second')).toBe(false);
  });

  it('deduplicates category rows and is stable for each fixed shelf order', () => {
    const golfers = [
      { userId: 'a', recordCategories: ['most_eagles_all_time', 'most_eagles_all_time'] as const },
      { userId: 'b', recordCategories: ['most_birdies_all_time', 'most_rounds_all_time'] as const },
    ];
    const first = [...assignClubRecordCategories(golfers).entries()];
    const second = [...assignClubRecordCategories(golfers).entries()];
    expect(second).toEqual(first);
  });
});