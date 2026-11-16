// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: null, loading: false }) }));
vi.mock('@/hooks/useOwnHandicapState', () => ({ useOwnHandicapState: () => ({ effectiveHandicap: null }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(() => Promise.resolve({ data: [], error: null })),
    from: () => ({ select: () => ({ in: () => ({ is: () => Promise.resolve({ data: [], error: null }) }) }) }),
  },
}));

/** Fixtures the mocked reads serve. vi.hoisted so the mock factories, which run
 *  while the imports below are being evaluated, can read them. */
const fx = vi.hoisted(() => {
  const baseRows = [
    { course_id: 'a', avg_to_par: -2.4, region: 'Kent', sub_country: 'England', rounds: 40, image_url: null, name: 'A' },
    { course_id: 'b', avg_to_par: 1.6, region: 'Kent', sub_country: 'England', rounds: 10, image_url: null, name: 'B' },
    { course_id: 'c', avg_to_par: null, region: 'Yorkshire', sub_country: 'England', rounds: 5, image_url: null, name: 'C' },
    { course_id: 'd', avg_to_par: 4, region: null, sub_country: 'England', rounds: 2, image_url: null, name: 'D' },
  ];
  const row = (over: Record<string, unknown>) => ({
    course_id: 'a', name: 'Royal Ashdown', region: 'Kent', sub_country: 'England', country: 'England',
    image_url: null, community_rating: 8.7, review_count: 24, global_rank: null, regional_rank: null,
    rounds: 40, members: 12, avg_to_par: -2.4, total_yards: 6400, tee_label: 'White', course_record: 62,
    open_crowns: 0, total_count: 4, design_score: 8.4, condition_score: 8.1, clubhouse_score: 7.9,
    facilities_score: 8, difficulty_percentile: 92, memberships: [{ list_slug: 'top100', rank: 12 }],
    ...over,
  });
  const rows = [
    row({}),
    row({
      course_id: 'b', name: 'Sunningdale', region: 'Berkshire', community_rating: null, review_count: 0,
      rounds: 0, members: 0, avg_to_par: null, course_record: null, design_score: null, condition_score: null,
      clubhouse_score: null, facilities_score: null, difficulty_percentile: null, memberships: [],
    }),
  ];
  const holders = new Map([
    ['a', { courseId: 'a', holderId: 'h1', holderName: 'Thomas Reed', recordGross: 62, photoUrl: null }],
  ]);
  const truth = {
    allPlayedTotal: 57, ratedTotal: 3, difficultyPercentiles: new Map([['a', 92]]),
    regions: [], directoryTotal: 4, playedCount: 4, roundsTotal: 57, holesPlayed: 72, baseRows,
  };
  return { baseRows, rows, holders, truth };
});

vi.mock('@/components/courses/useStatBrowse', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/components/courses/useStatBrowse');
  return {
    ...actual,
    useCourseBrowseTruth: () => ({ data: fx.truth, isFetched: true, isLoading: false, isError: false }),
    /* Facets with no lens_counts at all: the boards must still be offered. */
    useStatBrowseFacets: () => ({ data: null, isFetched: true, isLoading: false, isError: false }),
    useStatBrowseList: () => ({ rows: fx.rows, totalCount: fx.rows.length, isLoading: false, isPaging: false, loadMore: () => {} }),
  };
});
vi.mock('@/components/courses/useCourseRecordHolders', () => ({
  useCourseRecordHolders: () => ({ map: fx.holders, settled: true }),
}));

import StatBrowse, { CHIP_ROW_TOP } from '@/components/courses/StatBrowse';

function renderBrowse(entry = '/courses') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[entry]}>
        <StatBrowse onOpenDirectory={() => {}} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
import { act } from '@testing-library/react';
import { IslandDock } from '@/features/chrome-v2/IslandDock';
import { CoursesListStuckContext } from '@/components/courses/coursesListStuck';

describe('FIX_COURSES_LIST_STICKY_ROW', () => {
  it('the dropdown row is not sticky; the chip row is, with a top from --chrome-island-h', () => {
    const { container } = renderBrowse();
    const drop = container.querySelector('[data-courses-list-dropdowns]') as HTMLElement;
    const chips = container.querySelector('[data-courses-list-chips]') as HTMLElement;
    expect(drop.className).not.toContain('sticky');
    expect(drop.style.position).not.toBe('sticky');
    expect(chips.className).toContain('sticky');
    expect(CHIP_ROW_TOP).toContain('--chrome-island-h');
    expect(chips.querySelector('[role="tablist"]')).not.toBeNull();
    expect(drop.querySelector('[role="tablist"]')).toBeNull();
  });

  it('reports the stuck state upward once the row passes its top', () => {
    const report = vi.fn();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { container } = render(
      <QueryClientProvider client={client}><MemoryRouter initialEntries={['/courses']}>
        <CoursesListStuckContext.Provider value={report}><StatBrowse onOpenDirectory={() => {}} /></CoursesListStuckContext.Provider>
      </MemoryRouter></QueryClientProvider>,
    );
    const chips = container.querySelector('[data-courses-list-chips]') as HTMLElement;
    const sentinel = chips.previousElementSibling as HTMLElement;
    sentinel.getClientRects = () => [{}] as unknown as DOMRectList;
    sentinel.getBoundingClientRect = () => ({ top: -200 }) as DOMRect;
    act(() => { document.dispatchEvent(new Event('scroll')); });
    expect(report).toHaveBeenLastCalledWith(true);
    expect(chips.getAttribute('data-stuck')).toBe('true');
  });

  it('a suppressed IslandDock never shows; unsuppressed it is unchanged', () => {
    const orig = window.IntersectionObserver;
    window.IntersectionObserver = class { observe() {} disconnect() {} unobserve() {} } as unknown as typeof IntersectionObserver;
    function D({ s }: { s: boolean }) {
      const a = React.useRef<HTMLDivElement>(null);
      return <><div ref={a} /><IslandDock anchorRef={a} suppressed={s}>{(shown) => <span data-kid={String(shown)} />}</IslandDock></>;
    }
    const { container, rerender } = render(<D s />);
    const dock = container.querySelector('[data-island-dock]') as HTMLElement;
    act(() => { dock.dispatchEvent(new FocusEvent('focusin', { bubbles: true })); });
    expect(dock.getAttribute('data-shown')).toBe('false');
    rerender(<D s={false} />);
    expect(dock.getAttribute('data-shown')).toBe('true');
    window.IntersectionObserver = orig;
  });
});
