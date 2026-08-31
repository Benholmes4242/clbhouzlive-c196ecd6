import { beforeEach, describe, expect, it } from 'vitest';

import {
  CANONICAL_TOUR_SLUGS,
  readStoredTour,
  TOUR_STORAGE_KEY,
  writeStoredTour,
} from './useTourSelection';

describe('Tour Hub stored lens', () => {
  beforeEach(() => window.localStorage.clear());

  it('treats all as a canonical persisted lens', () => {
    expect(CANONICAL_TOUR_SLUGS).toContain('all');
    writeStoredTour('all');
    expect(readStoredTour()).toBe('all');
  });

  it('preserves an existing member-selected tour', () => {
    writeStoredTour('lpga');
    expect(readStoredTour()).toBe('lpga');
  });

  it('rejects an unknown stored value', () => {
    window.localStorage.setItem(TOUR_STORAGE_KEY, 'unknown-tour');
    expect(readStoredTour()).toBeNull();
  });
});