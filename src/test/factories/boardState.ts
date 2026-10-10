import { vi } from 'vitest';
import { DEFAULT_FILTERS } from '@/components/explore-tab-new/courseled/boardFilters';
import type { AmateurBoardState } from '@/features/amateur/useAmateurBoardState';

/**
 * THE ONE FAKE BOARD STATE. Typed against the real hook's return, so a field
 * added to useAmateurBoardState fails typecheck here once instead of drifting
 * silently in every fixture. Defaults: resolved, recent board, no rows, counts
 * unresolved (countFor → null). Tests override only what they vary.
 */
export function makeBoardState(over: Partial<AmateurBoardState> = {}): AmateurBoardState {
  const base: AmateurBoardState = {
    ready: true,
    clubApplies: false,
    board: 'recent',
    entryBoard: 'recent',
    filters: DEFAULT_FILTERS,
    courseBoard: null,
    facets: { settled: false, countFor: () => null, openList: () => [] },
    page: { data: { rows: [], total: 0, pool: { rounds: 0, courses: 0, members: 0 } }, isSuccess: true, isPending: false } as never,
    total: 0,
    hasCircle: null,
    widened: false,
    panelOpen: false,
    openPanel: vi.fn(),
    closePanel: vi.fn(),
    changeBoard: vi.fn(),
    changeFilters: vi.fn(),
    changeCourseBoard: vi.fn(),
    resetFilters: vi.fn(),
    resetAll: vi.fn(),
    canReset: false,
    sheetFilterCount: 0,
    changeScope: vi.fn(),
    seeEveryone: vi.fn(),
  };
  return { ...base, ...over };
}
