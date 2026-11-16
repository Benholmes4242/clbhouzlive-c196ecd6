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

import StatBrowse from '@/components/courses/StatBrowse';
import { BrowseCourseCard, PHOTO_H, TOP100_PHOTO_H } from '@/components/courses/BrowseCourseCard';
import { ListScopeHeader } from '@/components/courses/browse/ListScopeHeader';
import { ALL_COURSES_ANCHOR } from '@/components/courses/browse/ByRegionSection';
import {
  browseFiguresForScope,
  groupBrowseRegions,
  STAT_LENSES,
  COURSE_BROWSE_LENSES,
  type StatBrowseRow,
} from '@/components/courses/useStatBrowse';

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

const head = (container: HTMLElement) => container.querySelector(`#${ALL_COURSES_ANCHOR}`) as HTMLElement;

/** The holder read the list serves for course 'a'. */
const RECORD_HOLDER = { courseId: 'a', holderId: 'h1', holderName: 'Thomas Reed', recordGross: 62, photoUrl: null };

describe('courses list photo cards — boards', () => {
  it('the browse boards are the five lenses with Lowest rounds last, and the lens list carries it', () => {
    expect([...COURSE_BROWSE_LENSES]).toEqual(['rated', 'played', 'toughest', 'scoreable', 'lowest']);
    expect(STAT_LENSES).toContain('lowest');
  });

  it('the fifth chip is Lowest rounds, offered even with no facet counts, and tapping it selects it', () => {
    const { container } = renderBrowse();
    const tab = screen.getByRole('tab', { name: 'Lowest rounds' });
    expect(tab.getAttribute('aria-disabled')).not.toBe('true');
    fireEvent.click(tab);
    expect(screen.getByRole('tab', { name: 'Lowest rounds' })).toHaveAttribute('aria-selected', 'true');
    /* The five boards sit in one chip row above the list. */
    expect(container.querySelectorAll('[role="tablist"]').length).toBeGreaterThan(0);
  });
});

describe('courses list photo cards — the list head', () => {
  it('shows the scope caption and the three figures, above the control bar and not sticky itself', () => {
    const { container } = renderBrowse();
    const h = head(container);
    expect(h.textContent).toContain('Every course played');
    expect(h.textContent).toContain('Courses');
    expect(h.textContent).toContain('Rounds');
    expect(h.textContent).toContain('Holes');
    expect(h.textContent).not.toContain('Plays to');
    // Whole scope: 4 courses, 40+10+5+2 = 57 rounds, 57 × 18 = 1,026 holes.
    expect(h.textContent).toContain('4');
    expect(h.textContent).toContain('57');
    expect(h.textContent).toContain('1,026');
    expect(h.style.position).not.toBe('sticky');
    const bar = container.querySelector('[role="tablist"]') as HTMLElement;
    // eslint-disable-next-line no-bitwise
    expect(h.compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('a region scope captions the head with the region and figures it exactly like that region tile', () => {
    const { container } = renderBrowse('/courses?country=England&region=Kent');
    const h = head(container);
    expect(h.textContent).toContain('Every course in Kent');
    const tile = groupBrowseRegions(fx.baseRows).find((r) => r.region === 'Kent')!;
    const figures = browseFiguresForScope(fx.baseRows, { region: 'Kent' });
    expect(figures).toEqual({ courses: tile.courses, rounds: tile.rounds, holes: tile.rounds * 18, avgToPar: tile.avgToPar });
    expect(h.textContent).toContain(String(tile.courses));
    expect(h.textContent).toContain(String(tile.rounds));
    expect(h.textContent).toContain(String(tile.rounds * 18));
    expect(h.textContent).not.toContain('\u22121.6');
  });

  it('an area scope with no region captions the head with the area', () => {
    const { container } = renderBrowse('/courses?country=England');
    expect(head(container).textContent).toContain('Every course in England');
  });

  it('a scope with no played courses is the caption alone, never a row of placeholder figures', () => {
    const view = render(<ListScopeHeader region={null} country={null} figures={{ courses: 0, rounds: 0, holes: 0, avgToPar: null }} />);
    expect(view.container.textContent).toContain('Every course played');
    expect(view.container.textContent).not.toContain('Courses');
    expect(view.container.textContent).not.toContain('Rounds');
  });

  it('the search placeholder names the scope', () => {
    // The field opens from the glyph beside the two dropdowns.
    const openField = () => fireEvent.click(screen.getByRole('button', { name: 'Search this list' }));
    const { unmount } = renderBrowse();
    openField();
    expect(screen.getByPlaceholderText('Search courses')).toBeInTheDocument();
    unmount();
    renderBrowse('/courses?country=England&region=Kent');
    openField();
    // The mock's t returns defaultValue verbatim, so the scope branch is
    // identified by its own default text: {{scope}} never reaches the DOM.
    expect(screen.getByPlaceholderText('Search {{scope}} courses')).toBeInTheDocument();
  });
});

describe('courses list photo cards — the record row', () => {
  const holder = RECORD_HOLDER;

  it('names the holder and the gross when the RPC record equals the row record', () => {
    const view = render(<BrowseCourseCard row={fx.rows[0] as StatBrowseRow} holder={holder} onClick={() => {}} />);
    expect(view.container.textContent).toContain('COURSE RECORD');
    expect(view.container.textContent).toContain('Thomas Reed');
    expect(view.container.textContent).toContain('GROSS');
    expect(view.container.textContent).toContain('62');
  });

  it('stays silent with no holder row, a blank name, or a gross that is not this record', () => {
    for (const h of [
      null,
      undefined,
      { ...holder, holderName: '   ' },
      { ...holder, recordGross: 63 },
    ]) {
      const view = render(<BrowseCourseCard row={fx.rows[0] as StatBrowseRow} holder={h} onClick={() => {}} />);
      expect(view.container.textContent).not.toContain('COURSE RECORD');
      expect(view.container.textContent).not.toContain('Thomas Reed');
    }
  });

  it('the list shows the record row on exactly the card whose holder read came back', () => {
    const { container } = renderBrowse();
    expect(screen.getAllByText('COURSE RECORD')).toHaveLength(1);
    expect(screen.getByText('Thomas Reed')).toBeInTheDocument();
    // The other card keeps its own layout: no record row of its own.
    const other = screen.getByRole('button', { name: 'View Sunningdale' });
    expect(other.textContent).not.toContain('COURSE RECORD');
    expect(other.textContent).not.toContain('Thomas Reed');
  });

  it('the record score holds its column open while the name may shrink', () => {
    const view = render(<BrowseCourseCard row={fx.rows[0] as StatBrowseRow} holder={holder} onClick={() => {}} />);
    const gross = screen.getByText('GROSS').parentElement as HTMLElement;
    expect(gross.style.whiteSpace).toBe('nowrap');
    // jsdom expands `flex: none` to its longhand: the column grows and shrinks by nothing.
    expect(gross.style.flex).toBe('0 0 auto');
  });
});

describe('courses list photo cards — the card body', () => {
  it('the removed plays sentence is absent', () => {
    const view = render(<BrowseCourseCard row={fx.rows[0] as StatBrowseRow} holder={RECORD_HOLDER} onClick={() => {}} />);
    expect(view.container.textContent).not.toContain('Plays to');
  });

  it('both cards use a 190px straight-edge photo', () => {
    const bare = { ...fx.rows[1], course_record: null, avg_to_par: null, rounds: 0 } as StatBrowseRow;
    const view = render(<BrowseCourseCard row={bare} onClick={() => {}} />);
    expect((view.container.querySelector('.course-list-photo') as HTMLElement).style.height).toBe('190px');
    expect(PHOTO_H).toBe(190);
    expect(TOP100_PHOTO_H).toBe(190);
    expect(view.container.textContent).not.toContain('Plays to');
    expect(view.container.textContent).not.toContain('COURSE RECORD');
  });

  it('browse cards sit 10px apart in card view', () => {
    const { container } = renderBrowse();
    const wrapper = screen.getByRole('button', { name: 'View Royal Ashdown' }).parentElement as HTMLElement;
    expect(wrapper.style.marginBottom).toBe('10px');
    expect(container).toBeTruthy();
  });

  it('Top 100 replaces its members best-by line and photo height', () => {
    const view = render(<BrowseCourseCard row={fx.rows[0] as StatBrowseRow} variant="top100" recordHolder="Thomas" holder={RECORD_HOLDER} players={[]} onClick={() => {}} />);
    expect(view.container.textContent).toContain('12 members');
    expect(view.container.textContent).not.toMatch(/Best 62 by Thomas/);
    expect(view.container.querySelector('.course-list-record')).not.toBeNull();
    expect((view.container.querySelector('.course-list-photo') as HTMLElement).style.height).toBe('190px');
    expect(TOP100_PHOTO_H).toBe(190);
  });
});

describe('BRIEF_COURSE_CARD_V3 — gaps and scope header', () => {
  it('list view keeps rows flush (0px) while card view spaces tiles 10px', () => {
    localStorage.setItem('courses-list-view', 'list');
    try {
      renderBrowse();
      const wrapper = screen.getByRole('button', { name: 'View Royal Ashdown' }).parentElement as HTMLElement;
      expect(wrapper.style.marginBottom).toBe('0px');
    } finally { localStorage.removeItem('courses-list-view'); }
  });
  it.each([
    ['all areas', {}],
    ['a country', { country: 'England' }],
    ['a region', { region: 'Kent' }],
  ] as const)('holes are exactly 18 × rounds for %s', (_name, scope) => {
    const figures = browseFiguresForScope(fx.baseRows, scope);
    expect(figures.rounds).toBeGreaterThan(0);
    expect(figures.holes).toBe(figures.rounds * 18);
  });
  it('labels the header COURSES / ROUNDS / HOLES in order with no Plays to', () => {
    const view = render(<ListScopeHeader region={null} country={null} figures={{ courses: 312, rounds: 4314, holes: 77652, avgToPar: -1.2 }} />);
    const text = view.container.textContent ?? '';
    expect(text.indexOf('Courses')).toBeLessThan(text.indexOf('Rounds'));
    expect(text.indexOf('Rounds')).toBeLessThan(text.indexOf('Holes'));
    expect(text).toContain('77,652');
    expect(text).not.toContain('Plays to');
  });
});
