import { describe, expect, it } from 'vitest';
import type { TFunction } from 'i18next';
import type { TourPlayerStatistics } from '@/features/tourhub/hooks/useTourHubData';
import type { LeaderCategoryDef, LeaderRankMaps } from '@/features/tourhub/leaders-v2/data/useLeaderCategories';
import { selectPlayerSeason } from '@/features/tourhub/player-v2/playerSeason';

const t = ((key: string) => key) as TFunction;
const stats = {
  player_id: 'p1',
  scoring_average: 69.5,
  strokes_gained_total: 1.2,
  strokes_gained_tee_green: 0.9,
  driving_distance: 310,
  wins: 2,
  top_10s: 5,
  world_rank: 3,
  fedex_rank: 2,
} as TourPlayerStatistics;
const category = (key: string): LeaderCategoryDef => ({
  key, labelKey: key, shortKey: key, unitKey: key, descriptionKey: key,
  rows: [], poolSize: 100, group: 'scoring', meaningfulBehind: true,
  picturableGap: true, duelGapLimit: 0.1,
});

describe('selectPlayerSeason', () => {
  it('prefers scoring average for the headline and removes overlapping total evidence', () => {
    const rankMaps: LeaderRankMaps = {
      scoring_avg: { p1: { rank: 4, tied: false } },
      strokes_gained_total: { p1: { rank: 2, tied: false } },
      strokes_gained_tee_green: { p1: { rank: 3, tied: false } },
      drive_avg: { p1: { rank: 7, tied: false } },
    };
    const selected = selectPlayerSeason('p1', 'pga', stats, [], rankMaps, Object.keys(rankMaps).map(category), t);
    expect(selected.headline?.key).toBe('scoring_avg');
    expect(selected.strengths.map((row) => row.key)).toEqual(['strokes_gained_tee_green', 'drive_avg']);
  });

  it('caps strengths at three and weaknesses at two', () => {
    const rankMaps: LeaderRankMaps = Object.fromEntries(
      ['drive_avg', 'drive_acc', 'gir_pct', 'sand_saves_pct', 'putt_avg', 'strokes_gained_tee_green'].map((key, index) => [key, { p1: { rank: index < 4 ? index + 1 : 70 + index, tied: false } }]),
    );
    const richStats = { ...stats, scoring_average: null, driving_accuracy: 70, greens_in_reg: 72, sand_saves: 60, putting_average: 1.7 } as TourPlayerStatistics;
    const selected = selectPlayerSeason('p1', 'pga', richStats, [], rankMaps, Object.keys(rankMaps).map(category), t);
    expect(selected.strengths.length).toBeLessThanOrEqual(3);
    expect(selected.weaknesses.length).toBeLessThanOrEqual(2);
  });

  it('shows only the better-ranked of the two putting measures', () => {
    const rankMaps: LeaderRankMaps = {
      putt_avg: { p1: { rank: 9, tied: false } },
      strokes_gained_putting: { p1: { rank: 3, tied: false } },
    };
    const puttStats = { ...stats, scoring_average: null, putting_average: 1.71, strokes_gained_putting: 1.015 } as TourPlayerStatistics;
    const selected = selectPlayerSeason('p1', 'pga', puttStats, [], rankMaps, Object.keys(rankMaps).map(category), t);
    const keys = [selected.headline?.key, ...selected.strengths.map((row) => row.key)].filter(Boolean);
    expect(keys).toEqual(['strokes_gained_putting']);
  });

  it('uses the same branded non-PGA points rank for verdict and hero proof', () => {
    const rankMaps: LeaderRankMaps = {
      points: { p1: { rank: 87, tied: true } },
      wins: { p1: { rank: 4, tied: false } },
    };
    const categories = [
      { ...category('points'), rows: [] },
      { ...category('wins'), rows: [{ playerId: 'p1', value: 1 } as LeaderCategoryDef['rows'][number]] },
    ];
    const selected = selectPlayerSeason('p1', 'euro', null, [], rankMaps, categories, t);
    expect(selected.verdict).toEqual({
      key: 'player.hero.verdict.pointsRanked_one',
      values: { wins: 1, rank: 'T87', raceLabel: 'leaders.pointsBrand.euro' },
    });
    expect(selected.raceProof).toEqual({
      points: { rank: 87, tied: true, label: 'leaders.pointsBrand.euro' },
      wins: { rank: 4, tied: false },
    });
    expect(selected.headline).toBeNull();
    expect(selected.strengths).toEqual([]);
    expect(selected.weaknesses).toEqual([]);
  });

  it('derives a non-PGA win from the full result set when no wins row exists', () => {
    const win = { id: 'r1', tournament_id: 't1', tournament_name: 'Event', tournament_start_date: '2025-02-06', tournament_end_date: '2025-02-09', position: 1, position_tied: false, score: -12, strokes: 268, money: null, status: 'active' };
    const selected = selectPlayerSeason(
      'p1',
      'pgad',
      null,
      [win],
      { points: { p1: { rank: 42, tied: false } } },
      [category('points')],
      t,
    );
    expect(selected.verdict).toEqual({
      key: 'player.hero.verdict.pointsRanked_one',
      values: { wins: 1, rank: 'player.stats.ordinal.nd', raceLabel: 'leaders.pointsBrand.pgad' },
    });
    expect(selected.raceProof?.wins).toBeNull();
  });
});