import { describe, expect, it } from 'vitest';
import { picksEnabledForTour } from '@/features/tourhub/_shared/picksEnabledForTour';

describe('tournament picks tour gate', () => {
  it.each([
    ['pga', true], ['euro', false], ['lpga', true], ['champ', true],
    ['pgad', false], ['liv', true], ['other', true], ['EURO', false], ['PGAD', false],
  ])('%s has enabled=%s', (tour, enabled) => {
    expect(picksEnabledForTour(tour)).toBe(enabled);
  });
});