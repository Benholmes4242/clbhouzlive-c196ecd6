import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { reviewsCommunitySample, type ReviewSampleRow } from '@/lib/reviews/communitySample';
import { hasCommunityAverage, hasRatingDistribution, subScoreBandStatistic, showableSplitBands } from '@/lib/reviews/sampleRules';
import { TheScore } from '@/components/courses/course-detail/reviews/TheScore';

const row = (id: string, rating: number, scores = [rating, rating, rating, rating]): ReviewSampleRow => ({
  id, user_id: id, rating, design_score: scores[0], condition_score: scores[1], clubhouse_score: scores[2], facilities_score: scores[3],
});
const sundridge = [row('viewer', 8.4, [9, 8, 7, 6]), row('a', 8.1, [8, 7, 6, 5]), row('b', 8.1, [8, 7, 6, 5])];

describe('REVIEWS_SAMPLE_1', () => {
  it('Sundridge: excluding average is 8.1 and delta is 0.3, not 0.2', () => {
    const sample = reviewsCommunitySample(sundridge, 'viewer');
    expect(sample.score).toBeCloseTo(8.1);
    expect(sample.delta).toBe(0.3);
    expect(sample.delta).not.toBe(0.2);
    const { container } = render(<TheScore score={sample.score} viewerScore={sample.viewerScore} ratingCount={sample.ratingCount} distribution={sample.distribution} />);
    expect(container.textContent).toContain('0.3above');
    expect(container.textContent).not.toContain('0.2above');
  });
  it('excludes the viewer from all four category means', () => {
    expect(reviewsCommunitySample(sundridge, 'viewer').categories).toEqual({ design: 8, condition: 7, clubhouse: 6, facilities: 5 });
  });
  it('excludes the viewer from distribution and future range/split input rows', () => {
    const sample = reviewsCommunitySample([row('viewer', 9.5), row('a', 8.1), row('b', 6.5)], 'viewer');
    expect(sample.distribution).toEqual({ exceptional: 0, excellent: 1, good: 1, fair: 0, poor: 0 });
    expect(sample.ratingCount).toBe(2);
    expect(sample.communityRows.map((r) => r.id)).toEqual(['a', 'b']);
  });
  it('when viewer has not rated, keeps the plain community sample', () => {
    const sample = reviewsCommunitySample(sundridge, 'unrated');
    expect(sample.score).toBeCloseTo(8.2);
    expect(sample.ratingCount).toBe(3);
    expect(sample.distribution.excellent).toBe(3);
    expect(sample.categories.design).toBeCloseTo(25 / 3);
    expect(sample.viewerScore).toBeNull();
  });
  it('an unrated viewer row does not exclude any score', () => {
    const sample = reviewsCommunitySample([{ ...row('viewer', 8), rating: null }, row('a', 7)], 'viewer');
    expect(sample.score).toBe(7);
    expect(sample.categories.design).toBe(7);
    expect(sample.viewerScore).toBeNull();
  });
  it('does not substitute overall count for sparse subscore count', () => {
    const rows = [row('viewer', 8, [10, 8, 8, 8]), row('a', 8, [6, 8, 8, 8]), { ...row('b', 8), design_score: null }];
    expect(reviewsCommunitySample(rows, 'viewer').categories.design).toBe(6);
  });
  it('missing viewer subscore removes no category contribution', () => {
    const rows = [{ ...row('viewer', 8), design_score: null }, row('a', 8, [6, 8, 8, 8])];
    expect(reviewsCommunitySample(rows, 'viewer').categories.design).toBe(6);
  });
  it('viewer-only course has no community score, category mean or delta', () => {
    const sample = reviewsCommunitySample([row('viewer', 8.4)], 'viewer');
    expect(sample.score).toBeNull();
    expect(sample.delta).toBeNull();
    expect(sample.ratingCount).toBe(0);
    expect(sample.categories).toEqual({ design: null, condition: null, clubhouse: null, facilities: null });
  });
  it('average boundary: one is not an average, two is', () => {
    expect(hasCommunityAverage(1)).toBe(false);
    expect(hasCommunityAverage(2)).toBe(true);
  });
  it('distribution boundary: four is withheld, five qualifies', () => {
    expect(hasRatingDistribution(4)).toBe(false);
    expect(hasRatingDistribution(5)).toBe(true);
  });
  it('band statistic boundary: nine uses extrema, ten uses middle 80%', () => {
    expect(subScoreBandStatistic(9)).toBe('min-max');
    expect(subScoreBandStatistic(10)).toBe('middle-80');
  });
  it('split boundary: nine omitted and ten drawn when two qualify', () => {
    expect(showableSplitBands([{ id: 'nine', count: 9 }, { id: 'ten', count: 10 }, { id: 'eleven', count: 11 }]))
      .toEqual([{ id: 'ten', count: 10 }, { id: 'eleven', count: 11 }]);
  });
  it('split disappears when fewer than two bands qualify', () => {
    expect(showableSplitBands([{ count: 9 }, { count: 10 }])).toEqual([]);
    expect(showableSplitBands([{ count: 9 }])).toEqual([]);
  });
  it('sample form follows sample downwards as well as upwards', () => {
    expect([2, 1].map(hasCommunityAverage)).toEqual([true, false]);
    expect([5, 4].map(hasRatingDistribution)).toEqual([true, false]);
    expect([10, 9].map(subScoreBandStatistic)).toEqual(['middle-80', 'min-max']);
  });
  it('there is no second exclusion implementation in review derivations or tree', () => {
    const scan = (dir: string): string[] => readdirSync(dir).flatMap((name) => {
      const file = join(dir, name);
      return statSync(file).isDirectory() ? scan(file) : /\.tsx?$/.test(file) ? [file] : [];
    });
    const files = [...scan('src/components/courses/course-detail/reviews'), ...scan('src/lib/reviews')];
    const duplicates = files.filter((file) => /\([^;\n]*\*[^;\n]*-[^;\n]*\)\s*\/\s*\([^;\n]*-\s*1\)/.test(readFileSync(file, 'utf8')));
    expect(duplicates).toEqual([]);
    expect(readFileSync('src/lib/reviews/communitySample.ts', 'utf8')).toContain("import { fieldExcludingViewer } from '@/lib/courseYou/youDerivations'");
  });
});