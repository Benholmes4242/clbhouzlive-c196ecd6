import { describe, it, expect, beforeEach } from 'vitest';
import { EXPLORE_ALL_TAB_ENABLED, EXPLORE_VIEWS, readExploreView } from '@/features/explore-magazine/exploreViewMemory';

describe('All tab trial', () => {
  beforeEach(() => sessionStorage.clear());
  it('hides All while the flag is off', () => {
    expect(EXPLORE_ALL_TAB_ENABLED).toBe(false);
    /* RS — the Rounds/Watch switch is gone; Watch is the only reachable view. */
    expect(EXPLORE_VIEWS).toEqual(['watch']);
  });
  it('defaults to the first view in the strip', () => {
    expect(readExploreView()).toBe(EXPLORE_VIEWS[0]);
  });
  it('a remembered all falls to Watch', () => {
    sessionStorage.setItem('amateur:view', 'all');
    expect(readExploreView()).toBe('watch');
  });
  it('a remembered scores falls to Watch', () => {
    sessionStorage.setItem('amateur:view', 'scores');
    expect(readExploreView()).toBe('watch');
  });
});
