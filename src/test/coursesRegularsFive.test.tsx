import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const listMock = vi.fn();
vi.mock('@/components/courses/useStatBrowse', () => ({ useStatBrowseList: (args: unknown) => listMock(args) }));
vi.mock('@/components/courses/browse/PhotoFigureCard', async (orig) => ({
  ...(await orig<typeof import('@/components/courses/browse/PhotoFigureCard')>()),
  PhotoFigureCard: ({ row }: { row: { course_id: string } }) => <div data-tile={row.course_id} />,
}));
vi.mock('@/components/skeletons/shellVocabulary', async (orig) => ({
  ...(await orig<typeof import('@/components/skeletons/shellVocabulary')>()),
  Bar: ({ style }: { style?: React.CSSProperties }) => <div data-bar="" data-w={String(style?.width ?? '')} />,
}));

import { MostPlayedSection } from '@/components/courses/browse/MostPlayedSection';
import { HighestRatedSection } from '@/components/courses/browse/HighestRatedSection';
import { PHOTO_FIGURE_W } from '@/components/courses/browse/PhotoFigureCard';

const rows = Array.from({ length: 7 }, (_, i) => ({ course_id: `c${i}`, course_name: `Course ${i}`, rounds: 10 - i, members: 2, avg_to_par: 5, community_rating: 8.1, review_count: 4 }));
const wrap = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

beforeEach(() => listMock.mockReset());
afterEach(cleanup);

describe('BRIEF_COURSES_REGULARS_FIVE', () => {
  it('a) renders exactly the first five returned rows, in order', () => {
    listMock.mockReturnValue({ rows, isLoading: false });
    const { container } = wrap(<MostPlayedSection />);
    expect([...container.querySelectorAll('[data-tile]')].map(el => el.getAttribute('data-tile'))).toEqual(['c0', 'c1', 'c2', 'c3', 'c4']);
  });

  it('b) asks the list for limit 5', () => {
    listMock.mockReturnValue({ rows, isLoading: false });
    wrap(<MostPlayedSection />);
    expect(listMock).toHaveBeenCalledWith(expect.objectContaining({ lens: 'played', limit: 5 }));
  });

  it('c) loading skeleton holds five tile bars', () => {
    listMock.mockReturnValue({ rows: [], isLoading: true });
    const { container } = wrap(<MostPlayedSection />);
    expect(container.querySelectorAll(`[data-bar][data-w="${PHOTO_FIGURE_W}"]`)).toHaveLength(5);
  });

  it('Highest rated asks for limit 10', () => {
    listMock.mockReturnValue({ rows, isLoading: false });
    wrap(<HighestRatedSection />);
    expect(listMock).toHaveBeenCalledWith(expect.objectContaining({ lens: 'rated', limit: 10 }));
  });
});
