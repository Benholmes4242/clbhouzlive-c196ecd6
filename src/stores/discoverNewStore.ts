import { create } from 'zustand';

/**
 * DISCOVER "NEW SINCE" COUNTS (BRIEF_DISCOVER_NEW_SINCE, section 3).
 *
 * Every marked section reports how many of its OWN items are newer than the
 * member's last-seen stamp. The total feeds the courses tab badge in
 * GlobalBottomNavigation, so the badge is derived from the very same in-memory
 * data the page renders — there is no count query and there never should be.
 *
 * MOST PLAYED and THE HONOURS BOARD deliberately never report: a leaderboard
 * position and an all-time board are STATES, not events, and marking them would
 * cry wolf.
 *
 * Counts survive a section unmount on purpose (leaving Discover writes the
 * last-seen stamp, which resets them through markSeen -> reset()).
 */

export type DiscoverNewSection = 'friends' | 'tour' | 'reviews' | 'world' | 'moments';

interface DiscoverNewState {
  counts: Partial<Record<DiscoverNewSection, number>>;
  setCount: (section: DiscoverNewSection, count: number) => void;
  reset: () => void;
}

export const useDiscoverNewStore = create<DiscoverNewState>((set) => ({
  counts: {},
  setCount: (section, count) =>
    set((s) => (s.counts[section] === count ? s : { counts: { ...s.counts, [section]: count } })),
  reset: () => set((s) => (Object.keys(s.counts).length === 0 ? s : { counts: {} })),
}));

/** Total across the marked sections. A section that has not loaded contributes 0. */
export function useDiscoverNewTotal(): number {
  return useDiscoverNewStore((s) =>
    Object.values(s.counts).reduce((sum, n) => sum + (n ?? 0), 0),
  );
}

export function resetDiscoverNewCounts() {
  useDiscoverNewStore.getState().reset();
}

export function reportDiscoverNewCount(section: DiscoverNewSection, count: number) {
  useDiscoverNewStore.getState().setCount(section, count);
}
