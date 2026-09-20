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
    const selected = selectPlayerSeason(stats, [], rankMaps, Object.keys(rankMaps).map(category), t);
    expect(selected.headline?.key).toBe('scoring_avg');
    expect(selected.strengths.map((row) => row.key)).toEqual(['strokes_gained_tee_green', 'drive_avg']);
  });

  it('caps strengths at three and weaknesses at two', () => {
    const rankMaps: LeaderRankMaps = Object.fromEntries(
      ['drive_avg', 'drive_acc', 'gir_pct', 'sand_saves_pct', 'putt_avg', 'birdies_per_round'].map((key, index) => [key, { p1: { rank: index < 4 ? index + 1 : 70 + index, tied: false } }]),
    );
    const richStats = { ...stats, scoring_average: null, driving_accuracy: 70, greens_in_reg: 72, sand_saves: 60, putting_average: 1.7, birdies_per_round: 4 } as TourPlayerStatistics;
    const selected = selectPlayerSeason(richStats, [], rankMaps, Object.keys(rankMaps).map(category), t);
    expect(selected.strengths.length).toBeLessThanOrEqual(3);
    expect(selected.weaknesses.length).toBeLessThanOrEqual(2);
  });
});