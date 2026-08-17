import { describe, expect, it } from 'vitest';

import {
  estimateEffortHeight,
  parseAttempts,
  parsePreviousBest,
  treatmentFor,
} from '@/components/explore-tab-new/courseled/PersonalBestTiles';

/**
 * The two generated forms of `reference_line` are keyed to the feat kind, so a
 * shape that matches the WRONG kind must not be read (BRIEF_FEAT_SECTIONS_
 * HIERARCHY §2.6) — a feat that cannot be parsed keeps its photograph.
 */
describe('personal bests treatment selection', () => {
  it('reads a previous best only for the record kinds', () => {
    expect(parsePreviousBest('most_pars_here', 'Previous best 11')).toBe(11);
    expect(parsePreviousBest('most_birdies_here', 'Previous best 3')).toBe(3);
    expect(parsePreviousBest('first_sub_80_here', 'Previous best 3')).toBeNull();
    expect(parsePreviousBest('most_pars_here', 'In 41 rounds')).toBeNull();
  });

  it('reads an attempt count only for the first-time kinds', () => {
    expect(parseAttempts('first_sub_80_here', 'In 41 rounds')).toBe(41);
    expect(parseAttempts('first_double_free_here', 'In 6 rounds')).toBe(6);
    expect(parseAttempts('big_points_here', 'In 6 rounds')).toBeNull();
    expect(parseAttempts('first_sub_70_here', '2nd time')).toBeNull();
  });

  it('assigns one of three treatments and never guesses', () => {
    expect(treatmentFor('most_birdies_here', 'Previous best 5')).toBe('progression');
    expect(treatmentFor('first_sub_70_here', 'In 12 rounds')).toBe('effort');
    // "Nth time" carries neither a before nor a wait: full photograph.
    expect(treatmentFor('big_points_here', '3rd time')).toBe('photo');
    expect(treatmentFor('first_sub_80_here', null)).toBe('photo');
  });

  it('bills the effort sentence, clamped at two lines', () => {
    expect(estimateEffortHeight('')).toBe(150);
    expect(estimateEffortHeight('First time under 80 here \u00B7 After 41 rounds')).toBe(186);
  });
});
