import { describe, expect, it } from 'vitest';
import { playerAppearanceCounts, resolveSeasonSubject, SEASON_SUBJECT_THRESHOLD, selectSeasonMagazine } from '@/features/tourhub/leaders-v2/seasonMagazine';
import type { LeaderCategoryDef, LeaderRow } from '@/features/tourhub/leaders-v2/data/useLeaderCategories';

const row = (playerId: string, value: number, rank: number, movement: number | null = null): LeaderRow => ({ playerId, name: playerId, rank, rankLabel: String(rank), tied: false, country: null, countryCode: null, photoUrl: null, tourCode: 'pga', value, valueFormatted: String(value), movement, behindFormatted: null });
const category = (key: string, rows: LeaderRow[], extra: Partial<LeaderCategoryDef> = {}): LeaderCategoryDef => ({ key, labelKey: key, shortKey: key, unitKey: key, descriptionKey: key, group: 'season', meaningfulBehind: true, picturableGap: true, duelGapLimit: 0.1, rows, poolSize: rows.length, ...extra });

describe('season magazine selection', () => {
  it('uses the mandated fallback threshold', () => {
    expect(SEASON_SUBJECT_THRESHOLD).toBe(0.25);
    expect(resolveSeasonSubject(category('points', [row('leader', 100, 1), row('second', 75, 2)])).kind).toBe('race');
    expect(resolveSeasonSubject(category('points', [row('leader', 100, 1), row('second', 74, 2)])).kind).toBe('player');
  });

  it('excludes earnings and caps a player at two selected modules', () => {
    const result = selectSeasonMagazine([
      category('points', [row('a', 100, 1, 2), row('b', 70, 2, -1), row('c', 40, 3)]),
      category('earnings', [row('d', 9, 1), row('e', 8, 2)]),
      category('drive_avg', [row('c', 320, 1), row('d', 319, 2)], { group: 'tee' }),
      category('wins', [row('d', 2, 1), row('e', 2, 1), row('f', 1, 3)]),
    ]);
    expect(result?.oneNumber?.key).toBe('drive_avg');
    expect(result?.tiedList?.key).toBe('wins');
    expect([result?.oneNumber?.key, result?.duel?.key, result?.tiedList?.key]).not.toContain('earnings');
    expect(Math.max(...(result ? playerAppearanceCounts(result).values() : [0]))).toBeLessThanOrEqual(2);
  });

  it('returns a reduced edition rather than blank modules', () => {
    const result = selectSeasonMagazine([category('points', [row('a', 100, 1), row('b', 90, 2), row('c', 80, 3)])]);
    expect(result?.reduced).toBe(true);
    expect(result?.oneNumber).toBeNull();
    expect(result?.duel).toBeNull();
    expect(result?.tiedList).toBeNull();
  });
});