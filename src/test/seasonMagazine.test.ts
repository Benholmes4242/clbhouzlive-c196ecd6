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

  it('returns an explicit module count and reduced-layout decision', () => {
    const result = selectSeasonMagazine([category('points', [row('a', 100, 1), row('b', 90, 2), row('c', 80, 3)])]);
    expect(result?.moduleCount).toBe(2);
    expect(result?.useReducedLayout).toBe(true);
    expect(result?.showMovement).toBe(false);
    expect(result?.showRaceStandings).toBe(true);
    expect(result?.oneNumber).toBeNull();
    expect(result?.duel).toBeNull();
    expect(result?.tiedList).toBeNull();
  });

  it('limits tied lists to notable performance categories', () => {
    const result = selectSeasonMagazine([
      category('points', [row('a', 100, 1), row('b', 90, 2), row('c', 80, 3)]),
      category('events_played', [row('d', 20, 1), row('e', 20, 1), row('f', 19, 3)]),
      category('top_10', [row('g', 8, 1), row('h', 8, 1), row('i', 7, 3)]),
    ]);
    expect(result?.tiedList?.key).toBe('top_10');
  });

  it('does not count race rows or tied-list membership as featured roles', () => {
    const result = selectSeasonMagazine([
      category('points', [row('leader', 100, 1), row('second', 70, 2), row('third', 60, 3), row('fourth', 50, 4), row('fifth', 40, 5)]),
      category('special', [row('number', 10, 1), row('other', 5, 2)], { picturableGap: false }),
      category('drive_avg', [row('leader', 320, 1), row('duelist', 319, 2)], { group: 'tee' }),
      category('wins', [row('leader', 3, 1), row('winner-two', 3, 1), row('winner-three', 3, 1)]),
    ]);
    expect(result?.showRaceStandings).toBe(true);
    expect(result?.tiedList?.key).toBe('wins');
    expect(result?.moduleCount).toBe(5);
    expect(result ? playerAppearanceCounts(result).get('leader') : null).toBe(2);
    expect(result ? playerAppearanceCounts(result).has('second') : true).toBe(false);
    expect(result ? playerAppearanceCounts(result).has('winner-two') : true).toBe(false);
  });
});