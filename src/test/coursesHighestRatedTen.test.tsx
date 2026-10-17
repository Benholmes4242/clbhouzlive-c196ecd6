import React from 'react';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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

import { HighestRatedSection } from '@/components/courses/browse/HighestRatedSection';
import { PHOTO_FIGURE_W } from '@/components/courses/browse/PhotoFigureCard';

const rows = Array.from({ length: 12 }, (_, i) => ({
  course_id: `c${i}`, name: `Course ${i}`, community_rating: 9.5 - i / 10,
  review_count: 24 - i, design_score: 9.2, condition_score: 8.8,
  clubhouse_score: 8.4, facilities_score: 8.1,
}));
const wrap = () => render(<MemoryRouter><HighestRatedSection /></MemoryRouter>);

beforeEach(() => listMock.mockReset());
afterEach(cleanup);

describe('BRIEF_COURSES_HIGHEST_RATED_TEN', () => {
  it('a) renders exactly the first ten returned rows, in order', () => {
    listMock.mockReturnValue({ rows, isLoading: false });
    const { container } = wrap();
    expect([...container.querySelectorAll('[data-tile]')].map(el => el.getAttribute('data-tile')))
      .toEqual(['c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9']);
  });

  it('b) keeps the section and all four tiles when only four rows return', () => {
    listMock.mockReturnValue({ rows: rows.slice(0, 4), isLoading: false });
    const { container } = wrap();
    expect(container.querySelectorAll('[data-tile]')).toHaveLength(4);
    expect(container.querySelector('section')).not.toBeNull();
  });

  it('c) loading skeleton holds ten tile bars', () => {
    listMock.mockReturnValue({ rows: [], isLoading: true });
    const { container } = wrap();
    expect(container.querySelectorAll(`[data-bar][data-w="${PHOTO_FIGURE_W}"]`)).toHaveLength(10);
  });

  it('d) no source file references the retired shared count', () => {
    const retiredName = ['PHOTO', 'FIGURE', 'COUNT'].join('_');
    const references: string[] = [];
    const scan = (directory: string) => {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = resolve(directory, entry.name);
        if (entry.isDirectory()) scan(path);
        else if (entry.isFile() && readFileSync(path, 'utf8').includes(retiredName)) references.push(path);
      }
    };
    scan(resolve(process.cwd(), 'src'));
    expect(references).toEqual([]);
  });
});