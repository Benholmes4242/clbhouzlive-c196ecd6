import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { A } from '@/features/courses/components/holes/analytical/tokens';

const listMock = vi.fn();
vi.mock('@/components/courses/useStatBrowse', () => ({ useStatBrowseList: (args: unknown) => listMock(args) }));

import { HighestRatedSection } from '@/components/courses/browse/HighestRatedSection';
import { MostPlayedSection } from '@/components/courses/browse/MostPlayedSection';

const baseRow = {
  course_id: 'c1', name: 'Test Course', region: 'Surrey', sub_country: 'England',
  image_url: null, community_rating: 9.4, review_count: 24,
  design_score: 10, condition_score: 9.0, clubhouse_score: 8.9, facilities_score: null,
  members: 3, rounds: 42, avg_to_par: null,
};

const renderRated = (row: Record<string, unknown>) => {
  listMock.mockReturnValue({ rows: [row], isLoading: false });
  return render(<MemoryRouter><HighestRatedSection /></MemoryRouter>);
};

const colorOf = (text: string) => screen.getByText(text).style.color;

beforeEach(() => listMock.mockReset());
afterEach(cleanup);

describe('BRIEF_COURSES_HIGHEST_RATED_TILE_SCORES', () => {
  it('a) breakdown scores at 9.0+ are green, below 9 white, missing is a white dash', () => {
    renderRated(baseRow);
    expect(colorOf('10.0')).toBe(A.GREEN);
    expect(colorOf('9.0')).toBe(A.GREEN);
    expect(colorOf('8.9')).toBe('#FFFFFF');
    expect(colorOf('-')).toBe('#FFFFFF');
  });

  it('b) each of the four breakdown cells is centred', () => {
    renderRated(baseRow);
    for (const label of ['Design', 'Cond', 'House', 'Facil']) {
      const cell = screen.getByText(label).parentElement as HTMLElement;
      expect(cell.style.textAlign).toBe('center');
    }
  });

  it('c) the headline rating is green at 9.0 or more', () => {
    renderRated(baseRow);
    expect(colorOf('9.4')).toBe(A.GREEN);
  });

  it('d) the headline rating is white below 9.0', () => {
    renderRated({ ...baseRow, community_rating: 8.7 });
    expect(colorOf('8.7')).toBe('#FFFFFF');
  });

  it('e) the regulars rail headline figure stays white', () => {
    listMock.mockReturnValue({ rows: [{ ...baseRow, community_rating: 9.4 }], isLoading: false });
    render(<MemoryRouter><MostPlayedSection /></MemoryRouter>);
    expect(colorOf('42')).toBe('#FFFFFF');
  });
});
