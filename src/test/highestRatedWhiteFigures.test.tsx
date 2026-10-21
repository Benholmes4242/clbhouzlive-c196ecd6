import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { A } from '@/features/courses/components/holes/analytical/tokens';

const listMock = vi.fn();
vi.mock('@/components/courses/useStatBrowse', () => ({ useStatBrowseList: (args: unknown) => listMock(args) }));

import { HighestRatedSection } from '@/components/courses/browse/HighestRatedSection';

/* jsdom normalizes hex to rgb(); probe once so assertions compare like with like. */
const probe = document.createElement('div');
const norm = (c: string) => { probe.style.color = c; return probe.style.color; };
const WHITE = norm('#FFFFFF');
const GREEN = norm(A.GREEN);

const row = (course_id: string, community_rating: number, cat: number) => ({
  course_id, name: `Course ${course_id}`, region: 'Surrey', sub_country: 'England',
  image_url: null, community_rating, review_count: 24,
  design_score: cat, condition_score: cat, clubhouse_score: cat, facilities_score: cat,
  members: 3, rounds: 42, avg_to_par: null,
});

const wrap = () => render(<MemoryRouter><HighestRatedSection /></MemoryRouter>);

/** Every element printing `text` — the headline plus its four category cells — reads white. */
const allWhite = (text: string, count: number) => {
  const els = screen.getAllByText(text);
  expect(els).toHaveLength(count);
  for (const el of els) expect((el as HTMLElement).style.color).toBe(WHITE);
};

beforeEach(() => listMock.mockReset());
afterEach(cleanup);

describe('BRIEF_COURSES_HIGHEST_RATED_WHITE', () => {
  it('a) a ten-point row prints its headline and four category figures in white', () => {
    listMock.mockReturnValue({ rows: [row('c1', 10.0, 10.0)], isLoading: false });
    wrap();
    allWhite('10.0', 5);
  });

  it('b) an 8.4 row prints its headline and four category figures in white', () => {
    listMock.mockReturnValue({ rows: [row('c2', 8.4, 8.4)], isLoading: false });
    wrap();
    allWhite('8.4', 5);
  });

  it('c) both rows on screen at once keep all ten figures white', () => {
    listMock.mockReturnValue({ rows: [row('c1', 10.0, 10.0), row('c2', 8.4, 8.4)], isLoading: false });
    wrap();
    allWhite('10.0', 5);
    allWhite('8.4', 5);
  });

  it('d) 9.0 and above is NOT green in this rail — the review green rule does not apply', () => {
    listMock.mockReturnValue({ rows: [row('c3', 9.4, 9.0)], isLoading: false });
    wrap();
    for (const el of screen.getAllByText('9.4')) expect((el as HTMLElement).style.color).not.toBe(GREEN);
    for (const el of screen.getAllByText('9.0')) expect((el as HTMLElement).style.color).not.toBe(GREEN);
    allWhite('9.4', 1);
    allWhite('9.0', 4);
  });
});
