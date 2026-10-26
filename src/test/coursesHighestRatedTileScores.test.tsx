import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const listMock = vi.fn();
vi.mock('@/components/courses/useStatBrowse', () => ({ useStatBrowseList: (args: unknown) => listMock(args) }));

import { MostPlayedSection } from '@/components/courses/browse/MostPlayedSection';

const baseRow = {
  course_id: 'c1', name: 'Test Course', region: 'Surrey', sub_country: 'England',
  image_url: null, community_rating: 9.4, review_count: 24,
  design_score: 10, condition_score: 9.0, clubhouse_score: 8.9, facilities_score: null,
  members: 3, rounds: 42, avg_to_par: null,
};

const colorOf = (text: string) => screen.getByText(text).style.color;

/* jsdom normalizes hex to rgb(); probe once so assertions compare like with like. */
const probe = document.createElement('div');
const norm = (c: string) => { probe.style.color = c; return probe.style.color; };
const WHITE = norm('#FFFFFF');

beforeEach(() => listMock.mockReset());
afterEach(cleanup);

describe('BRIEF_COURSES_HIGHEST_RATED_TILE_SCORES', () => {
  it('e) the regulars rail headline figure stays white', () => {
    listMock.mockReturnValue({ rows: [{ ...baseRow, community_rating: 9.4 }], isLoading: false });
    render(<MemoryRouter><MostPlayedSection /></MemoryRouter>);
    expect(colorOf('42')).toBe(WHITE);
  });
});
